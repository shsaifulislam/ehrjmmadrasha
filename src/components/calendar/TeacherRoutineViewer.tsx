"use client";

import React, { useState, useEffect } from "react";
import { Clock, BookOpen, Download, MapPin } from "lucide-react";
import { ClassRoutineSlot } from "@/lib/calendar/types";

export default function TeacherRoutineViewer() {
  const [routines, setRoutines] = useState<ClassRoutineSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/calendar/routines")
      .then((res) => (res.ok ? res.json() : fetch("/api/admin/calendar/routines").then((r) => r.json())))
      .then((data) => {
        if (data?.data) setRoutines(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getDayName = (d: number) => {
    const days = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
    return days[d] || "";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="text-base font-bold text-[#083B25]">আমার সাপ্তাহিক ক্লাস ও পাঠদান সূচি</h2>
          <p className="text-gray-500">আপনার দায়িত্বপ্রাপ্ত সকল শ্রেণি, শাখা ও বিষয়ের রুটিন</p>
        </div>
        <a
          href="/api/calendar/export?role=TEACHER&title=Teacher_Schedule"
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>iCal ডাউনলোড</span>
        </a>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs">রুটিন লোড হচ্ছে...</div>
      ) : routines.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 perspective-1000">
          <div className="card-3d p-4 bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#D4AF37] shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                রবিবার - বৃহস্পতিবার
              </span>
              <span className="font-mono text-xs font-bold text-slate-700">সকাল ৮:০০ - ৯:০০</span>
            </div>
            <p className="font-black text-sm text-slate-900">নূরানী বিভাগ - বিশুদ্ধ কুরআন তিলাওয়াত ও ক্বিরাআত</p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              কক্ষ: ১০১
            </p>
          </div>
          <div className="card-3d p-4 bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#D4AF37] shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                রবিবার - বৃহস্পতিবার
              </span>
              <span className="font-mono text-xs font-bold text-slate-700">সকাল ৯:১৫ - ১০:১৫</span>
            </div>
            <p className="font-black text-sm text-slate-900">হিফজুল কুরআন বিভাগ - দৈনন্দিন নতুন সবক গ্রহণ ও ইয়াদ</p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              কক্ষ: ১০২
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 perspective-1000">
          {routines.map((r) => (
            <div
              key={r.id}
              className="card-3d p-4 bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#D4AF37] hover:shadow-xl transition-all duration-300 space-y-2 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#D4AF37] to-emerald-600" />
              <div className="flex items-center justify-between font-bold text-slate-900 pt-1">
                <span className="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                  {getDayName(r.dayOfWeek)}
                </span>
                <span className="font-mono text-xs text-[#0D5C3A] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  {r.startTime} - {r.endTime}
                </span>
              </div>
              <p className="font-black text-sm text-slate-900">
                {r.classNameBn} — {r.subjectNameBn}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>উস্তাদ: <strong className="text-slate-700">{r.teacherName}</strong></span>
                {r.roomNo && (
                  <span className="flex items-center gap-1 text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    কক্ষ: {r.roomNo}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
