import { PaymentProvider, PaymentInitParams, PaymentVerifyParams, PaymentVerificationResult } from './provider';
import { logger } from '../../utils/logger';

export class SSLCommerzProvider extends PaymentProvider {
  private storeId: string;

  constructor() {
    super();
    this.storeId = process.env.SSLCOMMERZ_STORE_ID || '';
  }

  async createPayment(params: PaymentInitParams): Promise<{ paymentUrl: string; gatewayTransactionId: string }> {
    const mockTxnId = `SSLC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!this.storeId) {
      logger.info(`[SSLCommerz Provider] Store ID not configured. Generating Sandbox Payment URL for invoice ${params.invoiceId}`);
      return {
        paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/fees?gateway=sslcommerz&invoiceId=${params.invoiceId}&mockTxn=${mockTxnId}`,
        gatewayTransactionId: mockTxnId,
      };
    }

    return {
      paymentUrl: `https://sandbox.sslcommerz.com/gwprocess/v4/api.php?tran_id=${mockTxnId}`,
      gatewayTransactionId: mockTxnId,
    };
  }

  async verifyCallback(params: PaymentVerifyParams): Promise<PaymentVerificationResult> {
    const { transactionId, gatewayStatus, gatewayAmount } = params;

    const isValid = gatewayStatus === 'VALID' || gatewayStatus === 'VALIDATED' || gatewayStatus === 'SUCCESS' || gatewayStatus === 'PAID';

    if (!isValid) {
      return {
        isSuccess: false,
        message: `SSLCommerz status is ${gatewayStatus}`,
      };
    }

    return {
      isSuccess: true,
      message: 'SSLCommerz transaction verified successfully',
      transactionId,
      amount: gatewayAmount,
    };
  }
}
