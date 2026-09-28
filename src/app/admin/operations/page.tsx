import { Metadata } from "next";
import AdminOperationsHub from "@/components/operations/AdminOperationsHub";

export const metadata: Metadata = {
  title: "সিস্টেম অপারেশন ও ডিজাস্টার রিকভারি | EHRJ Madrasha ERP",
  description: "প্রোডাকশন সিস্টেম স্বাস্থ্য, ডেটাবেস ব্যাকআপ, রিকভারি ড্রিল ও ইনসিডেন্ট পর্যবেক্ষণ",
};

export default function AdminOperationsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminOperationsHub />
      </div>
    </div>
  );
}
