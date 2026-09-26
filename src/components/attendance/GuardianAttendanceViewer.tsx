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

    async function loadAttendance() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const params = new URLSearchParams({
          studentId,
          month,
          year,
        });

        const res = await fetch(`/api/portal/attendance?${params.toString()}`);
        const data = await res.json();

        if (res.ok) {
          setStudentData(data.student);
          setSummary(data.summary || {});
          setRecords(data.records || []);
        } else {
          setErrorMsg(data.error || "হাজিরা রেকর্ড লোড করতে ব্যর্থ হয়েছে।");
        }
      } catch (err) {
        setErrorMsg("সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, [studentId, month, year]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Month Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-base font-bold text-[#083B25] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0D5C3A]" />
              সন্তানের ডিজিটাল উপস্থিতি ও হাজিরা কার্ড (Attendance Card)
            </h2>
            <p className="text-xs text-gray-500">
              দৈনিক উপস্থিতি, সময়ানুবর্তিতা ও ছুটি পর্যবেক্ষণ করুন।
            </p>
          </div>

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded font-semibold bg-white"
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
              className="px-2.5 py-1.5 border border-gray-300 rounded font-semibold bg-white"
            >
              <option value="2025">২০২৫</option>
              <option value="2026">২০২৬</option>
              <option value="2027">২০২৭</option>
            </select>
          </div>
        </div>

        {/* Student Profile Info if available */}
        {studentData && (
          <div className="flex items-center justify-between text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div>
              <span className="font-bold text-gray-900 text-sm block">{studentData.fullNameBn}</span>
              <span className="text-gray-500 font-mono">
                আইডি: {studentData.studentIdNumber} | রোল: {studentData.rollNumber || "—"} | জামাত:{" "}
                {studentData.currentClass} {studentData.currentSection ? `(${studentData.currentSection})` : ""}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-gray-500 block">উপস্থিতির শতকরা হার</span>
              <span className="text-base font-bold font-mono text-[#0D5C3A]">
                {summary.attendanceRate?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Monthly Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-sm">
          <span className="text-[11px] text-gray-500 font-semibold block">মোট দিন</span>
          <span className="text-lg font-bold font-mono text-gray-900">{records.length}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center shadow-sm bg-emerald-50/40">
          <span className="text-[11px] text-emerald-800 font-semibold block">উপস্থিত দিন</span>
          <span className="text-lg font-bold font-mono text-emerald-700">{summary.presentCount || 0}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-red-200 text-center shadow-sm bg-red-50/40">
          <span className="text-[11px] text-red-800 font-semibold block">অনুপস্থিত দিন</span>
          <span className="text-lg font-bold font-mono text-red-700">{summary.absentCount || 0}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-amber-200 text-center shadow-sm bg-amber-50/40">
          <span className="text-[11px] text-amber-800 font-semibold block">দেরি (Late)</span>
          <span className="text-lg font-bold font-mono text-amber-700">{summary.lateCount || 0}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-blue-200 text-center shadow-sm bg-blue-50/40">
          <span className="text-[11px] text-blue-800 font-semibold block">ছুটি (Leave)</span>
          <span className="text-lg font-bold font-mono text-blue-700">{summary.leaveCount || 0}</span>
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
