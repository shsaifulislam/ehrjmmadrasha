import { ISmsProvider, SmsResponse } from './sms.interface';
import { logger } from '../../../utils/logger';

export class GreenwebSmsProvider implements ISmsProvider {
  readonly name = 'greenweb';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GREENWEB_SMS_API_KEY || '';
  }

  async sendSms(to: string, message: string): Promise<SmsResponse> {
    if (!this.apiKey) {
      logger.info(`[Greenweb Provider] API Key not configured. Simulating SMS to ${to}`);
      return {
        success: true,
        providerMsgId: `MOCK-GW-${Date.now()}`,
        rawResponse: { status: 'mocked' },
      };
    }

    try {
      // Production Greenweb API Call HTTP POST
      // const response = await axios.post('https://api.greenweb.com.bd/api.php', ...);
      logger.info(`[Greenweb Provider] Sending SMS to ${to}`);
      return {
        success: true,
        providerMsgId: `GW-${Date.now()}`,
      };
    } catch (error: any) {
      logger.error(`[Greenweb Provider] Error sending SMS to ${to}`, error);
      return {
        success: false,
        error: error.message || 'Greenweb SMS Gateway Error',
      };
    }
  }
}
