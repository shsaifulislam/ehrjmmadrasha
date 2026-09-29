import { Metadata } from "next";
import InstitutionalTrainingConsole from "@/components/training/InstitutionalTrainingConsole";

export const metadata: Metadata = {
  title: "প্রশিক্ষণার্থী ও হাজিরা ব্যবস্থাপনা | EHRJ Admin",
  description: "কর্মী অ্যাসাইনমেন্ট, কিউআর ও ম্যানুয়াল উপস্থিতি ট্র্যাকিং।",
};

export default function AdminTrainingParticipantsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalTrainingConsole initialTab="PARTICIPANTS" />
    </div>
  );
}
