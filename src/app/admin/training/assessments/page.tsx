import { Metadata } from "next";
import InstitutionalTrainingConsole from "@/components/training/InstitutionalTrainingConsole";

export const metadata: Metadata = {
  title: "প্রশিক্ষণ মূল্যায়ন ও গ্রেডিং | EHRJ Admin",
  description: "পেশাগত কুইজ, ফলাফল ও মূল্যায়নের নির্ভরযোগ্য ট্র্যাকিং।",
};

export default function AdminTrainingAssessmentsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalTrainingConsole initialTab="ASSESSMENTS" />
    </div>
  );
}
