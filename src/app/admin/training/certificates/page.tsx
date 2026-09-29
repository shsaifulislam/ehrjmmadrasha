import { Metadata } from "next";
import InstitutionalTrainingConsole from "@/components/training/InstitutionalTrainingConsole";

export const metadata: Metadata = {
  title: "প্রশিক্ষণ সনদপত্র ও কিউআর যাচাই | EHRJ Admin",
  description: "Phase 7/29 অনুসারে ইস্যুকৃত সনদপত্র ও পাবলিক ভেরিফিকেশন লিঙ্ক।",
};

export default function AdminTrainingCertificatesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalTrainingConsole initialTab="CERTIFICATES" />
    </div>
  );
}
