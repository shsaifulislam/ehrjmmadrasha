import React from "react";
import AdminTeacherHub from "@/components/teachers/AdminTeacherHub";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

export const metadata = {
  title: "উস্তাদ ও শিক্ষক নিয়ন্ত্রণ কেন্দ্র | EHRJ Digital Campus",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা শিক্ষক ও স্টাফ নিয়ন্ত্রণ কেন্দ্র",
};

export default function AdminTeachersPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Top Banner Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition"
              title="অ্যাডমিন ড্যাশবোর্ডে ফিরুন"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-xs text-gray-500">EHRJ ERP • অ্যাডমিন প্যানেল</p>
              <h1 className="text-base font-bold text-gray-900">শিক্ষক ও উস্তাদ নিয়ন্ত্রণ কেন্দ্র</h1>
            </div>
          </div>

          <Link
            href="/admin"
            className="text-xs font-semibold text-[#0D5C3A] bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>মূল ড্যাশবোর্ড</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AdminTeacherHub />
      </main>
    </div>
  );
}
