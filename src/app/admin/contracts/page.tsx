import { Metadata } from "next";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";

export const metadata: Metadata = {
  title: "প্রাতিষ্ঠানিক চুক্তিপত্র রেজিস্টার ও ড্যাশবোর্ড | EHRJ Madrasha ERP",
  description: "Institutional Contracts Register, Version Snapshots, Deliverables, and Expiry Reminders",
};

export default function AdminContractsPage() {
  return <InstitutionalProcurementConsole initialTab="CONTRACTS" />;
}
