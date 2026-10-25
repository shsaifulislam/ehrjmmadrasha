import { Metadata } from "next";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";

export const metadata: Metadata = {
  title: "বাজেট বিচ্যুতি বিশ্লেষণ ও ব্যয় নিয়ন্ত্রণ | EHRJ Admin",
  description: "পরিকল্পিত বনাম প্রকৃত ব্যয় বিচ্যুতি ও বাজেট নিয়ন্ত্রণ সতর্কতা।",
};

export default async function BudgetVariancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalBudgetConsole initialTab="VARIANCE" initialBudgetId={id} />
    </div>
  );
}
