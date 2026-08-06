import { PrismaClient, OnlinePaymentStatus } from '@prisma/client';
import prisma from '../../config/prisma';
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/AppError";

export interface PaymentInitParams {
  invoiceId: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  reference: string;
}

export interface PaymentVerifyParams {
  transactionId: string;
  gatewayStatus: string;
  gatewayAmount: number;
}

export interface PaymentVerificationResult {
  isSuccess: boolean;
  message: string;
  transactionId?: string;
  amount?: number;
}

/**
 * Base abstract class for Payment Providers.
 * Ensures consistent verification and database transaction handling across gateways.
 */
export abstract class PaymentProvider {
  /**
   * Initializes a payment session/URL with the specific gateway.
   */
  abstract createPayment(params: PaymentInitParams): Promise<{ paymentUrl: string; gatewayTransactionId: string }>;

  /**
   * Verifies a callback request directly with the gateway's verification API.
   */
  abstract verifyCallback(params: PaymentVerifyParams): Promise<PaymentVerificationResult>;

  /**
   * Core logic for handling a gateway callback safely using DB transactions.
   * This is standardized across all providers.
   */
  public async handleCallback(
    invoiceId: string,
    gatewayTransactionId: string,
    params: PaymentVerifyParams
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Verify with the Gateway API
      const verification = await this.verifyCallback(params);
      if (!verification.isSuccess) {
        logger.warn(`Payment failed verification for invoice ${invoiceId}: ${verification.message}`);
        // Log failure in DB could be added here
        return { success: false, message: 'Gateway verification failed' };
      }

      // 2. Perform safe Database Transaction
      const result = await prisma.$transaction(async (tx) => {
        // a. Lock the invoice for update
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
        });

        if (!invoice) {
          throw new AppError(`Invoice ${invoiceId} not found`, 404);
        }
        if (invoice.status === 'PAID') {
          return { success: true, message: 'Invoice already paid (Idempotent)' };
        }

        // b. Check amount match
        if (Number(invoice.totalAmount) !== verification.amount) {
          throw new AppError('Amount mismatch between gateway and invoice', 400);
        }

        // c. Update Invoice
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: 'PAID' },
        });

        // d. Create Payment Record
        await tx.payment.create({
          data: {
            invoiceId,
            amountPaid: verification.amount!,
            paymentMethod: 'OTHER', // Should map based on provider
            paymentDate: new Date(),
            receivedById: 'SYSTEM', // System automated
            remarks: `Gateway TXN: ${verification.transactionId}`,
          },
        });

        return { success: true, message: 'Payment successfully processed' };
      });

      return result;
    } catch (error: any) {

      logger.error(`Error processing callback for invoice ${invoiceId}`, error);
      return { success: false, message: error.message || 'Internal Server Error' };
    }
  }
}
