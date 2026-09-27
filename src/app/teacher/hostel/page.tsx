import React from "react";
import TeacherHostelViewer from "@/components/hostel/TeacherHostelViewer";
import Link from "next/link";
import { ArrowLeft, Home, Building } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export const metadata = {
  title: "আবাসিক শিক্ষার্থী তালিকা | উস্তাদ প্যানেল",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা উস্তাদ আবাসন অবলোকন",
};

export default function TeacherHostelPage() {
  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col text-[#0B1914]">
      {/* Header */}
      <header className="bg-[#083B25] text-white px-6 py-4 border-b-2 border-[#C59B27] flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher"
            className="flex items-center gap-1.5 text-xs bg-[#0D5C3A] hover:bg-[#158052] text-white px-2.5 py-1.5 rounded transition shadow"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>শিক্ষক প্যানেলে ফিরুন</span>
          </Link>
          <div className="h-4 w-px bg-emerald-700 mx-1 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#C59B27]" />
            <div>
              <h1 className="font-bold text-sm sm:text-base font-display leading-tight">
                শিক্ষার্থী আবাসন তালিকা (Residential Overview)
              </h1>
              <p className="text-[11px] text-emerald-200">
                {INSTITUTION_INFO.nameBn} • উস্তাদ অবলোকন পোর্টাল
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/teacher"
            className="flex items-center gap-1 bg-[#C59B27] hover:bg-[#b08920] text-[#083B25] px-3 py-1.5 rounded text-xs font-bold transition shadow"
          >
            <Home className="w-3.5 h-3.5" />
            শিক্ষক ড্যাশবোর্ড
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        <TeacherHostelViewer />
      </main>
    </div>
  );
}
