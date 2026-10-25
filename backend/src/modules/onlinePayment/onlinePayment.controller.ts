// backend/src/modules/onlinePayment/onlinePayment.controller.ts

import { Request, Response } from 'express';
import { onlinePaymentService } from './onlinePayment.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class OnlinePaymentController {
  async initiatePayment(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const result = await onlinePaymentService.initiatePayment(req.body, authReq.user.id);
    sendCreated(res, result, 'পেমেন্ট ডাইরেকশন ইউআরএল তৈরি হয়েছে');
  }

  async handleCallback(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    // Extract parameters from query or body
    const paymentReference = (req.body.paymentReference || req.query.paymentReference) as string;
    const gatewayPaymentID = (req.body.paymentID || req.query.paymentID || req.query.payment_id) as string;
    const trxID = (req.body.trxID || req.query.trxID || req.query.trx_id) as string;

    const userId = authReq.user?.id || 'SYSTEM_PAYMENT_BOT';
    const result = await onlinePaymentService.verifyAndReconcilePayment(
      { paymentReference, gatewayPaymentID, trxID },
      userId
    );
    sendSuccess(res, result, 'পেমেন্ট সফলভাবে ভেরিফাই ও প্রসেস করা হয়েছে');
  }

  async getTransactions(req: Request, res: Response): Promise<void> {
    const { limit = '50', page = '1' } = req.query as { limit?: string; page?: string };
    const result = await onlinePaymentService.getTransactions(parseInt(limit, 10), parseInt(page, 10));
    sendSuccess(res, result, 'অনলাইন পেমেন্ট ট্রানজ্যাকশন ইতিহাস');
  }
}

export const onlinePaymentController = new OnlinePaymentController();
