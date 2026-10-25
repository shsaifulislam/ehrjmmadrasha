import { Metadata } from "next";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";

export const metadata: Metadata = {
  title: "উন্নয়ন ও নির্মাণ প্রকল্প বাজেট | EHRJ Admin",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার বিশেষ উন্নয়ন ও নির্মাণ প্রকল্প বাজেট ট্র্যাকিং।",
};

export default function BudgetProjectsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalBudgetConsole initialTab="PROJECTS" />
    </div>
  );
}
