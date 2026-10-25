import path from "path";
import { safeReadJsonSync, atomicWriteFileSync } from "./storageUtils";

export interface AdmissionSettings {
  isOpen: boolean;
  sessionName: string;
  closedMessage: string;
  helplinePhone: string;
  updatedAt: string;
}

export interface PaymentMethodConfig {
  id: string;
  type: "BKASH" | "NAGAD" | "ROCKET" | "BANK" | "CUSTOM";
  nameBn: string;
  accountNumber: string;
  accountType: "MERCHANT" | "PERSONAL" | "BANK_ACCOUNT";
  bankName?: string;
  branchName?: string;
  accountHolderName?: string;
  routingNumber?: string;
  instructions: string;
  isEnabled: boolean;
  apiMode?: "SANDBOX" | "LIVE";
  apiKey?: string;
  apiSecret?: string;
  merchantId?: string;
  updatedAt: string;
}

export interface DocumentAutomationSettings {
  autoIssueIdCardOnAdmission: boolean;
  autoIssueAdmissionConfirmation: boolean;
  autoIssueHifzCertificateOnCompletion: boolean;
  autoIssueMishkatCertificateOnCompletion: boolean;
  autoIssueDawraCertificateOnCompletion: boolean;
  autoIssueCharacterCertificate: boolean;
  autoIssueTestimonial: boolean;
  autoIssuePratyayan: boolean;
  autoIssueTC: boolean;
  authorizedSignatoryTitleBn: string;
  authorizedSignatoryName: string;
  updatedAt: string;
}

export interface SystemSettingsData {
  admission: AdmissionSettings;
  paymentMethods: PaymentMethodConfig[];
  documentAutomation: DocumentAutomationSettings;
}

const SETTINGS_FILE = path.join(process.cwd(), "data", "institutional_settings.json");

const DEFAULT_SETTINGS: SystemSettingsData = {
  admission: {
    isOpen: true,
    sessionName: "২০২৬",
    closedMessage: "বর্তমানে নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম সাময়িকভাবে বন্ধ রয়েছে। পরবর্তী সেশনের ভর্তি বিজ্ঞপ্তি খুব শীঘ্রই ওয়েবসাইটে এবং নোটিশ বোর্ডে প্রকাশ করা হবে। জরুরি তথ্যের জন্য মাদরাসা অফিসে যোগাযোগ করুন।",
    helplinePhone: "01845-162664",
    updatedAt: new Date().toISOString(),
  },
  documentAutomation: {
    autoIssueIdCardOnAdmission: true,
    autoIssueAdmissionConfirmation: true,
    autoIssueHifzCertificateOnCompletion: true,
    autoIssueMishkatCertificateOnCompletion: true,
    autoIssueDawraCertificateOnCompletion: true,
    autoIssueCharacterCertificate: false,
    autoIssueTestimonial: false,
    autoIssuePratyayan: false,
    autoIssueTC: false,
    authorizedSignatoryTitleBn: "মুহতামিম ও অধ্যক্ষ",
    authorizedSignatoryName: "মাওলানা মহা. আবুল কালাম সরকার",
    updatedAt: new Date().toISOString(),
  },
  paymentMethods: [
    {
      id: "pm-bkash-01",
      type: "BKASH",
      nameBn: "বিকাশ (bKash)",
      accountNumber: "01845162664",
      accountType: "MERCHANT",
      instructions: "বিকাশ অ্যাপের 'Payment' অথবা 'Send Money' অপশন ব্যবহার করে নির্ধারিত ফি/অনুদান পরিশোধ করুন এবং প্রাপ্ত ট্রানজেকশন আইডি (TrxID) নিচে প্রদান করুন।",
      isEnabled: true,
      apiMode: "SANDBOX",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "pm-nagad-01",
      type: "NAGAD",
      nameBn: "নগদ (Nagad)",
      accountNumber: "01826416696",
      accountType: "MERCHANT",
      instructions: "নগদ অ্যাপ বা *167# ডায়াল করে পেমেন্ট সম্পন্ন করুন এবং ট্রানজেকশন আইডি সাবমিট করুন।",
      isEnabled: true,
      apiMode: "SANDBOX",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "pm-bank-01",
      type: "BANK",
      nameBn: "অফিসিয়াল ব্যাংক একাউন্ট (Bank Deposit)",
      accountNumber: "",
      accountType: "BANK_ACCOUNT",
      bankName: "",
      branchName: "",
      accountHolderName: "",
      routingNumber: "",
      instructions: "মাদরাসার অফিসিয়াল ব্যাংক একাউন্টে ট্রান্সফার করার জন্য অ্যাডমিন প্যানেল থেকে তথ্য কনফিগার করা হলে এখানে প্রদর্শিত হবে।",
      isEnabled: false,
      updatedAt: new Date().toISOString(),
    },
  ],
};

export function getSystemSettings(): SystemSettingsData {
  return safeReadJsonSync<SystemSettingsData>(SETTINGS_FILE, DEFAULT_SETTINGS);
}

export function saveSystemSettings(data: SystemSettingsData): void {
  atomicWriteFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

export function getAdmissionSettings(): AdmissionSettings {
  const settings = getSystemSettings();
  return settings.admission || DEFAULT_SETTINGS.admission;
}

export function updateAdmissionSettings(updates: Partial<AdmissionSettings>): AdmissionSettings {
  const current = getSystemSettings();
  current.admission = {
    ...current.admission,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveSystemSettings(current);
  return current.admission;
}

export function getPaymentSettings(): PaymentMethodConfig[] {
  const settings = getSystemSettings();
  return settings.paymentMethods || DEFAULT_SETTINGS.paymentMethods;
}

export function getPublicPaymentMethods(): Omit<PaymentMethodConfig, "apiKey" | "apiSecret">[] {
  const methods = getPaymentSettings();
  return methods
    .filter((m) => m.isEnabled)
    .map(({ apiKey, apiSecret, ...safe }) => safe);
}

export function savePaymentMethod(method: PaymentMethodConfig): PaymentMethodConfig[] {
  const current = getSystemSettings();
  const index = current.paymentMethods.findIndex((m) => m.id === method.id);
  const updatedMethod = {
    ...method,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    current.paymentMethods[index] = updatedMethod;
  } else {
    current.paymentMethods.push(updatedMethod);
  }

  saveSystemSettings(current);
  return current.paymentMethods;
}

export function deletePaymentMethod(id: string): PaymentMethodConfig[] {
  const current = getSystemSettings();
  current.paymentMethods = current.paymentMethods.filter((m) => m.id !== id);
  saveSystemSettings(current);
  return current.paymentMethods;
}

export function getDocumentAutomationSettings(): DocumentAutomationSettings {
  const settings = getSystemSettings();
  return settings.documentAutomation || DEFAULT_SETTINGS.documentAutomation;
}

export function updateDocumentAutomationSettings(
  updates: Partial<DocumentAutomationSettings>
): DocumentAutomationSettings {
  const current = getSystemSettings();
  current.documentAutomation = {
    ...(current.documentAutomation || DEFAULT_SETTINGS.documentAutomation),
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveSystemSettings(current);
  return current.documentAutomation;
}


export function togglePaymentMethod(id: string, isEnabled: boolean): PaymentMethodConfig[] {
  const current = getSystemSettings();
  const target = current.paymentMethods.find((m) => m.id === id);
  if (target) {
    target.isEnabled = isEnabled;
    target.updatedAt = new Date().toISOString();
    saveSystemSettings(current);
  }
  return current.paymentMethods;
}
