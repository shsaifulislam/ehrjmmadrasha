import { logger } from '../utils/logger';

export interface SmsPayload {
  phone: string;
  message: string;
}

/**
 * SmsService abstraction.
 * It uses asynchronous execution (detached promises / simulated queue) 
 * so that SMS API latency does not block HTTP responses.
 * Later, this can be swapped with a real Message Queue like BullMQ.
 */
class SmsService {
  /**
   * Pushes an SMS to the queue to be processed asynchronously.
   * Does NOT await the actual HTTP request to the SMS Gateway.
   */
  public async queueSms(payload: SmsPayload): Promise<void> {
    // Return immediately to the caller
    // The actual sending happens in the background
    setImmediate(() => {
      this.processSms(payload).catch((err) => {
        logger.error(`Failed to process queued SMS for ${payload.phone}`, err);
      });
    });
  }

  /**
   * Internal method that actually talks to the Gateway API (Greenweb/BulksmsBD).
   */
  private async processSms(payload: SmsPayload): Promise<void> {
    try {
      logger.info(`[SMS Queue] Simulating SMS send to ${payload.phone}: "${payload.message}"`);
      
      // Simulate network latency (e.g., 500ms - 2000ms)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // TODO: Implement actual gateway HTTP call here
      // const response = await axios.post('https://api.greenweb.com.bd/api.php', { ... });
      
      logger.info(`[SMS Queue] Successfully sent SMS to ${payload.phone}`);
    } catch (error) {
      logger.error(`[SMS Queue] Error sending SMS to ${payload.phone}`, error);
      throw error; // Will be caught by the queue error handler
    }
  }

  // --- Convenience Notification Hooks --- //

  public async sendAdmissionReceivedSms(phone: string, applicantName: string, trackingId: string) {
    const msg = `Dear ${applicantName}, your admission application is received. Track ID: ${trackingId}. EHRJ Madrasha.`;
    await this.queueSms({ phone, message: msg });
  }

  public async sendFeeCollectedSms(phone: string, studentName: string, amount: number) {
    const msg = `Received BDT ${amount} for ${studentName}. Thank you. EHRJ Madrasha.`;
    await this.queueSms({ phone, message: msg });
  }
}

export const smsService = new SmsService();
