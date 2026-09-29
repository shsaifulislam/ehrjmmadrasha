import { Metadata } from "next";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";

export const metadata: Metadata = {
  title: "বাজেট মেয়াদ ও সেশন ব্যবস্থাপনা | EHRJ Admin",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার অর্থবছর ও শিক্ষাবর্ষ সেশন মেয়াদ ব্যবস্থাপনা।",
};

export default function AdminBudgetPeriodsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalBudgetConsole initialTab="PERIODS" />
    </div>
  );
}
