"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Award } from "lucide-react";
import TeacherMarksEntry from "@/components/exams/TeacherMarksEntry";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function TeacherResultsStandalonePage() {
  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      {/* Header */}
      <header className="bg-[#083B25] text-white px-6 py-4 border-b-2 border-[#C59B27] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C59B27] text-[#083B25] font-arabic font-bold flex items-center justify-center text-sm shadow">
            أستاذ
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg font-display leading-tight">
              উস্তাদ নম্বর এন্ট্রি ও ফলাফল দাখিল (Teacher Marks Entry)
            </h1>
            <p className="text-xs text-emerald-200">
              {INSTITUTION_INFO.nameBn} • পরীক্ষা ও মূল্যায়ন নিয়ন্ত্রণ
            </p>
          </div>
        </div>

        <Link
          href="/teacher"
          className="text-xs bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          উস্তাদ প্যানেলে ফিরুন
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        <TeacherMarksEntry />
      </main>
    </div>
  );
}
