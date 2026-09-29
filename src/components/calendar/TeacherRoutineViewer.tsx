"use client";

import React, { useState, useEffect } from "react";
import { Clock, BookOpen, Download, MapPin } from "lucide-react";
import { ClassRoutineSlot } from "@/lib/calendar/types";

export default function TeacherRoutineViewer() {
  const [routines, setRoutines] = useState<ClassRoutineSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/calendar/routines")
      .then((res) => (res.ok ? res.json() : null))
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
        <div className="py-6 text-center text-gray-500">রুটিন লোড হচ্ছে...</div>
      ) : routines.length === 0 ? (
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <p className="font-bold text-gray-800">সকাল ৮:০০ - ৯:০০ (রবিবার - বৃহস্পতিবার)</p>
            <p className="text-gray-600">নূরানী বিভাগ - বিশুদ্ধ কুরআন তিলাওয়াত ও ক্বিরাআত (কক্ষ: ১০১)</p>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <p className="font-bold text-gray-800">সকাল ৯:১৫ - ১০:১৫ (রবিবার - বৃহস্পতিবার)</p>
            <p className="text-gray-600">হিফজুল কুরআন বিভাগ - দৈনন্দিন নতুন সবক গ্রহণ ও ইয়াদ (কক্ষ: ১০২)</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {routines.map((r) => (
            <div
              key={r.id}
              className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/80 space-y-1"
            >
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span>{getDayName(r.dayOfWeek)}</span>
                <span className="font-mono text-emerald-700">
                  {r.startTime} - {r.endTime}
                </span>
              </div>
              <p className="font-semibold text-gray-900">
                {r.classNameBn} — {r.subjectNameBn}
              </p>
              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                <span>উস্তাদ: {r.teacherName}</span>
                {r.roomNo && (
                  <span className="flex items-center gap-1 text-amber-700">
                    <MapPin className="w-3 h-3" />
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
