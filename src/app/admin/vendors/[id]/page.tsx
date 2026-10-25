import { Metadata } from "next";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";

export const metadata: Metadata = {
  title: "ভেন্ডর প্রোফাইল ও বিশদ বিবরণ | EHRJ Madrasha ERP",
  description: "Vendor Profile, Verification Records, Documents, Contracts, and Audit Trail",
};

export default async function AdminVendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InstitutionalProcurementConsole initialTab="VENDORS" initialVendorId={id} />;
}
