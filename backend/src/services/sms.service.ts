import { logger } from '../utils/logger';
import { cacheService } from './cache.service';
import { SmsAdapterFactory } from '../modules/notification/adapters/sms.factory';
import prisma from '../config/prisma';

export interface SmsPayload {
  phone: string;
  message: string;
  idempotencyKey?: string;
  retryCount?: number;
}

class SmsService {
  /**
   * Pushes an SMS job to the non-blocking background queue with idempotency protection.
   */
  public async queueSms(payload: SmsPayload): Promise<void> {
    if (payload.idempotencyKey) {
      const cacheKey = `sms:idempotency:${payload.idempotencyKey}`;
      const isAlreadyProcessed = await cacheService.get<boolean>(cacheKey);

      if (isAlreadyProcessed) {
        logger.info(`[SMS Queue] Idempotent SMS duplicate blocked for key: ${payload.idempotencyKey}`);
        return;
      }

      // Mark idempotency key in cache for 24 hours
      await cacheService.set(cacheKey, true, 86400);
    }

    // Execute asynchronously in background using setImmediate (non-blocking HTTP API)
    setImmediate(() => {
      this.processSmsWithRetry(payload, 1).catch((err) => {
        logger.error(`[SMS Queue] Dead Letter Queue: Failed SMS for ${payload.phone}`, err);
      });
    });
  }

  /**
   * Processes SMS with automatic failover and retry policy.
   */
  private async processSmsWithRetry(payload: SmsPayload, attempt: number): Promise<void> {
    const primaryProviderName = process.env.SMS_PRIMARY_PROVIDER || 'greenweb';
    const fallbackProviderName = process.env.SMS_FALLBACK_PROVIDER || 'bulksmsbd';

    logger.info(`[SMS Queue] Attempt ${attempt} sending SMS to ${payload.phone} via ${primaryProviderName}`);

    let provider = SmsAdapterFactory.getProvider(primaryProviderName);
    let result = await provider.sendSms(payload.phone, payload.message);

    // If primary provider failed, attempt failover provider
    if (!result.success) {
      logger.warn(`[SMS Queue] Primary provider ${primaryProviderName} failed for ${payload.phone}. Attempting failover to ${fallbackProviderName}`);
      provider = SmsAdapterFactory.getProvider(fallbackProviderName);
      result = await provider.sendSms(payload.phone, payload.message);
    }

    if (result.success) {
      logger.info(`[SMS Queue] Successfully sent SMS to ${payload.phone} (MsgID: ${result.providerMsgId || 'N/A'})`);
      return;
    }

    // Retry Logic with exponential backoff if below max retries
    const maxRetries = 3;
    if (attempt < maxRetries) {
      const backoffDelays = [30000, 120000, 600000]; // 30s, 2m, 10m
      const delay = backoffDelays[attempt - 1] || 30000;

      logger.warn(`[SMS Queue] Retry ${attempt}/${maxRetries} failed for ${payload.phone}. Retrying in ${delay / 1000}s...`);

      setTimeout(() => {
        this.processSmsWithRetry(payload, attempt + 1).catch((err) => {
          logger.error(`[SMS Queue] Retry attempt ${attempt + 1} failed`, err);
        });
      }, delay);
    } else {
      logger.error(`[SMS Queue] MAX RETRIES EXCEEDED. SMS to ${payload.phone} moved to Dead Letter Status.`);

      // Log failure in AuditLog
      try {
        await prisma.auditLog.create({
          data: {
            userId: 'SYSTEM',
            action: 'SMS_DEAD_LETTER_FAILED',
            resource: 'SMS',
            details: `SMS প্রেরণ ব্যর্থ: Phone=${payload.phone}, Key=${payload.idempotencyKey || 'N/A'}, Message="${payload.message}"`,
          },
        });
      } catch (logErr) {
        logger.error('Failed to log SMS dead letter audit entry', logErr);
      }
    }
  }

  // --- Sanitized Bengali Notification Hooks (No Private Data Leakage) --- //

  public async sendAdmissionReceivedSms(phone: string, applicantName: string, trackingId: string) {
    const message = `আসসালামু আলাইকুম। ${applicantName}-এর ভর্তি আবেদন পাওয়া গেছে। ট্র্যাকিং আইডি: ${trackingId}। EHRJ Madrasha.`;
    await this.queueSms({
      phone,
      message,
      idempotencyKey: `ADMISSION_SUBMITTED:${trackingId}`,
    });
  }

  public async sendAdmissionApprovedSms(phone: string, applicantName: string, trackingId: string) {
    const message = `আসসালামু আলাইকুম। ${applicantName}-এর ভর্তি আবেদন অনুমোদিত হয়েছে। ট্র্যাকিং আইডি: ${trackingId}। EHRJ Madrasha.`;
    await this.queueSms({
      phone,
      message,
      idempotencyKey: `ADMISSION_APPROVED:${trackingId}`,
    });
  }

  public async sendFeeCollectedSms(phone: string, studentName: string, amount: number, receiptNo: string) {
    const message = `আসসালামু আলাইকুম। ${studentName}-এর ফি বাবদ ৳${amount} পাওয়া গেছে। রসিদ নং: ${receiptNo}। EHRJ Madrasha.`;
    await this.queueSms({
      phone,
      message,
      idempotencyKey: `FEE_COLLECTED:${receiptNo}`,
    });
  }
}

export const smsService = new SmsService();
