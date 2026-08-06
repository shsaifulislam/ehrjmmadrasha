// backend/src/modules/onlinePayment/adapters/bkash.adapter.ts

import {
  IPaymentGateway,
  CreatePaymentInitInput,
  CreatePaymentInitResponse,
  VerifyPaymentInput,
  VerifyPaymentResponse,
} from './gateway.interface';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';
import { AppError } from '../../../utils/AppError';

export class BkashAdapter implements IPaymentGateway {
  readonly name = 'BKASH';
  private idToken: string | null = null;
  private tokenExpiresAt: number = 0;

  private async grantToken(): Promise<string> {
    if (this.idToken && Date.now() < this.tokenExpiresAt) {
      return this.idToken;
    }

    const apiUrl = env.BKASH_API_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized';
    const appKey = env.BKASH_APP_KEY;
    const appSecret = env.BKASH_APP_SECRET;
    const username = env.BKASH_USERNAME;
    const password = env.BKASH_PASSWORD;

    if (!appKey || !appSecret || !username || !password) {
      throw new AppError('bKash API Credentials are incomplete in environment variables', 500);
    }


    const response = await fetch(`${apiUrl}/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        username,
        password,
      },
      body: JSON.stringify({ app_key: appKey, app_secret: appSecret }),
    });

    const data = (await response.json()) as { id_token?: string; expires_in?: number; statusMessage?: string };

    if (!response.ok || !data.id_token) {
      throw new AppError(`bKash Token Grant Failed: ${data.statusMessage || response.statusText}`, 502);
    }


    this.idToken = data.id_token;
    // Set expiry 5 mins before actual expiry
    this.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000 - 300000;
    return this.idToken;
  }

  async createPaymentRequest(input: CreatePaymentInitInput): Promise<CreatePaymentInitResponse> {
    try {
      const token = await this.grantToken();
      const apiUrl = env.BKASH_API_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized';
      const appKey = env.BKASH_APP_KEY;

      const response = await fetch(`${apiUrl}/checkout/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
          'X-APP-Key': appKey || '',
        },
        body: JSON.stringify({
          mode: '0011',
          payerReference: '01700000000',
          callbackURL: input.callbackUrl,
          amount: input.amount.toFixed(2),
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: input.paymentReference,
        }),
      });

      const data = (await response.json()) as {
        paymentID?: string;
        bkashURL?: string;
        statusCode?: string;
        statusMessage?: string;
      };

      if (data.statusCode === '0000' && data.bkashURL) {
        return {
          success: true,
          gatewayPaymentID: data.paymentID,
          redirectUrl: data.bkashURL,
          rawResponse: data,
        };
      }

      return {
        success: false,
        error: data.statusMessage || 'bKash Create Payment Failed',
        rawResponse: data,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`[bKash Create Error] ${msg}`);
      return { success: false, error: msg };
    }
  }

  async executeAndVerifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResponse> {
    try {
      const token = await this.grantToken();
      const apiUrl = env.BKASH_API_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized';
      const appKey = env.BKASH_APP_KEY;

      const response = await fetch(`${apiUrl}/checkout/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
          'X-APP-Key': appKey || '',
        },
        body: JSON.stringify({ paymentID: input.gatewayPaymentID }),
      });

      const data = (await response.json()) as {
        statusCode?: string;
        statusMessage?: string;
        trxID?: string;
        amount?: string;
        transactionStatus?: string;
      };

      if (data.statusCode === '0000' && data.trxID) {
        return {
          success: true,
          trxID: data.trxID,
          amount: data.amount ? parseFloat(data.amount) : undefined,
          status: 'COMPLETED',
          rawResponse: data,
        };
      }

      return {
        success: false,
        status: data.statusCode === '0100' ? 'CANCELLED' : 'FAILED',
        error: data.statusMessage || 'bKash Execute Payment Failed',
        rawResponse: data,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`[bKash Execute Error] ${msg}`);
      return { success: false, status: 'FAILED', error: msg };
    }
  }
}
