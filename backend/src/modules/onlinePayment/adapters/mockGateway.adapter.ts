// backend/src/modules/onlinePayment/adapters/mockGateway.adapter.ts

import {
  IPaymentGateway,
  CreatePaymentInitInput,
  CreatePaymentInitResponse,
  VerifyPaymentInput,
  VerifyPaymentResponse,
} from './gateway.interface';
import { logger } from '../../../utils/logger';

export class MockGatewayAdapter implements IPaymentGateway {
  readonly name = 'MOCK';

  async createPaymentRequest(input: CreatePaymentInitInput): Promise<CreatePaymentInitResponse> {
    const mockPaymentID = `MOCK-PAY-${Date.now()}`;
    const redirectUrl = `${input.callbackUrl}?paymentReference=${encodeURIComponent(
      input.paymentReference
    )}&paymentID=${mockPaymentID}&status=success`;

    logger.info(`[MOCK GATEWAY INIT] Ref: ${input.paymentReference} | Amount: ৳${input.amount} | Redirect: ${redirectUrl}`);

    return {
      success: true,
      gatewayPaymentID: mockPaymentID,
      redirectUrl,
      rawResponse: { mockStatus: 'INITIATED', timestamp: new Date().toISOString() },
    };
  }

  async executeAndVerifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResponse> {
    const mockTrxID = input.trxID || `TRX-MOCK-${Date.now()}`;
    logger.info(`[MOCK GATEWAY VERIFY] Ref: ${input.paymentReference} | TrxID: ${mockTrxID}`);

    return {
      success: true,
      trxID: mockTrxID,
      status: 'COMPLETED',
      rawResponse: { mockStatus: 'VERIFIED', trxID: mockTrxID },
    };
  }
}
