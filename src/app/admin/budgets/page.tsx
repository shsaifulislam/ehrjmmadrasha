import { Metadata } from "next";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";

export const metadata: Metadata = {
  title: "প্রাতিষ্ঠানিক বাজেট প্ল্যানিং ও ফাইন্যান্সিয়াল কন্ট্রোল | EHRJ Admin",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার তহবিলভিত্তিক বার্ষিক বাজেট, ব্যয় নিয়ন্ত্রণ ও বিচ্যুতি বিশ্লেষণ।",
};

export default function AdminBudgetsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalBudgetConsole initialTab="OVERVIEW" />
    </div>
  );
}
