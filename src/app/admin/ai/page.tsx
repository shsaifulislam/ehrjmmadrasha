import { Metadata } from "next";
import AdminAIHub from "@/components/ai/AdminAIHub";

export const metadata: Metadata = {
  title: "এআই ইন্টেলিজেন্স ও ডিসিশন-সাপোর্ট | EHRJ Madrasha ERP",
  description: "মাদরাসা ইআরপির এআই-সহায়তাকৃত বুদ্ধিমত্তা, বিশ্লেষণ, ডেটা অসঙ্গতি সনাক্তকরণ ও হিউম্যান-ইন-দ্য-লুপ হাব",
};

export default function AdminAIPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminAIHub />
      </div>
    </div>
  );
}
