import { Metadata } from "next";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";

export const metadata: Metadata = {
  title: "ভেন্ডর ও সরবরাহকারী মাস্টার | EHRJ Madrasha ERP",
  description: "Institutional Vendor Master Directory, Verification, and Performance Tracking",
};

export default function AdminVendorsPage() {
  return <InstitutionalProcurementConsole initialTab="VENDORS" />;
}
