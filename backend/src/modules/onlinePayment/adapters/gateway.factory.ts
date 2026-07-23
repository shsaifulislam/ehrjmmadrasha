// backend/src/modules/onlinePayment/adapters/gateway.factory.ts

import { IPaymentGateway } from './gateway.interface';
import { BkashAdapter } from './bkash.adapter';
import { NagadAdapter } from './nagad.adapter';
import { MockGatewayAdapter } from './mockGateway.adapter';
import { OnlineGateway } from '@prisma/client';
import { env } from '../../../config/env';

export class PaymentGatewayFactory {
  private static bkashInstance: IPaymentGateway;
  private static nagadInstance: IPaymentGateway;
  private static mockInstance: IPaymentGateway;

  public static getGateway(gatewayType: OnlineGateway): IPaymentGateway {
    if (gatewayType === OnlineGateway.MOCK) {
      if (!this.mockInstance) this.mockInstance = new MockGatewayAdapter();
      return this.mockInstance;
    }

    if (gatewayType === OnlineGateway.BKASH) {
      // Fallback to Mock in development if credentials missing
      if (!env.BKASH_APP_KEY && env.NODE_ENV !== 'production') {
        if (!this.mockInstance) this.mockInstance = new MockGatewayAdapter();
        return this.mockInstance;
      }
      if (!this.bkashInstance) this.bkashInstance = new BkashAdapter();
      return this.bkashInstance;
    }

    if (gatewayType === OnlineGateway.NAGAD) {
      if (!env.NAGAD_MERCHANT_ID && env.NODE_ENV !== 'production') {
        if (!this.mockInstance) this.mockInstance = new MockGatewayAdapter();
        return this.mockInstance;
      }
      if (!this.nagadInstance) this.nagadInstance = new NagadAdapter();
      return this.nagadInstance;
    }

    if (!this.mockInstance) this.mockInstance = new MockGatewayAdapter();
    return this.mockInstance;
  }
}
