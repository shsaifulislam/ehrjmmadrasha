import { Metadata } from "next";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";

export const metadata: Metadata = {
  title: "বাজেট বিচ্যুতি ও ঘাটতি বিশ্লেষণ | EHRJ Admin",
  description: "পরিকল্পিত ব্যয় বনাম প্রকৃত ব্যয় ও প্রতিশ্রুতির তুলনামূলক বিচ্যুতি বিশ্লেষণ।",
};

export default async function AdminBudgetVariancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalBudgetConsole initialBudgetId={id} initialTab="VARIANCE" />
    </div>
  );
}
