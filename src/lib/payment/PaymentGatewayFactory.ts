/**
 * EHRJ DIGITAL CAMPUS & ERP — PAYMENT INFRASTRUCTURE
 * Payment Gateway Factory
 */

import { IPaymentGatewayProvider } from "./types";
import { BkashProvider } from "./BkashProvider";
import { NagadProvider } from "./NagadProvider";

export class PaymentGatewayFactory {
  public static getProvider(providerName: string): IPaymentGatewayProvider {
    const prov = providerName.toUpperCase();
    if (prov === "BKASH") {
      return new BkashProvider();
    }
    if (prov === "NAGAD") {
      return new NagadProvider();
    }
    throw new Error(`সমর্থনহীন পেমেন্ট গেটওয়ে প্রোভাইডার: ${providerName}`);
  }
}
