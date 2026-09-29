import { Metadata } from "next";
import InstitutionalTrainingConsole from "@/components/training/InstitutionalTrainingConsole";

export const metadata: Metadata = {
  title: "প্রশিক্ষণ সেশন ও ক্যালেন্ডার শিডিউল | EHRJ Admin",
  description: "Phase 33 ক্যালেন্ডার সিঙ্কসহ প্রশিক্ষণ সেশন ও ভেন্যু ব্যবস্থাপনা।",
};

export default function AdminTrainingSessionsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalTrainingConsole initialTab="SESSIONS" />
    </div>
  );
}
