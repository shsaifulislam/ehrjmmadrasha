"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Save,
  RotateCcw,
  CheckSquare,
  Search,
  UserCheck,
  UserX,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";

interface TeacherAssignmentItem {
  id: string;
  classId: string;
  classNameBn: string;
  sectionId?: string | null;
  sectionNameBn?: string | null;
  sessionId: string;
}

interface StudentAttendanceRecord {
  studentId: string;
  studentIdNumber: string;
  fullNameBn: string;
  fullNameEn?: string | null;
  rollNumber: number;
  residentialStatus: string;
  isOrphan: boolean;
  photoUrl?: string | null;
  sectionNameBn?: string | null;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "UNMARKED";
  leaveReason?: string | null;
  remarks?: string | null;
}

export default function TeacherAttendanceManager() {
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [date, setDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [students, setStudents] = useState<StudentAttendanceRecord[]>([]);
  const [initialStudents, setInitialStudents] = useState<StudentAttendanceRecord[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 1. Fetch Teacher Assignments on load
  useEffect(() => {
    async function loadAssignments() {
      try {
        setLoadingAssignments(true);
        const res = await fetch("/api/teacher/attendance/assignments");
        const data = await res.json();
        if (res.ok && data.assignments && data.assignments.length > 0) {
          setAssignments(data.assignments);
          setSelectedAssignmentId(data.assignments[0].id);
        } else if (!res.ok) {
          setStatusMessage({ type: "error", text: data.error || "অ্যাসাইনমেন্ট লোড করা যায়নি।" });
        }
      } catch (err: any) {
        setStatusMessage({ type: "error", text: "সার্ভারে সংযোগ ব্যর্থ হয়েছে।" });
      } finally {
        setLoadingAssignments(false);
      }
    }
    loadAssignments();
  }, []);

  // 2. Fetch Attendance Sheet whenever assignment or date changes
  useEffect(() => {
    if (!selectedAssignmentId || !date) return;
    const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId);
    if (!currentAssignment) return;

    async function loadAttendanceSheet() {
      try {
        setLoadingSheet(true);
        setStatusMessage(null);
        setHasUnsavedChanges(false);

        const params = new URLSearchParams({
          sessionId: currentAssignment!.sessionId,
          classId: currentAssignment!.classId,
          date,
        });
        if (currentAssignment!.sectionId) {
          params.append("sectionId", currentAssignment!.sectionId);
        }

        const res = await fetch(`/api/teacher/attendance?${params.toString()}`);
        const data = await res.json();

        if (res.ok) {
          setIsLocked(!!data.isLocked);
          setLockReason(data.lockReason);
          setCanEdit(data.canEdit !== false);

          const studentList: StudentAttendanceRecord[] = (data.students || []).map((s: any) => ({
            studentId: s.studentId,
            studentIdNumber: s.studentIdNumber,
            fullNameBn: s.fullNameBn,
            fullNameEn: s.fullNameEn,
            rollNumber: s.rollNumber,
            residentialStatus: s.residentialStatus,
            isOrphan: s.isOrphan,
            photoUrl: s.photoUrl,
            sectionNameBn: s.sectionNameBn,
            status: s.status === "UNMARKED" ? "UNMARKED" : s.status,
            leaveReason: s.leaveReason || "",
            remarks: s.remarks || "",
          }));

          setStudents(studentList);
          setInitialStudents(JSON.parse(JSON.stringify(studentList)));
        } else {
          setStatusMessage({ type: "error", text: data.error || "হাজিরা তালিকা লোড ব্যর্থ।" });
          setStudents([]);
        }
      } catch (err) {
        setStatusMessage({ type: "error", text: "হাজিরা শিট লোড করতে ত্রুটি ঘটেছে।" });
      } finally {
        setLoadingSheet(false);
      }
    }

    loadAttendanceSheet();
  }, [selectedAssignmentId, date, assignments]);

  // Handle single student status change
  const handleStatusChange = (
    studentId: string,
    newStatus: "PRESENT" | "ABSENT" | "LATE" | "LEAVE"
  ) => {
    if (!canEdit || isLocked) return;
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
    setHasUnsavedChanges(true);
  };

  // Handle leave reason change
  const handleLeaveReasonChange = (studentId: string, reason: string) => {
    if (!canEdit || isLocked) return;
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, leaveReason: reason } : s))
    );
    setHasUnsavedChanges(true);
  };

  // Bulk: All Present ("সবাই উপস্থিত")
  const handleAllPresent = () => {
    if (!canEdit || isLocked) return;
    setStudents((prev) => prev.map((s) => ({ ...s, status: "PRESENT" })));
    setHasUnsavedChanges(true);
  };

  // Reset to original state
  const handleReset = () => {
    setStudents(JSON.parse(JSON.stringify(initialStudents)));
    setHasUnsavedChanges(false);
    setStatusMessage(null);
  };

  // Save Attendance Sheet
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || isLocked) {
      alert("এই হাজিরা শিটটি লক করা বা সময়সীমা উত্তীর্ণ হওয়ায় সংরক্ষণ করা যাবে না।");
      return;
    }

    const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId);
    if (!currentAssignment) return;

    // Check if any student is still unmarked
    const unmarked = students.filter((s) => s.status === "UNMARKED");
    if (unmarked.length > 0) {
      const confirmSave = confirm(
        `সতর্কতা: ${unmarked.length} জন শিক্ষার্থীর হাজিরা এখনো চিহ্নিত করা হয়নি। আপনি কি বাকিদের সংরক্ষণ করতে চান?`
      );
      if (!confirmSave) return;
    }

    const recordsToSave = students
      .filter((s) => s.status !== "UNMARKED")
      .map((s) => ({
        studentId: s.studentId,
        status: s.status,
        leaveReason: s.status === "LEAVE" ? s.leaveReason || "ছুটি মঞ্জুর" : null,
        remarks: s.remarks || null,
      }));

    if (recordsToSave.length === 0) {
      setStatusMessage({ type: "error", text: "অন্তত একজন শিক্ষার্থীর হাজিরা নির্বাচন করুন।" });
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      // Offline Draft Check
      if (typeof window !== "undefined" && !navigator.onLine) {
        const { enqueueOfflineOperation } = await import("@/lib/pwa/syncQueue");
        enqueueOfflineOperation("TEACHER_ATTENDANCE", {
          sessionId: currentAssignment.sessionId,
          classId: currentAssignment.classId,
          sectionId: currentAssignment.sectionId || null,
          date,
          records: recordsToSave,
        });
        setStatusMessage({
          type: "success",
          text: "ইন্টারনেট সংযোগ নেই — হাজিরা ডিভাইসে অফলাইন ড্রাফট হিসেবে সংরক্ষিত হয়েছে (Pending Sync)।",
        });
        setHasUnsavedChanges(false);
        setSaving(false);
        return;
      }

      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentAssignment.sessionId,
          classId: currentAssignment.classId,
          sectionId: currentAssignment.sectionId || null,
          date,
          records: recordsToSave,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: `হাজিরা সফলভাবে সংরক্ষিত হয়েছে! (মোট: ${data.totalStudents}, নতুন: ${data.createdCount}, হালনাগাদ: ${data.updatedCount})`,
        });
        setHasUnsavedChanges(false);
        setInitialStudents(JSON.parse(JSON.stringify(students)));
      } else {
        setStatusMessage({ type: "error", text: data.error || "সংরক্ষণ ব্যর্থ হয়েছে।" });
      }
    } catch (err: any) {
      if (typeof window !== "undefined" && !navigator.onLine) {
        const { enqueueOfflineOperation } = await import("@/lib/pwa/syncQueue");
        enqueueOfflineOperation("TEACHER_ATTENDANCE", {
          sessionId: currentAssignment.sessionId,
          classId: currentAssignment.classId,
          sectionId: currentAssignment.sectionId || null,
          date,
          records: recordsToSave,
        });
        setStatusMessage({
          type: "success",
          text: "ইন্টারনেট সংযোগ বিচ্ছিন্ন — হাজিরা অফলাইন ড্রাফট হিসেবে সংরক্ষিত হয়েছে (Pending Sync)।",
        });
        setHasUnsavedChanges(false);
      } else {
        setStatusMessage({ type: "error", text: "সার্ভারে হাজিরা সংরক্ষণের অনুরোধ ব্যর্থ হয়েছে।" });
      }
    } finally {
      setSaving(false);
    }
  };

  // Filter students by search
  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.fullNameBn.toLowerCase().includes(q) ||
      s.studentIdNumber.toLowerCase().includes(q) ||
      s.rollNumber.toString().includes(q)
    );
  });

  // Calculate live stats
  const totalStudents = students.length;
  const presentCount = students.filter((s) => s.status === "PRESENT").length;
  const absentCount = students.filter((s) => s.status === "ABSENT").length;
  const lateCount = students.filter((s) => s.status === "LATE").length;
  const leaveCount = students.filter((s) => s.status === "LEAVE").length;
  const unmarkedCount = students.filter((s) => s.status === "UNMARKED").length;
  const attendanceRate =
    totalStudents > 0 ? ((presentCount + lateCount) / totalStudents) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Scoped Selectors */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-base font-bold text-[#083B25] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0D5C3A]" />
              উস্তাদ ডিজিটাল হাজিরা ইঞ্জিন (Teacher Attendance Sheet)
            </h2>
            <p className="text-xs text-gray-500">
              রোল-ক্রম অনুযায়ী ক্লাসের শিক্ষার্থীদের উপস্থিতি গ্রহণ ও রেকর্ড করুন।
            </p>
          </div>

          {/* Quick Date Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">তারিখ:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-xs font-mono font-semibold focus:ring-1 focus:ring-[#0D5C3A] outline-none"
            />
            <button
              type="button"
              onClick={() => setDate(new Date().toISOString().split("T")[0])}
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold"
            >
              আজ
            </button>
          </div>
        </div>

        {/* Assignment & Search Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              অ্যাসাইনকৃত জামাত ও শাখা নির্বাচন করুন:
            </label>
            {loadingAssignments ? (
              <div className="text-xs text-gray-400 py-2">জামাত লোড হচ্ছে...</div>
            ) : assignments.length === 0 ? (
              <div className="text-xs text-red-600 py-1">
                আপনার অ্যাকাউন্টে কোনো জামাত অ্যাসাইন করা নেই। অনুগ্রহ করে প্রশাসকের সাথে যোগাযোগ করুন।
              </div>
            ) : (
              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-1 focus:ring-[#0D5C3A] outline-none"
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.classNameBn} {a.sectionNameBn ? `• শাখা: ${a.sectionNameBn}` : "• সকল শাখা"}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              শিক্ষার্থী খুঁজুন (রোল / নাম):
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="রোল, নাম বা আইডি..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Lock & Permission Banners */}
      {isLocked && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-xs text-amber-900 flex items-start gap-2 shadow-sm">
          <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="font-bold">এই তারিখের হাজিরা বর্তমানে লক করা আছে:</strong>{" "}
            {lockReason || "অ্যাডমিন কর্তৃক আনুষ্ঠানিকভাবে লক করা হয়েছে।"}{" "}
            শিক্ষক হিসেবে সরাসরি পরিবর্তন সম্ভব নয়। প্রয়োজনে প্রধান শিক্ষক বা অ্যাডমিন প্যানেলে যোগাযোগ করুন।
          </div>
        </div>
      )}

      {!isLocked && !canEdit && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg text-xs text-red-900 flex items-start gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="font-bold">সংশোধনের সময়সীমা শেষ হয়েছে:</strong> এই হাজিরার রেকর্ড ২৪ ঘণ্টার বেশি পুরনো। শিক্ষক হিসেবে নতুন সংশোধন করতে অ্যাডমিনের অনুমোদন প্রয়োজন।
          </div>
        </div>
      )}

      {statusMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-green-50 border-green-200 text-green-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 3. Live Stats Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-sm">
          <span className="text-[11px] text-gray-500 font-semibold block">মোট ছাত্র</span>
          <span className="text-lg font-bold font-mono text-gray-900">{totalStudents}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center shadow-sm bg-emerald-50/40">
          <span className="text-[11px] text-emerald-800 font-semibold block">উপস্থিত</span>
          <span className="text-lg font-bold font-mono text-emerald-700">{presentCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-red-200 text-center shadow-sm bg-red-50/40">
          <span className="text-[11px] text-red-800 font-semibold block">অনুপস্থিত</span>
          <span className="text-lg font-bold font-mono text-red-700">{absentCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-amber-200 text-center shadow-sm bg-amber-50/40">
          <span className="text-[11px] text-amber-800 font-semibold block">দেরি (Late)</span>
          <span className="text-lg font-bold font-mono text-amber-700">{lateCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-blue-200 text-center shadow-sm bg-blue-50/40">
          <span className="text-[11px] text-blue-800 font-semibold block">ছুটি (Leave)</span>
          <span className="text-lg font-bold font-mono text-blue-700">{leaveCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-sm">
          <span className="text-[11px] text-gray-500 font-semibold block">উপস্থিতির হার</span>
          <span className="text-lg font-bold font-mono text-[#0D5C3A]">
            {attendanceRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 4. Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAllPresent}
            disabled={!canEdit || isLocked}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            সবাই উপস্থিত (All Present)
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={!hasUnsavedChanges}
            className="border border-gray-300 hover:bg-gray-100 disabled:opacity-40 text-gray-700 px-3 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            রিসেট
          </button>
        </div>

        {hasUnsavedChanges && (
          <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            অসংরক্ষিত পরিবর্তন রয়েছে
          </span>
        )}
      </div>

      {/* 5. Roll-Ordered Student List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loadingSheet ? (
          <div className="p-10 text-center text-xs text-gray-500">
            শিক্ষার্থী ও হাজিরার তালিকা লোড হচ্ছে...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-xs text-gray-500">
            এই জামাত ও শাখায় কোনো সক্রিয় শিক্ষার্থী পাওয়া যায়নি।
          </div>
        ) : (
          <form onSubmit={handleSaveAttendance}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F8F3] border-b border-gray-200 text-gray-700 font-semibold">
                  <tr>
                    <th className="p-3 w-16 text-center">রোল</th>
                    <th className="p-3">শিক্ষার্থী আইডি ও নাম</th>
                    <th className="p-3 w-32">আবাসিক অবস্থা</th>
                    <th className="p-3 text-center w-72">হাজিরা স্ট্যাটাস</th>
                    <th className="p-3 w-48">ছুটি / মন্তব্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((st) => (
                    <tr
                      key={st.studentId}
                      className={`hover:bg-gray-50 transition ${
                        st.status === "ABSENT"
                          ? "bg-red-50/30"
                          : st.status === "LATE"
                          ? "bg-amber-50/20"
                          : st.status === "LEAVE"
                          ? "bg-blue-50/20"
                          : ""
                      }`}
                    >
                      {/* Roll */}
                      <td className="p-3 text-center">
                        <span className="w-7 h-7 rounded-full bg-emerald-100/70 text-[#0D5C3A] font-mono font-bold flex items-center justify-center mx-auto text-xs">
                          {st.rollNumber}
                        </span>
                      </td>

                      {/* Name & ID */}
                      <td className="p-3">
                        <div className="font-semibold text-gray-900">{st.fullNameBn}</div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {st.studentIdNumber} {st.sectionNameBn ? `• শাখা: ${st.sectionNameBn}` : ""}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            st.isOrphan
                              ? "bg-purple-100 text-purple-800"
                              : st.residentialStatus === "RESIDENTIAL"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {st.isOrphan
                            ? "এতিম (বোর্ডিং)"
                            : st.residentialStatus === "RESIDENTIAL"
                            ? "আবাসিক"
                            : "অনাবাসিক"}
                        </span>
                      </td>

                      {/* Attendance Buttons */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                          <button
                            type="button"
                            disabled={!canEdit || isLocked}
                            onClick={() => handleStatusChange(st.studentId, "PRESENT")}
                            className={`px-3 py-1.5 rounded-md font-bold text-xs transition ${
                              st.status === "PRESENT"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            উপস্থিত
                          </button>

                          <button
                            type="button"
                            disabled={!canEdit || isLocked}
                            onClick={() => handleStatusChange(st.studentId, "ABSENT")}
                            className={`px-3 py-1.5 rounded-md font-bold text-xs transition ${
                              st.status === "ABSENT"
                                ? "bg-red-600 text-white shadow-sm"
                                : "text-gray-600 hover:text-red-700 hover:bg-red-50"
                            }`}
                          >
                            অনুপস্থিত
                          </button>

                          <button
                            type="button"
                            disabled={!canEdit || isLocked}
                            onClick={() => handleStatusChange(st.studentId, "LATE")}
                            className={`px-3 py-1.5 rounded-md font-bold text-xs transition ${
                              st.status === "LATE"
                                ? "bg-amber-600 text-white shadow-sm"
                                : "text-gray-600 hover:text-amber-700 hover:bg-amber-50"
                            }`}
                          >
                            দেরি
                          </button>

                          <button
                            type="button"
                            disabled={!canEdit || isLocked}
                            onClick={() => handleStatusChange(st.studentId, "LEAVE")}
                            className={`px-3 py-1.5 rounded-md font-bold text-xs transition ${
                              st.status === "LEAVE"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-600 hover:text-blue-700 hover:bg-blue-50"
                            }`}
                          >
                            ছুটি
                          </button>
                        </div>
                      </td>

                      {/* Leave Reason or Remarks */}
                      <td className="p-3">
                        {st.status === "LEAVE" ? (
                          <input
                            type="text"
                            placeholder="ছুটির কারণ..."
                            disabled={!canEdit || isLocked}
                            value={st.leaveReason || ""}
                            onChange={(e) => handleLeaveReasonChange(st.studentId, e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-blue-300 rounded bg-blue-50/50 focus:ring-1 focus:ring-blue-600 outline-none"
                          />
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sticky Save Bar */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                তারিখ: <strong className="font-mono">{date}</strong> | চিহ্নিত ছাত্র:{" "}
                <strong className="text-[#0D5C3A] font-mono">
                  {students.filter((s) => s.status !== "UNMARKED").length} / {totalStudents}
                </strong>
              </span>

              <button
                type="submit"
                disabled={saving || !canEdit || isLocked}
                className="bg-[#0D5C3A] hover:bg-[#158052] disabled:opacity-50 text-white px-6 py-2 rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {saving ? "সংরক্ষণ হচ্ছে..." : "হাজিরা সংরক্ষণ করুন"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
