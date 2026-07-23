import { PaymentProvider } from './provider';
import { BkashProvider } from './bkash.provider';
import { NagadProvider } from './nagad.provider';
import { SSLCommerzProvider } from './sslcommerz.provider';
import { AppError } from '../../utils/AppError';

export class PaymentFactory {
  public static getProvider(gateway: string): PaymentProvider {
    const normalizedGateway = gateway.toLowerCase();

    switch (normalizedGateway) {
      case 'bkash':
        return new BkashProvider();
      case 'nagad':
        return new NagadProvider();
      case 'sslcommerz':
        return new SSLCommerzProvider();
      default:
        throw new AppError(`অসমর্থিত পেমেন্ট গেটওয়ে: ${gateway}`, 400);
    }
  }
}
