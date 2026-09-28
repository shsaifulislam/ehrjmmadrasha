import { Metadata } from "next";
import AdminKnowledgeCenter from "@/components/knowledge/AdminKnowledgeCenter";

export const metadata: Metadata = {
  title: "প্রাতিষ্ঠানিক জ্ঞানভান্ডার ও সার্চ সেন্টার | EHRJ Admin",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার প্রাতিষ্ঠানিক জ্ঞানভান্ডার, ভার্সন ও নলেজ রিট্রিভাল হাব।",
};

export default function AdminKnowledgePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <AdminKnowledgeCenter />
    </div>
  );
}
