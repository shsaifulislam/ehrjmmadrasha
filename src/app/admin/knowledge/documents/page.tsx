import { Metadata } from "next";
import InstitutionalGovernanceConsole from "@/components/knowledge/InstitutionalGovernanceConsole";

export const metadata: Metadata = {
  title: "মাস্টার ডকুমেন্টস ও নীতিমালা | EHRJ Admin",
  description: "প্রাতিষ্ঠানিক ডকুমেন্টস, এসওপি এবং হ্যান্ডবুক মাস্টার রিপোজিটরি।",
};

export default function AdminKnowledgeDocumentsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalGovernanceConsole />
    </div>
  );
}
