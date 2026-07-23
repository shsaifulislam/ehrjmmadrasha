// backend/src/modules/notification/adapters/bulksmsbd.adapter.ts

import { ISmsProvider, SmsResponse } from './sms.interface';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';

export class BulkSmsBdAdapter implements ISmsProvider {
  readonly name = 'bulksmsbd';

  async sendSms(to: string, message: string): Promise<SmsResponse> {
    const apiUrl = env.SMS_API_URL || 'http://bulksmsbd.net/api/smsapi';
    const apiKey = env.SMS_API_KEY;
    const senderId = env.SMS_SENDER_ID;

    if (!apiKey) {
      return {
        success: false,
        error: 'BulkSMSBD API Key is missing in environment variables',
      };
    }

    try {
      const url = `${apiUrl}?api_key=${encodeURIComponent(apiKey)}&type=unicode&number=${encodeURIComponent(
        to
      )}&senderid=${encodeURIComponent(senderId || '')}&message=${encodeURIComponent(message)}`;

      const response = await fetch(url);
      const text = await response.text();

      logger.info(`[BulkSMSBD Response] Status: ${response.status} | Body: ${text}`);

      // BulkSMSBD typical response: "1001" or JSON {"response_code": 1002, "success_message": "..."}
      let providerMsgId: string | undefined = undefined;
      let isSuccess = response.ok;

      try {
        const parsed = JSON.parse(text);
        if (parsed.response_code === 202 || parsed.response_code === 1002 || parsed.status === 'success') {
          isSuccess = true;
          providerMsgId = parsed.message_id || parsed.msg_id || `BD-${Date.now()}`;
        } else if (parsed.response_code) {
          isSuccess = false;
        }
      } catch {
        // Plain string response
        if (text.includes('1002') || text.includes('Successfully Sent') || text.includes('1001')) {
          isSuccess = true;
          providerMsgId = `BD-${Date.now()}`;
        }
      }

      return {
        success: isSuccess,
        providerMsgId,
        error: isSuccess ? undefined : text || `HTTP error ${response.status}`,
        rawResponse: text,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`[BulkSMSBD Network Error] ${errorMessage}`);
      return {
        success: false,
        error: `Network Error: ${errorMessage}`,
      };
    }
  }
}
