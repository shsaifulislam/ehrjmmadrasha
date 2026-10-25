import { Metadata } from "next";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";

export const metadata: Metadata = {
  title: "কোটেশন ও সরবরাহকারী দরপত্র তালিকা | EHRJ Madrasha ERP",
  description: "Submitted Quotations, Version Snapshots (v1, v2), and Price Comparisons",
};

export default function AdminQuotationsPage() {
  return <InstitutionalProcurementConsole initialTab="COMPARISON" />;
}
