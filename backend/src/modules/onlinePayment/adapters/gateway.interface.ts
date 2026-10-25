// backend/src/modules/onlinePayment/adapters/gateway.interface.ts

export interface CreatePaymentInitInput {
  paymentReference: string;
  amount: number;
  invoiceId: string;
  callbackUrl: string;
}

export interface CreatePaymentInitResponse {
  success: boolean;
  gatewayPaymentID?: string;
  redirectUrl?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface VerifyPaymentInput {
  paymentReference: string;
  gatewayPaymentID?: string;
  trxID?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  trxID?: string;
  amount?: number;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  error?: string;
  rawResponse?: unknown;
}

export interface IPaymentGateway {
  readonly name: string;
  createPaymentRequest(input: CreatePaymentInitInput): Promise<CreatePaymentInitResponse>;
  executeAndVerifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResponse>;
}
