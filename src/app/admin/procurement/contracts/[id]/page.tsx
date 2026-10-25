import { Metadata } from "next";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";

export const metadata: Metadata = {
  title: "চুক্তি বিবরণ ও সংস্করণ ইতিহাস | EHRJ Madrasha ERP",
  description: "Contract Details, Version Snapshots, Deliverables, and Three-Way Match",
};

export default async function ContractDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InstitutionalProcurementConsole initialTab="CONTRACTS" initialContractId={id} />;
}
