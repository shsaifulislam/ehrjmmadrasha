// backend/src/modules/notification/adapters/sms.factory.ts

import { ISmsProvider } from './sms.interface';
import { MockSmsAdapter } from './mock.adapter';
import { BulkSmsBdAdapter } from './bulksmsbd.adapter';
import { GreenwebSmsProvider } from './greenweb.adapter';

export class SmsAdapterFactory {
  private static instance: ISmsProvider;

  public static getProvider(providerOverride?: string): ISmsProvider {
    const providerName = (providerOverride || process.env.SMS_PROVIDER || 'mock').toLowerCase();

    switch (providerName) {
      case 'greenweb':
        return new GreenwebSmsProvider();
      case 'bulksmsbd':
        return new BulkSmsBdAdapter();
      case 'mock':
      default:
        return new MockSmsAdapter();
    }
  }
}
