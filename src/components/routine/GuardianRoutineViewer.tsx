"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  User, 
  MapPin, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  CalendarDays
} from "lucide-react";

interface RoutineSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectNameBn: string;
  teacherName: string;
  roomNo?: string;
  periodNumber?: number;
}

interface RoutineResponse {
  student: {
    id: string;
    fullNameBn: string;
    studentIdNumber: string;
  };
  enrollment: {
    classNameBn: string;
    sectionNameBn: string;
    rollNumber: number;
    sessionName: string;
  } | null;
  todayDayOfWeek: number;
  todaySlots: RoutineSlot[];
  weeklySlots: RoutineSlot[];
}

interface GuardianRoutineViewerProps {
  selectedStudentId?: string;
}

const DAYS_OF_WEEK = [
  { id: 6, nameBn: "শনিবার" },
  { id: 0, nameBn: "রবিবার" },
  { id: 1, nameBn: "সোমবার" },
  { id: 2, nameBn: "মঙ্গলবার" },
  { id: 3, nameBn: "বুধবার" },
  { id: 4, nameBn: "বৃহস্পতিবার" },
  { id: 5, nameBn: "শুক্রবার" }
];

export function GuardianRoutineViewer({ selectedStudentId }: GuardianRoutineViewerProps) {
  const [data, setData] = useState<RoutineResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"TODAY" | "WEEKLY">("TODAY");
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay());
  const [retryCount, setRetryCount] = useState<number>(0);

  const handleRefresh = () => setRetryCount((c) => c + 1);

  useEffect(() => {
    if (!selectedStudentId) {
      setLoading(false);
      setData(null);
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;

    setLoading(true);
    setError(null);
    // Clear previous student routine immediately to prevent stale schedule display
    setData(null);

    const fetchRoutine = async () => {
      try {
        const res = await fetch(`/api/portal/routine?studentId=${selectedStudentId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "রুটিন লোড করতে ব্যর্থ হয়েছে।");
        }
        const json = await res.json();
        if (!isCurrent) return;

        if (json.success) {
          setData(json.data);
        } else {
          throw new Error(json.error || "রুটিন তথ্য পাওয়া যায়নি।");
        }
      } catch (err: any) {
        if (err.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        if (isCurrent) {
          setError(err.message || "ত্রুটি ঘটেছে।");
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    fetchRoutine();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [selectedStudentId, retryCount]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-emerald-100 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-stone-600 font-medium">ক্লাস রুটিন লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <p className="text-red-800 font-medium mb-3">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm"
        >
          পুনরায় চেষ্টা করুন
        </button>
      </div>
    );
  }

  if (!data || !data.enrollment) {
    return (
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 text-center">
        <CalendarDays className="w-10 h-10 text-stone-400 mx-auto mb-3" />
        <h3 className="text-stone-800 font-semibold mb-1">কোনো সক্রিয় ভর্তি তথ্য নেই</h3>
        <p className="text-stone-500 text-sm">এই শিক্ষার্থীর জন্য সক্রিয় শিক্ষাবর্ষের ভর্তি তথ্য খুঁজে পাওয়া যায়নি।</p>
      </div>
    );
  }

  const { enrollment, todaySlots, weeklySlots } = data;
  const filteredWeeklySlots = weeklySlots.filter(s => s.dayOfWeek === activeDay);

  return (
    <div className="space-y-6">
      {/* Header Info Banner (3D Gold Elevation) */}
      <div className="card-3d bg-gradient-to-br from-[#052618] via-[#0D5C3A] to-[#063321] rounded-3xl p-6 text-white shadow-xl border-2 border-[#D4AF37]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#D4AF37] to-emerald-600" />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-[#D4AF37]/50 px-2.5 py-0.5 rounded-full">
              স্থাপিত: ২০২১ ইং
            </span>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              একাডেমিক সময়সূচি
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-serif-bn flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            দৈনিক ক্লাস রুটিন
          </h2>
          <p className="text-emerald-200/90 text-xs sm:text-sm font-medium mt-0.5">
            {data.student.fullNameBn} | আইডি: <span className="font-mono">{data.student.studentIdNumber}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-200 border border-white/20 shadow-sm">
            {enrollment.classNameBn} ({enrollment.sectionNameBn})
          </span>
          <span className="bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-bold text-white border border-white/20 shadow-sm">
            রোল: {enrollment.rollNumber}
          </span>
          <span className="bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-200 border border-white/20 shadow-sm">
            {enrollment.sessionName}
          </span>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("TODAY")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              viewMode === "TODAY"
                ? "bg-[#0D5C3A] text-white shadow-md border border-emerald-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            আজকের রুটিন ({todaySlots.length} টি ক্লাস)
          </button>
          <button
            onClick={() => setViewMode("WEEKLY")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              viewMode === "WEEKLY"
                ? "bg-[#0D5C3A] text-white shadow-md border border-emerald-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            সাপ্তাহিক রুটিন
          </button>
        </div>

        <button
          onClick={handleRefresh}
          title="রিফ্রেশ করুন"
          className="p-2 text-slate-500 hover:text-[#0D5C3A] hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* TODAY'S VIEW */}
      {viewMode === "TODAY" && (
        <div>
          {todaySlots.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-bold">আজকের কোনো ক্লাস নির্ধারিত নেই অথবা মাদরাসা বন্ধ।</p>
              <button
                onClick={() => setViewMode("WEEKLY")}
                className="mt-3 text-xs text-[#0D5C3A] hover:underline font-bold"
              >
                সম্পূর্ণ সাপ্তাহিক রুটিন দেখুন →
              </button>
            </div>
          ) : (
            <div className="perspective-1000 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaySlots.map((slot, index) => (
                <div
                  key={slot.id || index}
                  className="card-3d bg-white border-2 border-slate-200/90 hover:border-[#D4AF37] rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0D5C3A] via-[#D4AF37] to-[#0D5C3A]" />

                  <div>
                    <div className="flex items-center justify-between mb-3 pt-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-[#0D5C3A] border border-emerald-200">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {slot.startTime} - {slot.endTime}
                      </span>
                      {slot.periodNumber && (
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          {slot.periodNumber}ম পিরিয়ড
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-black text-slate-900 mb-2 flex items-center gap-2 font-serif-bn">
                      <BookOpen className="w-4 h-4 text-[#0D5C3A] flex-shrink-0" />
                      {slot.subjectNameBn}
                    </h4>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>উস্তাদ: {slot.teacherName}</span>
                    </div>
                    {slot.roomNo && (
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>কক্ষ: {slot.roomNo}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WEEKLY VIEW */}
      {viewMode === "WEEKLY" && (
        <div className="space-y-4">
          {/* Day selection pills */}
          <div className="flex flex-wrap gap-2 pb-2">
            {DAYS_OF_WEEK.map((day) => {
              const daySlotCount = weeklySlots.filter(s => s.dayOfWeek === day.id).length;
              const isSelected = activeDay === day.id;
              return (
                <button
                  key={day.id}
                  onClick={() => setActiveDay(day.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  <span>{day.nameBn}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? "bg-white/20 text-white" : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {daySlotCount}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredWeeklySlots.length === 0 ? (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center text-stone-600">
              <Calendar className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p>এই দিনে কোনো নিয়মিত ক্লাস নির্ধারিত নেই।</p>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">পিরিয়ড</th>
                      <th className="py-3 px-4">সময়</th>
                      <th className="py-3 px-4">বিষয়</th>
                      <th className="py-3 px-4">শিক্ষক</th>
                      <th className="py-3 px-4">কক্ষ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredWeeklySlots.map((slot, idx) => (
                      <tr key={slot.id || idx} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-emerald-800">
                          {slot.periodNumber ? `${slot.periodNumber}ম` : `${idx + 1}ম`}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-stone-700">
                          {slot.startTime} - {slot.endTime}
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-800">
                          {slot.subjectNameBn}
                        </td>
                        <td className="py-3 px-4 text-stone-600">
                          {slot.teacherName}
                        </td>
                        <td className="py-3 px-4 text-stone-500 font-mono text-xs">
                          {slot.roomNo || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
