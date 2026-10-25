// backend/src/modules/notification/adapters/sms.interface.ts

export interface SmsResponse {
  success: boolean;
  providerMsgId?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface ISmsProvider {
  readonly name: string;
  sendSms(to: string, message: string): Promise<SmsResponse>;
}
