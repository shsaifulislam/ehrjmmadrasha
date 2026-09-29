import { Metadata } from "next";
import InstitutionalGovernanceConsole from "@/components/knowledge/InstitutionalGovernanceConsole";

export const metadata: Metadata = {
  title: "নীতিমালা পর্যালোচনা ও অনুমোদন কিউ | EHRJ Admin",
  description: "প্রিন্সিপাল ও প্রশাসনিক অনুমোদন অপেক্ষমাণ খসড়া নীতিমালার তালিকা।",
};

export default function AdminKnowledgeReviewsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalGovernanceConsole />
    </div>
  );
}
