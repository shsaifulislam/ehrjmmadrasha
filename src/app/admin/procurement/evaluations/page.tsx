import { Metadata } from "next";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";

export const metadata: Metadata = {
  title: "প্রকিউরমেন্ট মূল্যায়ন ও কমিটি সিদ্ধান্ত | EHRJ Madrasha ERP",
  description: "Procurement Committee Evaluations, Multi-Criteria Scoring, and Human Award Authority",
};

export default function AdminEvaluationsPage() {
  return <InstitutionalProcurementConsole initialTab="COMPARISON" />;
}
