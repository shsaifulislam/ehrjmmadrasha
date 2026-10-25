/**
 * EHRJ DIGITAL CAMPUS & ERP — PAYMENT INFRASTRUCTURE
 * bKash Tokenized Checkout Provider (v1.2.0-beta)
 *
 * Implements official bKash Tokenized Checkout:
 * - Grant Token (with in-memory token cache & auto-refresh)
 * - Create Payment (Initiate)
 * - Execute Payment (Finalize)
 * - Query Payment Status (Verification & Reconciliation)
 * - Refund Payment
 */

import {
  IPaymentGatewayProvider,
  CreatePaymentParams,
  GatewayCreateResult,
  GatewayExecuteResult,
  GatewayQueryResult,
  GatewayRefundParams,
  GatewayRefundResult,
} from "./types";

interface TokenCache {
  idToken: string;
  refreshToken?: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;

export class BkashProvider implements IPaymentGatewayProvider {
  private appKey: string;
  private appSecret: string;
  private username: string;
  private password: string;
  private baseUrl: string;
  private isSandbox: boolean;

  constructor() {
    this.appKey = process.env.BKASH_APP_KEY || "";
    this.appSecret = process.env.BKASH_APP_SECRET || "";
    this.username = process.env.BKASH_USERNAME || "";
    this.password = process.env.BKASH_PASSWORD || "";
    this.baseUrl =
      process.env.BKASH_BASE_URL || "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
    this.isSandbox =
      process.env.BKASH_MODE !== "PRODUCTION" &&
      (!this.baseUrl.includes("pay.bka.sh") || this.baseUrl.includes("sandbox"));
  }

  public getProviderName(): "BKASH" {
    return "BKASH";
  }

  /**
   * Authorize with bKash API and fetch id_token.
   */
  private async getAuthToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt > now + 60000) {
      return cachedToken.idToken;
    }

    // In sandbox without real credentials, return a mock sandbox token
    if (this.isSandbox && (!this.appKey || this.appKey.includes("sandbox_key_***"))) {
      const mockToken = `SANDBOX_BKASH_TOKEN_${Date.now()}`;
      cachedToken = {
        idToken: mockToken,
        expiresAt: now + 3500000,
      };
      return mockToken;
    }

    const res = await fetch(`${this.baseUrl}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        username: this.username,
        password: this.password,
      },
      body: JSON.stringify({
        app_key: this.appKey,
        app_secret: this.appSecret,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    if (!res.ok || !data.id_token) {
      throw new Error(`bKash grant token failed: ${data.statusMessage || res.statusText}`);
    }

    const expiresInSec = Number(data.expires_in) || 3600;
    cachedToken = {
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      expiresAt: now + expiresInSec * 1000,
    };

    return cachedToken.idToken;
  }

  /**
   * Create Payment Intent at bKash Checkout
   */
  public async createPayment(params: CreatePaymentParams): Promise<GatewayCreateResult> {
    try {
      const token = await this.getAuthToken();

      // Sandbox Mock Mode fallback for local testing
      if (token.startsWith("SANDBOX_BKASH_TOKEN_")) {
        const mockPaymentId = `BK-MOCK-PAY-${Date.now()}`;
        return {
          success: true,
          gatewayPaymentId: mockPaymentId,
          checkoutUrl: `${params.callbackUrl}?paymentID=${mockPaymentId}&status=success`,
          rawResponse: {
            paymentID: mockPaymentId,
            statusMessage: "Successful (Sandbox Mock)",
            transactionStatus: "Initiated",
          },
        };
      }

      const res = await fetch(`${this.baseUrl}/tokenized/checkout/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "X-APP-Key": this.appKey,
        },
        body: JSON.stringify({
          mode: "0011",
          payerReference: params.payerPhone || "01700000000",
          callbackURL: params.callbackUrl,
          amount: params.amount.toFixed(2),
          currency: params.currency || "BDT",
          intent: "sale",
          merchantInvoiceNumber: params.intentNumber,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await res.json();
      if (!res.ok || data.statusCode !== "0000" || !data.paymentID) {
        return {
          success: false,
          gatewayPaymentId: "",
          error: data.statusMessage || "bKash পেমেন্ট তৈরি করতে ব্যর্থ হয়েছে।",
          rawResponse: data,
        };
      }

      return {
        success: true,
        gatewayPaymentId: data.paymentID,
        checkoutUrl: data.bkashURL,
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        gatewayPaymentId: "",
        error: `bKash checkout create error: ${err.message}`,
      };
    }
  }

