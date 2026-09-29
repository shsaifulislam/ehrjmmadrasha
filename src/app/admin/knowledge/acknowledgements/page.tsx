import { Metadata } from "next";
import InstitutionalGovernanceConsole from "@/components/knowledge/InstitutionalGovernanceConsole";

export const metadata: Metadata = {
  title: "নীতিমালা স্বীকৃতি ও কমপ্লায়েন্স ট্র্যাকার | EHRJ Admin",
  description: "শিক্ষক ও কর্মকর্তা কর্মচারীদের প্রাতিষ্ঠানিক আচরণবিধি ও পলিসি স্বীকৃতির লগ।",
};

export default function AdminKnowledgeAcknowledgementsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalGovernanceConsole />
    </div>
  );
}
