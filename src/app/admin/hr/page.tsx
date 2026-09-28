import { Metadata } from "next";
import AdminHrHub from "@/components/hr/AdminHrHub";

export const metadata: Metadata = {
  title: "HR, শিক্ষক ও স্টাফ ব্যবস্থাপনা | EHRJ Madrasha ERP",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সেন্ট্রাল মানবসম্পদ ও শিক্ষক ব্যবস্থাপনা ইঞ্জিন",
};

export default function AdminHrPage() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <AdminHrHub />
    </div>
  );
}
