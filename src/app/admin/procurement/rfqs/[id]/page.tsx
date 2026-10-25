import { Metadata } from "next";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";

export const metadata: Metadata = {
  title: "RFQ বিবরণ ও কোটেশন তুলনা | EHRJ Madrasha ERP",
  description: "RFQ Details, Quotations Versioning, and Factual Comparison Matrix",
};

export default async function RfqDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InstitutionalProcurementConsole initialTab="RFQS" initialRfqId={id} />;
}
