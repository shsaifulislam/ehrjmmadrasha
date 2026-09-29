import { Metadata } from "next";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";

export const metadata: Metadata = {
  title: "বাজেট সংশোধন ও রিভিশন প্রস্তাব | EHRJ Admin",
  description: "বাজেট লাইনের বরাদ্দ বৃদ্ধি বা হ্রাস প্রস্তাব ও অনুমোদনের অডিট ট্রেইল।",
};

export default async function AdminBudgetRevisionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalBudgetConsole initialBudgetId={id} initialTab="REVISIONS" />
    </div>
  );
}
