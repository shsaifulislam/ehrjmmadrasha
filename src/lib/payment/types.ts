/**
 * EHRJ DIGITAL CAMPUS & ERP — PAYMENT INFRASTRUCTURE
 * Common Gateway Interfaces & Payment Types
 */

export interface CreatePaymentParams {
  intentId: string;
  intentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  studentName: string;
  amount: number;
  currency: string;
  payerPhone?: string;
  callbackUrl: string;
}

export interface GatewayCreateResult {
  success: boolean;
  gatewayPaymentId: string;
  checkoutUrl?: string;
  rawResponse?: any;
  error?: string;
}

export interface GatewayExecuteResult {
  success: boolean;
  gatewayTransactionId: string;
  gatewayPaymentId: string;
  amount: number;
  currency: string;
  paymentStatus: "SUCCESSFUL" | "FAILED" | "CANCELLED";
  rawResponse?: any;
  error?: string;
}

export interface GatewayQueryResult {
  success: boolean;
  gatewayTransactionId?: string;
  gatewayPaymentId: string;
  amount?: number;
  currency?: string;
  status: "SUCCESSFUL" | "FAILED" | "PENDING" | "UNKNOWN";
  rawResponse?: any;
  error?: string;
}

export interface GatewayRefundParams {
  paymentReceiptId: string;
  gatewayTransactionId: string;
  gatewayPaymentId?: string;
  amount: number;
  reason: string;
}

export interface GatewayRefundResult {
  success: boolean;
  refundTrxId?: string;
  amount: number;
  rawResponse?: any;
  error?: string;
}

export interface IPaymentGatewayProvider {
  getProviderName(): "BKASH" | "NAGAD" | "BANK";
  createPayment(params: CreatePaymentParams): Promise<GatewayCreateResult>;
  executePayment(gatewayPaymentId: string, additionalParams?: Record<string, any>): Promise<GatewayExecuteResult>;
  queryPayment(gatewayPaymentId: string): Promise<GatewayQueryResult>;
  refundPayment?(params: GatewayRefundParams): Promise<GatewayRefundResult>;
}
