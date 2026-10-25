import path from "path";
import { safeReadJsonSync, atomicWriteFileSync } from "@/lib/storageUtils";
import { FUND_CATEGORIES } from "@/lib/donationConstants";
export { FUND_CATEGORIES };

export interface DonationRecord {
  id: string;
  receiptNumber: string;
  donorName: string;
  donorPhone: string;
  donorEmail?: string;
  donorAddress?: string;
  fundCategory: "ORPHAN_LILLAH" | "HIFZ_SPONSOR" | "ZAKAT" | "SADAQAH" | "ANNUAL_MAHFIL" | "TEACHER_WELFARE" | "CONSTRUCTION" | "GENERAL";
  fundCategoryBn: string;
  amount: number;
  paymentMethod: string;
  paymentMethodBn: string;
  transactionId: string;
  isAnonymous: boolean;
  notes?: string;
  status: "COMPLETED" | "PENDING_VERIFICATION";
  verificationToken: string;
  createdAt: string;
}

const DONATIONS_FILE = path.join(process.cwd(), "data", "donations.json");

export function getAllDonations(): DonationRecord[] {
  return safeReadJsonSync<DonationRecord[]>(DONATIONS_FILE, []);
}

export function saveDonations(donations: DonationRecord[]): void {
  atomicWriteFileSync(DONATIONS_FILE, JSON.stringify(donations, null, 2));
}

export function getDonationByReceipt(receiptNumber: string): DonationRecord | null {
  const all = getAllDonations();
  return all.find((d) => d.receiptNumber.toUpperCase() === receiptNumber.toUpperCase()) || null;
}

export function getDonationByTokenOrReceipt(tokenOrReceipt: string): DonationRecord | null {
  const clean = tokenOrReceipt.trim().toUpperCase();
  const all = getAllDonations();
  return all.find((d) => d.receiptNumber.toUpperCase() === clean || d.verificationToken.toUpperCase() === clean || d.id.toUpperCase() === clean) || null;
}

export function createDonation(data: {
  donorName: string;
  donorPhone: string;
  donorEmail?: string;
  donorAddress?: string;
  fundCategory: string;
  amount: number;
  paymentMethod: string;
  paymentMethodBn?: string;
  transactionId: string;
  isAnonymous?: boolean;
  notes?: string;
}): DonationRecord {
  const all = getAllDonations();
  const year = new Date().getFullYear();
  const count = all.length + 1;
  const seq = String(count).padStart(5, "0");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

  const id = `DON-${year}-${seq}`;
  const receiptNumber = `EHRJ-REC-${year}-${seq}`;
  const verificationToken = `VRF-${year}-${seq}-${randomSuffix}`;

  const categoryMeta = FUND_CATEGORIES[data.fundCategory] || FUND_CATEGORIES.GENERAL;

  const newDonation: DonationRecord = {
    id,
    receiptNumber,
    donorName: data.isAnonymous ? "গোপন দাতা (সাদাকাহ লিল্লাহ)" : (data.donorName.trim() || "সম্মানিত শুভাকাঙ্ক্ষী"),
    donorPhone: data.donorPhone.trim(),
    donorEmail: data.donorEmail?.trim(),
    donorAddress: data.donorAddress?.trim(),
    fundCategory: (data.fundCategory as any) || "ORPHAN_LILLAH",
    fundCategoryBn: categoryMeta.bn,
    amount: Number(data.amount),
    paymentMethod: data.paymentMethod,
    paymentMethodBn: data.paymentMethodBn || data.paymentMethod,
    transactionId: data.transactionId.trim(),
    isAnonymous: !!data.isAnonymous,
    notes: data.notes?.trim(),
    status: "COMPLETED",
    verificationToken,
    createdAt: new Date().toISOString(),
  };

  all.unshift(newDonation);
  saveDonations(all);
  return newDonation;
}

export function updateDonationStatus(
  id: string,
  status: "COMPLETED" | "PENDING_VERIFICATION",
  notes?: string
): DonationRecord | null {
  const all = getAllDonations();
  const index = all.findIndex((d) => d.id === id);
  if (index === -1) return null;

  all[index].status = status;
  if (notes !== undefined) {
    all[index].notes = notes;
  }
  saveDonations(all);
  return all[index];
}

export function deleteDonation(id: string): boolean {
  const all = getAllDonations();
  const filtered = all.filter((d) => d.id !== id);
  if (filtered.length === all.length) return false;
  saveDonations(filtered);
  return true;
}
