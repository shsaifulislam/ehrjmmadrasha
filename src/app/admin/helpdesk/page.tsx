import { Metadata } from "next";
import AdminHelpdeskHub from "@/components/helpdesk/AdminHelpdeskHub";

export const metadata: Metadata = {
  title: "হেল্পডেস্ক ও অভিযোগ ব্যবস্থাপনা | EHRJ Madrasha ERP",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সেন্ট্রাল হেল্পডেস্ক ও অভিযোগ ইঞ্জিন",
};

export default function AdminHelpdeskPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <AdminHelpdeskHub />
    </div>
  );
}
