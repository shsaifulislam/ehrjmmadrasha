// backend/src/modules/onlinePayment/adapters/nagad.adapter.ts

import {
  IPaymentGateway,
  CreatePaymentInitInput,
  CreatePaymentInitResponse,
  VerifyPaymentInput,
  VerifyPaymentResponse,
} from './gateway.interface';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';

export class NagadAdapter implements IPaymentGateway {
  readonly name = 'NAGAD';

  async createPaymentRequest(input: CreatePaymentInitInput): Promise<CreatePaymentInitResponse> {
    try {
      const merchantId = env.NAGAD_MERCHANT_ID;
      const apiUrl = env.NAGAD_API_URL || 'https://sandbox.mypay.com.bd/api/dfs';

      if (!merchantId) {
        return { success: false, error: 'Nagad Merchant ID missing in environment variables' };
      }

      // Nagad API initialization structure
      const response = await fetch(`${apiUrl}/check-out/initialize/${merchantId}/${input.paymentReference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: '01700000000',
          dateTime: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
          sensitiveData: 'nagad_encrypted_payload',
          signature: 'nagad_signature',
        }),
      });

      const data = (await response.json()) as { callBackUrl?: string; sensitiveData?: string; status?: string };

      if (data.callBackUrl || data.status === 'SUCCESS') {
        return {
          success: true,
          gatewayPaymentID: input.paymentReference,
          redirectUrl: data.callBackUrl || input.callbackUrl,
          rawResponse: data,
        };
      }

      return { success: false, error: 'Nagad Init Failed', rawResponse: data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`[Nagad Create Error] ${msg}`);
      return { success: false, error: msg };
    }
  }

  async executeAndVerifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResponse> {
    try {
      const merchantId = env.NAGAD_MERCHANT_ID;
      const apiUrl = env.NAGAD_API_URL || 'https://sandbox.mypay.com.bd/api/dfs';

      const response = await fetch(`${apiUrl}/verify/payment/${input.paymentReference}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = (await response.json()) as { status?: string; issuerPaymentRefNo?: string; amount?: string };

      if (data.status === 'Success' || data.status === 'COMPLETED') {
        const trxID = data.issuerPaymentRefNo || input.trxID || `NGD-${Date.now()}`;
        return {
          success: true,
          trxID,
          amount: data.amount ? parseFloat(data.amount) : undefined,
          status: 'COMPLETED',
          rawResponse: data,
        };
      }

      return {
        success: false,
        status: data.status === 'Aborted' ? 'CANCELLED' : 'FAILED',
        error: `Nagad Status: ${data.status || 'FAILED'}`,
        rawResponse: data,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`[Nagad Verify Error] ${msg}`);
      return { success: false, status: 'FAILED', error: msg };
    }
  }
}
