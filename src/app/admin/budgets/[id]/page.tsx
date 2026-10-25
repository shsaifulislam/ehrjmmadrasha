import { Metadata } from "next";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";

export const metadata: Metadata = {
  title: "বাজেট বিস্তারিত ও লাইন এন্ট্রি | EHRJ Admin",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার বাজেট বিবরণী ও আয়-ব্যয় লাইন এন্ট্রি।",
};

export default async function BudgetDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalBudgetConsole initialTab="LINES" initialBudgetId={id} />
    </div>
  );
}