  /**
   * Execute Payment after customer PIN confirmation
   */
  public async executePayment(
    gatewayPaymentId: string,
    additionalParams?: Record<string, any>
  ): Promise<GatewayExecuteResult> {
    try {
      const token = await this.getAuthToken();

      // Sandbox Mock Mode fallback
      if (token.startsWith("SANDBOX_BKASH_TOKEN_") || gatewayPaymentId.startsWith("BK-MOCK-PAY-")) {
        const mockTrxId = `BKS${Date.now().toString().slice(-8)}`;
        return {
          success: true,
          gatewayPaymentId,
          gatewayTransactionId: mockTrxId,
          amount: additionalParams?.amount || 0,
          currency: "BDT",
          paymentStatus: "SUCCESSFUL",
          rawResponse: {
            paymentID: gatewayPaymentId,
            trxID: mockTrxId,
            transactionStatus: "Completed",
          },
        };
      }

      const res = await fetch(`${this.baseUrl}/tokenized/checkout/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "X-APP-Key": this.appKey,
        },
        body: JSON.stringify({ paymentID: gatewayPaymentId }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await res.json();
      if (!res.ok || data.statusCode !== "0000" || data.transactionStatus !== "Completed") {
        return {
          success: false,
          gatewayPaymentId,
          gatewayTransactionId: data.trxID || "",
          amount: Number(data.amount || 0),
          currency: data.currency || "BDT",
          paymentStatus: data.transactionStatus === "Initiated" ? "FAILED" : "CANCELLED",
          error: data.statusMessage || "bKash পেমেন্ট সম্পন্ন হয়নি বা বাতিল হয়েছে।",
          rawResponse: data,
        };
      }

      return {
        success: true,
        gatewayPaymentId: data.paymentID,
        gatewayTransactionId: data.trxID,
        amount: Number(data.amount),
        currency: data.currency || "BDT",
        paymentStatus: "SUCCESSFUL",
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        gatewayPaymentId,
        gatewayTransactionId: "",
        amount: 0,
        currency: "BDT",
        paymentStatus: "FAILED",
        error: `bKash execute error: ${err.message}`,
      };
    }
  }

  /**
   * Query Payment Status for verification & reconciliation
   */
  public async queryPayment(gatewayPaymentId: string): Promise<GatewayQueryResult> {
    try {
      const token = await this.getAuthToken();

      if (token.startsWith("SANDBOX_BKASH_TOKEN_") || gatewayPaymentId.startsWith("BK-MOCK-PAY-")) {
        return {
          success: true,
          gatewayPaymentId,
          status: "SUCCESSFUL",
          amount: 500,
          currency: "BDT",
        };
      }

      const res = await fetch(`${this.baseUrl}/tokenized/checkout/payment/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "X-APP-Key": this.appKey,
        },
        body: JSON.stringify({ paymentID: gatewayPaymentId }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await res.json();
      const statusMap: Record<string, "SUCCESSFUL" | "FAILED" | "PENDING"> = {
        Completed: "SUCCESSFUL",
        Initiated: "PENDING",
        Failed: "FAILED",
      };

      return {
        success: data.statusCode === "0000",
        gatewayPaymentId: data.paymentID,
        gatewayTransactionId: data.trxID,
        amount: Number(data.amount),
        currency: data.currency,
        status: statusMap[data.transactionStatus] || "UNKNOWN",
        rawResponse: data,
        error: data.statusCode !== "0000" ? data.statusMessage : undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        gatewayPaymentId,
        status: "UNKNOWN",
        error: `bKash query error: ${err.message}`,
      };
    }
  }

  /**
   * Refund bKash Payment
   */
  public async refundPayment(params: GatewayRefundParams): Promise<GatewayRefundResult> {
    try {
      const token = await this.getAuthToken();

      if (token.startsWith("SANDBOX_BKASH_TOKEN_")) {
        return {
          success: true,
          refundTrxId: `REF-${Date.now()}`,
          amount: params.amount,
        };
      }

      const res = await fetch(`${this.baseUrl}/tokenized/checkout/payment/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "X-APP-Key": this.appKey,
        },
        body: JSON.stringify({
          paymentID: params.gatewayPaymentId,
          trxID: params.gatewayTransactionId,
          amount: params.amount.toFixed(2),
          sku: "MadrasahFeeRefund",
          reason: params.reason,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await res.json();
      if (!res.ok || data.statusCode !== "0000") {
        return {
          success: false,
          amount: params.amount,
          error: data.statusMessage || "bKash রিফান্ড প্রক্রিয়া ব্যর্থ হয়েছে।",
          rawResponse: data,
        };
      }

      return {
        success: true,
        refundTrxId: data.refundTrxID,
        amount: Number(data.amount),
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        amount: params.amount,
        error: `bKash refund error: ${err.message}`,
      };
    }
  }
}
