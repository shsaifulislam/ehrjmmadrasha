"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Smartphone,
} from "lucide-react";

interface GuardianAttendanceViewerProps {
  initialStudentId?: string;
}

export default function GuardianAttendanceViewer({ initialStudentId }: GuardianAttendanceViewerProps) {
  const [studentId, setStudentId] = useState(initialStudentId || "");
  const [studentData, setStudentData] = useState<any>(null);
  const [month, setMonth] = useState<string>(() => (new Date().getMonth() + 1).toString());
  const [year, setYear] = useState<string>(() => new Date().getFullYear().toString());

  const [summary, setSummary] = useState<any>({
    totalEligibleStudents: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    leaveCount: 0,
    attendanceRate: 0,
  });
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize studentId when parent selected child changes
  useEffect(() => {
    if (initialStudentId && initialStudentId !== studentId) {
      setStudentId(initialStudentId);
    }
  }, [initialStudentId, studentId]);

  // If studentId wasn't passed, check /api/portal/children or current search
  useEffect(() => {
    if (!studentId) {
      fetch("/api/portal/children")
        .then((res) => res.json())
        .then((data) => {
          if (data.children && data.children.length > 0) {
            setStudentId(data.children[0].id);
          }
        })
        .catch(() => {});
    }
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;

    const controller = new AbortController();
    let isCurrent = true;

    async function loadAttendance() {
      try {
        setLoading(true);
        setErrorMsg(null);
        // Clear previous child's data immediately to avoid showing stale data during transition
        setStudentData(null);
        setRecords([]);
        setSummary({
          totalEligibleStudents: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          leaveCount: 0,
          attendanceRate: 0,
        });

        const params = new URLSearchParams({
          studentId,
          month,
          year,
        });

        const res = await fetch(`/api/portal/attendance?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (!isCurrent) return;

        if (res.ok) {
          setStudentData(data.student);
          setSummary(data.summary || {});
          setRecords(data.records || []);
        } else {
          setErrorMsg(data.error || "হাজিরা রেকর্ড লোড করতে ব্যর্থ হয়েছে।");
        }
      } catch (err: any) {
        if (err.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        if (isCurrent) {
          setErrorMsg("সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।");
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadAttendance();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [studentId, month, year]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Month Selector (3D Gold Elevation) */}
      <div className="card-3d bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#D4AF37] p-5 sm:p-6 shadow-md space-y-4 relative overflow-hidden transition-all">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0D5C3A] via-[#D4AF37] to-[#0D5C3A]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full">
                স্থাপিত: ২০২১ ইং
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                বায়োমেট্রিক উপস্থিতি
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#083B25] flex items-center gap-2 font-serif-bn">
              <Calendar className="w-5 h-5 text-[#0D5C3A]" />
              সন্তানের ডিজিটাল উপস্থিতি ও হাজিরা কার্ড
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              দৈনিক আগমন, প্রস্থান, সময়ানুবর্তিতা ও ছুটির রেকর্ড পর্যবেক্ষণ করুন।
            </p>
          </div>

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border-2 border-slate-200 rounded-xl font-bold bg-white outline-none focus:border-[#D4AF37] shadow-2xs"
            >
              {[
                { val: "1", label: "জানুয়ারি" },
                { val: "2", label: "ফেব্রুয়ারি" },
                { val: "3", label: "মার্চ" },
                { val: "4", label: "এপ্রিল" },
                { val: "5", label: "মে" },
                { val: "6", label: "জুন" },
                { val: "7", label: "জুলাই" },
                { val: "8", label: "আগস্ট" },
                { val: "9", label: "সেপ্টেম্বর" },
                { val: "10", label: "অক্টোবর" },
                { val: "11", label: "নভেম্বর" },
                { val: "12", label: "ডিসেম্বর" },
              ].map((m) => (
                <option key={m.val} value={m.val}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 border-2 border-slate-200 rounded-xl font-bold bg-white outline-none focus:border-[#D4AF37] shadow-2xs"
            >
              <option value="2025">২০২৫</option>
              <option value="2026">২০২৬</option>
              <option value="2027">২০২৭</option>
            </select>
          </div>
        </div>

        {/* Student Profile Info if available */}
        {studentData && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-gradient-to-r from-emerald-50/60 to-amber-50/40 p-4 rounded-xl border border-emerald-200/60 gap-3">
            <div>
              <span className="font-black text-slate-900 text-sm block font-serif-bn">{studentData.fullNameBn}</span>
              <span className="text-slate-600 font-mono text-[11px] mt-0.5 block">
                আইডি: {studentData.studentIdNumber} | রোল: {studentData.rollNumber || "—"} | জামাত:{" "}
                {studentData.currentClass} {studentData.currentSection ? `(${studentData.currentSection})` : ""}
              </span>
            </div>

            <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between">
              <span className="text-[11px] text-slate-500 font-bold block uppercase">উপস্থিতির হার</span>
              <span className="text-lg font-black font-mono text-[#0D5C3A]">
                {summary.attendanceRate?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Monthly Summary Metrics (3D Cards) */}
      <div className="perspective-1000 grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="card-3d bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-[#D4AF37] text-center shadow-sm hover:shadow-lg transition-all">
          <span className="text-[11px] text-slate-500 font-bold block uppercase">মোট দিন</span>
          <span className="text-xl font-black font-mono text-slate-900 mt-1 block">{records.length}</span>
        </div>
        <div className="card-3d bg-white p-4 rounded-2xl border border-emerald-200 hover:border-emerald-400 text-center shadow-sm hover:shadow-lg bg-emerald-50/30 transition-all">
          <span className="text-[11px] text-emerald-800 font-bold block uppercase">উপস্থিত দিন</span>
          <span className="text-xl font-black font-mono text-emerald-700 mt-1 block">{summary.presentCount || 0}</span>
        </div>
        <div className="card-3d bg-white p-4 rounded-2xl border border-red-200 hover:border-red-400 text-center shadow-sm hover:shadow-lg bg-red-50/30 transition-all">
          <span className="text-[11px] text-red-800 font-bold block uppercase">অনুপস্থিত দিন</span>
          <span className="text-xl font-black font-mono text-red-700 mt-1 block">{summary.absentCount || 0}</span>
        </div>
        <div className="card-3d bg-white p-4 rounded-2xl border border-amber-200 hover:border-amber-400 text-center shadow-sm hover:shadow-lg bg-amber-50/30 transition-all">
          <span className="text-[11px] text-amber-800 font-bold block uppercase">দেরি (Late)</span>
          <span className="text-xl font-black font-mono text-amber-700 mt-1 block">{summary.lateCount || 0}</span>
        </div>
        <div className="card-3d bg-white p-4 rounded-2xl border border-blue-200 hover:border-blue-400 text-center shadow-sm hover:shadow-lg bg-blue-50/30 transition-all">
          <span className="text-[11px] text-blue-800 font-bold block uppercase">ছুটি (Leave)</span>
          <span className="text-xl font-black font-mono text-blue-700 mt-1 block">{summary.leaveCount || 0}</span>
        </div>
      </div>

      {/* 3. Date-wise Attendance Timeline Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500">হাজিরা তথ্য লোড হচ্ছে...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            এই মাসে শিক্ষার্থীর কোনো হাজিরা রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8F3] border-b border-gray-200 text-gray-700 font-semibold">
                <tr>
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">জামাত ও শাখা</th>
                  <th className="p-3 text-center">উপস্থিতি অবস্থা</th>
                  <th className="p-3 text-center">আগমন (Check-In)</th>
                  <th className="p-3 text-center">প্রস্থান (Check-Out)</th>
                  <th className="p-3 text-center">এসএমএস</th>
                  <th className="p-3">ছুটির বিবরণ / মন্তব্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-semibold text-gray-900">{r.date}</td>
                    <td className="p-3 text-gray-600">
                      {r.classNameBn} {r.sectionNameBn ? `• ${r.sectionNameBn}` : ""}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          r.status === "PRESENT"
                            ? "bg-green-100 text-green-800"
                            : r.status === "ABSENT"
                            ? "bg-red-100 text-red-800"
                            : r.status === "LATE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {r.status === "PRESENT"
                          ? "উপস্থিত"
                          : r.status === "ABSENT"
                          ? "অনুপস্থিত"
                          : r.status === "LATE"
                          ? "দেরি"
                          : "ছুটি"}
                      </span>
                    </td>
                    {/* Check-In Time */}
                    <td className="p-3 text-center font-mono text-[11px]">
                      {r.checkInTime ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-emerald-800 font-bold">
                            {new Date(r.checkInTime).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                          <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200">
                            {r.entryMethod || "ডিজিটাল"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {/* Check-Out Time */}
                    <td className="p-3 text-center font-mono text-[11px]">
                      {r.checkOutTime ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-amber-800 font-bold">
                            {new Date(r.checkOutTime).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                          <span className="text-[9px] text-amber-600 bg-amber-50 px-1 rounded border border-amber-200">
                            {r.exitMethod || "ডিজিটাল"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {/* SMS Status */}
                    <td className="p-3 text-center">
                      {r.checkInSmsSent || r.checkOutSmsSent ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold"
                          title="অভিভাবকের মোবাইলে এসএমএস ডেলিভারি কনফার্ম"
                        >
                          <Smartphone className="w-3 h-3 text-emerald-600" />
                          প্রেরিত
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500">
                      {r.leaveReason ? (
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                          {r.leaveReason}
                        </span>
                      ) : (
                        r.remarks || "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
