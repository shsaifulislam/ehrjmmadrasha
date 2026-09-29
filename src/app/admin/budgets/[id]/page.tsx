import { Metadata } from "next";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";

export const metadata: Metadata = {
  title: "বাজেট বিবরণ ও খাতসমূহ | EHRJ Admin",
  description: "নির্দিষ্ট প্রাতিষ্ঠানিক বাজেটের বিস্তারিত লাইন আইটেম ও বরাদ্দ ব্যবস্থাপনা।",
};

export default async function AdminBudgetDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalBudgetConsole initialBudgetId={id} initialTab="LINES" />
    </div>
  );
}
