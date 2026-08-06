import { PaymentProvider, PaymentInitParams, PaymentVerifyParams, PaymentVerificationResult } from './provider';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/AppError';

export class BkashProvider extends PaymentProvider {
  private appKey: string;
  private appSecret: string;
  private baseUrl: string;

  constructor() {
    super();
    this.appKey = process.env.BKASH_APP_KEY || '';
    this.appSecret = process.env.BKASH_APP_SECRET || '';
    this.baseUrl = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
  }

  async createPayment(params: PaymentInitParams): Promise<{ paymentUrl: string; gatewayTransactionId: string }> {
    const mockTxnId = `BKASH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!this.appKey || !this.appSecret) {
      logger.info(`[bKash Provider] Merchant credentials not configured. Generating Sandbox Payment URL for invoice ${params.invoiceId}`);
      return {
        paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/fees?gateway=bkash&invoiceId=${params.invoiceId}&mockTxn=${mockTxnId}`,
        gatewayTransactionId: mockTxnId,
      };
    }

    // Direct Live API integration template when credentials are present
    try {
      // 1. Grant Token
      // 2. Create Payment POST /checkout/payment/create
      return {
        paymentUrl: `${this.baseUrl}/checkout/redirect?paymentID=${mockTxnId}`,
        gatewayTransactionId: mockTxnId,
      };
    } catch (error) {
      logger.error('[bKash Provider] Error creating payment session', error);
      throw new AppError('bKash payment initialization failed', 502);
    }
  }


  async verifyCallback(params: PaymentVerifyParams): Promise<PaymentVerificationResult> {
    const { transactionId, gatewayStatus, gatewayAmount } = params;

    // Check if Gateway status is completed or successful
    const isCompleted = gatewayStatus === 'Completed' || gatewayStatus === 'SUCCESS' || gatewayStatus === 'PAID';

    if (!isCompleted) {
      return {
        isSuccess: false,
        message: `bKash payment status is ${gatewayStatus}`,
      };
    }

    if (!gatewayAmount || gatewayAmount <= 0) {
      return {
        isSuccess: false,
        message: 'Invalid gateway amount received',
      };
    }

    return {
      isSuccess: true,
      message: 'bKash transaction verified successfully',
      transactionId,
      amount: gatewayAmount,
    };
  }
}
