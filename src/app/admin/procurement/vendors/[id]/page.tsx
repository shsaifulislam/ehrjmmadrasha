import { Metadata } from "next";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";

export const metadata: Metadata = {
  title: "ভেন্ডর বিবরণ ও সত্যতা যাচাই | EHRJ Madrasha ERP",
  description: "Vendor Profile, Verifications, Rating, and Active Contracts",
};

export default async function VendorDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InstitutionalProcurementConsole initialTab="VENDORS" initialVendorId={id} />;
}
