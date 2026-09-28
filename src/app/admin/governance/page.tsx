import { Metadata } from "next";
import AdminGovernanceHub from "@/components/governance/AdminGovernanceHub";

export const metadata: Metadata = {
  title: "প্রোডাক্ট গভর্ন্যান্স ও চেঞ্জ ম্যানেজমেন্ট | EHRJ Madrasha ERP",
  description: "দীর্ঘমেয়াদী সফটওয়্যার নির্ভরযোগ্যতা, চেঞ্জ কন্ট্রোল, আর্কিটেকচার গভর্ন্যান্স ও টেকনিক্যাল ডেট রেজিস্টার",
};

export default function AdminGovernancePage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminGovernanceHub />
      </div>
    </div>
  );
}
