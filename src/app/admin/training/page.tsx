import { Metadata } from "next";
import InstitutionalTrainingConsole from "@/components/training/InstitutionalTrainingConsole";

export const metadata: Metadata = {
  title: "শিক্ষক ও কর্মী প্রশিক্ষণ ও সার্টিফিকেশন হাব | EHRJ Admin",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার শিক্ষক ও কর্মচারীদের প্রফেশনাল ডেভেলপমেন্ট, মূল্যায়ন ও সনদ ব্যবস্থাপনা।",
};

export default function AdminTrainingPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalTrainingConsole initialTab="PROGRAMS" />
    </div>
  );
}
