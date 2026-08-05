"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  ArrowLeft,
  AlertCircle,
  Download,
  Printer,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { useGuardian360 } from "@/hooks/useGuardian";
import { AppBadge } from "@/components/shared/AppBadge";
import { AppButton } from "@/components/shared/AppButton";

export default function GuardianResultsPage() {
  const [guardianId] = useState("g1");
  const [selectedWardId, setSelectedWardId] = useState<string>("");

  const { data: g360, isLoading, error } = useGuardian360(guardianId);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen p-8 text-center space-y-4 flex flex-col justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-500 font-medium">ফলাফল তথ্য লোড হচ্ছে...</p>
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
  const examResults = g360?.examResults || [];

  const getGradeColor = (grade: string) => {
    if (grade === "A+" || grade === "A") return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950";
    if (grade === "A-" || grade === "B+") return "text-blue-600 bg-blue-50 dark:bg-blue-950";
    if (grade === "B" || grade === "B-") return "text-amber-600 bg-amber-50 dark:bg-amber-950";
    return "text-red-600 bg-red-50 dark:bg-red-950";
  };

  // Empty State
  if (wards.length === 0) {
    return (
      <div className="min-h-screen p-8 text-center space-y-4 flex flex-col justify-center items-center">
        <Award className="h-12 w-12 text-slate-300" />
        <p className="text-sm text-slate-500 font-medium">কোনো সন্তানের ফলাফল তথ্য পাওয়া যায়নি।</p>
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
              <Award className="h-5 w-5 text-emerald-600" /> পরীক্ষার ফলাফল ও মার্কশীট
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

      {/* Results */}
      {examResults.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">এই সন্তানের কোনো পরীক্ষার ফলাফল এখনও প্রকাশিত হয়নি।</p>
        </div>
      ) : (
        <div className="space-y-4">
          {examResults.map((exam: any, idx: number) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Exam Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{exam.examName || "পরীক্ষা"}</h3>
                  <p className="text-[10px] text-slate-500">{exam.session || ""} • {exam.date || ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  {exam.gpa && (
                    <AppBadge variant="success" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" /> GPA: {exam.gpa}
                    </AppBadge>
                  )}
                  <AppButton size="sm" variant="outline" onClick={() => window.print()} className="h-7 text-[10px] gap-1">
                    <Printer className="h-3 w-3" /> প্রিন্ট
                  </AppButton>
                </div>
              </div>
              {/* Subject Marks Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-600">বিষয়</th>
                      <th className="text-center p-3 font-semibold text-slate-600">পূর্ণমান</th>
                      <th className="text-center p-3 font-semibold text-slate-600">প্রাপ্ত</th>
                      <th className="text-center p-3 font-semibold text-slate-600">গ্রেড</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(exam.subjects || []).map((sub: any, si: number) => (
                      <tr key={si} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{sub.name}</td>
                        <td className="p-3 text-center text-slate-500">{sub.totalMarks || 100}</td>
                        <td className="p-3 text-center font-bold text-slate-900 dark:text-slate-100">{sub.obtainedMarks || 0}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getGradeColor(sub.grade || "")}`}>
                            {sub.grade || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
