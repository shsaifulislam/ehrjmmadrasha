import { Metadata } from "next";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";

export const metadata: Metadata = {
  title: "বাজেট সংশোধন ও অনুমোদন প্রস্তাবনা | EHRJ Admin",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার বাজেট রিভিশন ও সংশোধন ব্যবস্থাপনা।",
};

export default async function BudgetRevisionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalBudgetConsole initialTab="REVISIONS" initialBudgetId={id} />
    </div>
  );
}
