import { Metadata } from "next";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";

export const metadata: Metadata = {
  title: "নতুন প্রাতিষ্ঠানিক বাজেট তৈরি | EHRJ Admin",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার নতুন বার্ষিক বা সেশন বাজেট খসড়া তৈরি।",
};

export default function AdminNewBudgetPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalBudgetConsole initialTab="OVERVIEW" />
    </div>
  );
}
