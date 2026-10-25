// backend/src/modules/notification/adapters/mock.adapter.ts

import { ISmsProvider, SmsResponse } from './sms.interface';
import { logger } from '../../../utils/logger';

export class MockSmsAdapter implements ISmsProvider {
  readonly name = 'mock';

  async sendSms(to: string, message: string): Promise<SmsResponse> {
    const mockId = `MOCK-MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    logger.info(`[MOCK SMS PROVIDER] To: ${to} | Message: "${message}" | MockID: ${mockId}`);
    return {
      success: true,
      providerMsgId: mockId,
      rawResponse: { status: 'mock_delivered', timestamp: new Date().toISOString() },
    };
  }
}
