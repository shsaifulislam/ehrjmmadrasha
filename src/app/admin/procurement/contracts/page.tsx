import { Metadata } from "next";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";

export const metadata: Metadata = {
  title: "প্রাতিষ্ঠানিক চুক্তিপত্র ও সংস্করণ রেজিস্ট্রি | EHRJ Madrasha ERP",
  description: "Contract Lifecycle, Version Snapshots, 3-Way Match, and Renewal Reminders",
};

export default function ContractsPage() {
  return <InstitutionalProcurementConsole initialTab="CONTRACTS" />;
}
