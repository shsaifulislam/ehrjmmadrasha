import { Metadata } from "next";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";

export const metadata: Metadata = {
  title: "বাজেট সংস্করণ ইতিহাস ও স্ন্যাপশট | EHRJ Admin",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার অনুমোদিত বাজেট সংস্করণ ইতিহাস।",
};

export default async function BudgetVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalBudgetConsole initialTab="VERSIONS" initialBudgetId={id} />
    </div>
  );
}
