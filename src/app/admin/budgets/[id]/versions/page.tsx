import { Metadata } from "next";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";

export const metadata: Metadata = {
  title: "বাজেট সংস্করণ ইতিহাস ও স্ন্যাপশট | EHRJ Admin",
  description: "অনুমোদিত বাজেট সংস্করণের অপরিবর্তনীয় স্ন্যাপশট ও ইতিহাস পর্যালোচনা।",
};

export default async function AdminBudgetVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalBudgetConsole initialBudgetId={id} initialTab="VERSIONS" />
    </div>
  );
}
