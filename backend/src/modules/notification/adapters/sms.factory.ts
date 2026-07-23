// backend/src/modules/notification/adapters/sms.factory.ts

import { ISmsProvider } from './sms.interface';
import { MockSmsAdapter } from './mock.adapter';
import { BulkSmsBdAdapter } from './bulksmsbd.adapter';
import { env } from '../../../config/env';

export class SmsAdapterFactory {
  private static instance: ISmsProvider;

  public static getProvider(): ISmsProvider {
    if (!this.instance) {
      const providerName = env.SMS_PROVIDER;

      if (env.NODE_ENV === 'production' && providerName === 'mock') {
        throw new Error('Production safety violation: Cannot use mock SMS adapter in production environment.');
      }

      switch (providerName) {
        case 'bulksmsbd':
          this.instance = new BulkSmsBdAdapter();
          break;
        case 'mock':
        default:
          this.instance = new MockSmsAdapter();
          break;
      }
    }
    return this.instance;
  }
}
