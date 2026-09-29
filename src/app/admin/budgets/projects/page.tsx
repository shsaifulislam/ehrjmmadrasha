import { Metadata } from "next";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";

export const metadata: Metadata = {
  title: "উন্নয়ন ও অবকাঠামো প্রকল্প বাজেট | EHRJ Admin",
  description: "মাদরাসার নির্মাণ ও উন্নয়ন প্রকল্পের পৃথক ক্যাপেক্স (CapEx) বাজেট ট্র্যাকিং।",
};

export default function AdminBudgetProjectsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalBudgetConsole initialTab="PROJECTS" />
    </div>
  );
}
