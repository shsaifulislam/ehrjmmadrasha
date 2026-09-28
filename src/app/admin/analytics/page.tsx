import React from "react";
import AdminAnalyticsHub from "@/components/analytics/AdminAnalyticsHub";

export const metadata = {
  title: "অ্যাডভান্সড অ্যানালিটিক্স ও ড্যাশবোর্ড | EHRJ Madrasha ERP",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সমন্বিত ড্যাশবোর্ড ও রিপোর্ট",
};

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <AdminAnalyticsHub />
      </div>
    </div>
  );
}
