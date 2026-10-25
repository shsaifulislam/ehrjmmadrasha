import { PaymentProvider, PaymentInitParams, PaymentVerifyParams, PaymentVerificationResult } from './provider';
import { logger } from '../../utils/logger';

export class NagadProvider extends PaymentProvider {
  private merchantId: string;

  constructor() {
    super();
    this.merchantId = process.env.NAGAD_MERCHANT_ID || '';
  }

  async createPayment(params: PaymentInitParams): Promise<{ paymentUrl: string; gatewayTransactionId: string }> {
    const mockTxnId = `NAGAD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!this.merchantId) {
      logger.info(`[Nagad Provider] Merchant ID not configured. Generating Sandbox Payment URL for invoice ${params.invoiceId}`);
      return {
        paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/fees?gateway=nagad&invoiceId=${params.invoiceId}&mockTxn=${mockTxnId}`,
        gatewayTransactionId: mockTxnId,
      };
    }

    return {
      paymentUrl: `https://sandbox.mynagad.com/check-out/pay/${mockTxnId}`,
      gatewayTransactionId: mockTxnId,
    };
  }

  async verifyCallback(params: PaymentVerifyParams): Promise<PaymentVerificationResult> {
    const { transactionId, gatewayStatus, gatewayAmount } = params;

    const isSuccess = gatewayStatus === 'Success' || gatewayStatus === 'SUCCESS' || gatewayStatus === 'PAID';

    if (!isSuccess) {
      return {
        isSuccess: false,
        message: `Nagad payment status is ${gatewayStatus}`,
      };
    }

    return {
      isSuccess: true,
      message: 'Nagad transaction verified successfully',
      transactionId,
      amount: gatewayAmount,
    };
  }
}
