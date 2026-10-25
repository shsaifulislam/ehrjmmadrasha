import { Metadata } from "next";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";

export const metadata: Metadata = {
  title: "চুক্তিপত্র বিস্তারিত বিবরণ ও সংস্করণ | EHRJ Madrasha ERP",
  description: "Contract Details, Version Snapshots, Deliverables, and Three-Way Match Status",
};

export default async function AdminContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InstitutionalProcurementConsole initialTab="CONTRACTS" initialContractId={id} />;
}
