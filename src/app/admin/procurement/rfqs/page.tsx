import { Metadata } from "next";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";

export const metadata: Metadata = {
  title: "RFQ ও কোটেশন বিজ্ঞপ্তি | EHRJ Madrasha ERP",
  description: "Request for Quotations, Tenders, and Submissions",
};

export default function RfqsPage() {
  return <InstitutionalProcurementConsole initialTab="RFQS" />;
}
