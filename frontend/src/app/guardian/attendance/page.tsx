"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useGuardian360 } from "@/hooks/useGuardian";
import { AppBadge } from "@/components/shared/AppBadge";

const DAYS_BN = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
const MONTHS_BN = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

export default function GuardianAttendancePage() {
  const [guardianId] = useState("g1");
  const [selectedWardId, setSelectedWardId] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const { data: g360, isLoading, error } = useGuardian360(guardianId);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen p-8 text-center space-y-4 flex flex-col justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-500 font-medium">উপস্থিতি তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen p-8 text-center space-y-4 flex flex-col justify-center items-center">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-sm text-red-600 font-medium">তথ্য লোড করতে সমস্যা হয়েছে।</p>
        <Link href="/guardian/dashboard" className="text-emerald-600 underline text-xs">ড্যাশবোর্ডে ফিরে যান</Link>
      </div>
    );
  }

  const wards = g360?.wards || [];
  const activeWard = wards.find((w: any) => w.id === (selectedWardId || wards[0]?.id)) || wards[0];
  const attendances = g360?.recentAttendances || [];

  // Build calendar data
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const getAttendanceForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendances.find((a: any) => a.date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "bg-emerald-500 text-white";
      case "ABSENT": return "bg-red-500 text-white";
      case "LATE": return "bg-amber-500 text-white";
      case "LEAVE": return "bg-blue-400 text-white";
      default: return "bg-slate-100 text-slate-400 dark:bg-slate-800";
    }
  };

  // Calculate stats
  const presentCount = attendances.filter((a: any) => a.status === "PRESENT").length;
  const absentCount = attendances.filter((a: any) => a.status === "ABSENT").length;
  const lateCount = attendances.filter((a: any) => a.status === "LATE").length;
  const totalDays = attendances.length || 1;
  const attendanceRate = Math.round((presentCount / totalDays) * 100);

  // Empty State
  if (wards.length === 0) {
    return (
      <div className="min-h-screen p-8 text-center space-y-4 flex flex-col justify-center items-center">
        <Calendar className="h-12 w-12 text-slate-300" />
        <p className="text-sm text-slate-500 font-medium">কোনো সন্তানের উপস্থিতি তথ্য পাওয়া যায়নি।</p>
        <Link href="/guardian/dashboard" className="text-emerald-600 underline text-xs">ড্যাশবোর্ডে ফিরে যান</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/guardian/dashboard" className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" /> উপস্থিতি ক্যালেন্ডার
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{activeWard?.nameBn} — {activeWard?.className}</p>
          </div>
        </div>
        <select
          value={activeWard?.id || ""}
          onChange={(e) => setSelectedWardId(e.target.value)}
          className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none"
        >
          {wards.map((w: any) => (
            <option key={w.id} value={w.id}>
              {w.nameBn} ({w.className} - রোল {w.roll})
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-emerald-600">{presentCount}</p>
          <span className="text-[10px] text-slate-500">উপস্থিত</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-red-500">{absentCount}</p>
          <span className="text-[10px] text-slate-500">অনুপস্থিত</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-amber-500">{lateCount}</p>
          <span className="text-[10px] text-slate-500">বিলম্বে</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-600">{attendanceRate}%</p>
          <span className="text-[10px] text-slate-500">উপস্থিতি হার</span>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); }}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 transition">
          ← আগের মাস
        </button>
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {MONTHS_BN[currentMonth]} {currentYear}
        </h2>
        <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); }}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 transition">
          পরের মাস →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_BN.map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-slate-500 py-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const att = getAttendanceForDate(day);
            return (
              <div
                key={day}
                className={`h-10 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                  att ? getStatusColor(att.status) : "bg-slate-50 dark:bg-slate-800/50 text-slate-400"
                }`}
                title={att ? att.status : "তথ্য নেই"}
              >
                {day}
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1 text-[10px]"><span className="w-3 h-3 rounded bg-emerald-500" /> উপস্থিত</span>
          <span className="flex items-center gap-1 text-[10px]"><span className="w-3 h-3 rounded bg-red-500" /> অনুপস্থিত</span>
          <span className="flex items-center gap-1 text-[10px]"><span className="w-3 h-3 rounded bg-amber-500" /> বিলম্বে</span>
          <span className="flex items-center gap-1 text-[10px]"><span className="w-3 h-3 rounded bg-blue-400" /> ছুটি</span>
        </div>
      </div>
    </div>
  );
}
