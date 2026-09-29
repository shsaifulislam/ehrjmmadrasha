import { Metadata } from "next";
import InstitutionalTrainingConsole from "@/components/training/InstitutionalTrainingConsole";

export const metadata: Metadata = {
  title: "প্রশিক্ষণ সনদ নবায়ন ও মেয়াদ তদারকি | EHRJ Admin",
  description: "মেয়াদোত্তীর্ণ ও আসন্ন মেয়াদ শেষ হওয়া সনদের রিনিউয়াল ব্যবস্থাপনা।",
};

export default function AdminTrainingRenewalsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalTrainingConsole initialTab="RENEWALS" />
    </div>
  );
}
