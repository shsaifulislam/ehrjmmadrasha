import React from "react";
import AdminInventoryHub from "@/components/inventory/AdminInventoryHub";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ইনভেন্টরি ও সম্পদ ব্যবস্থাপনা | EHRJ Admin Campus",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সামগ্রী, স্টক ও এসেট অডিট কন্ট্রোল",
};

export default function AdminInventoryPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <AdminInventoryHub />
    </div>
  );
}
