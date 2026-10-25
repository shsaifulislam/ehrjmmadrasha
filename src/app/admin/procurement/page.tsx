import { Metadata } from "next";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";

export const metadata: Metadata = {
  title: "প্রকিউরমেন্ট, সরবরাহকারী ও চুক্তি নিয়ন্ত্রণ | EHRJ Madrasha ERP",
  description:
    "Vendor Master, Quotation Versioning, Factual Comparison, and Institutional Contract Lifecycle Management",
};

export default function AdminProcurementPage() {
  return <InstitutionalProcurementConsole initialTab="OVERVIEW" />;
}
