import { Metadata } from "next";
import InstitutionalGovernanceConsole from "@/components/knowledge/InstitutionalGovernanceConsole";

export const metadata: Metadata = {
  title: "নীতিমালা দ্বন্দ্ব ও অসঙ্গতি স্ক্যানার | EHRJ Admin",
  description: "দ্বৈত পলিসি, সাংঘর্ষিক মেয়াদ ও ব্যতিক্রমসমূহের নিয়ন্ত্রণ ড্যাশবোর্ড।",
};

export default function AdminKnowledgeConflictsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalGovernanceConsole />
    </div>
  );
}
