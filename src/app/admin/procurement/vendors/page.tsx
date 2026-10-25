import { Metadata } from "next";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";

export const metadata: Metadata = {
  title: "ভেন্ডর মাস্টার ও সরবরাহকারী রেজিস্ট্রি | EHRJ Madrasha ERP",
  description: "Institutional Vendor Master, Verification Checklist, and Performance Tracking",
};

export default function VendorsPage() {
  return <InstitutionalProcurementConsole initialTab="VENDORS" />;
}
