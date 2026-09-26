"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Lock,
  Unlock,
  Edit3,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  UserX,
  Clock,
  Printer,
  X,
  Save,
} from "lucide-react";

interface AdminAttendanceItem {
  attendanceId?: string | null;
  studentId: string;
  studentIdNumber: string;
  fullNameBn: string;
  fullNameEn?: string | null;
  fatherNameBn?: string | null;
  fatherPhone?: string | null;
  rollNumber?: number | null;
  residentialStatus?: string;
  isOrphan?: boolean;
  photoUrl?: string | null;
  classNameBn?: string;
  sectionNameBn?: string | null;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "UNMARKED";
  leaveReason?: string | null;
  remarks?: string | null;
  correctionReason?: string | null;
  updatedAt?: string | null;
}

export default function AdminAttendanceCockpit() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [items, setItems] = useState<AdminAttendanceItem[]>([]);
  const [summary, setSummary] = useState<any>({
    totalEligibleStudents: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    leaveCount: 0,
    attendanceRate: 0,
  });

  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState<AdminAttendanceItem | null>(null);
  const [newStatus, setNewStatus] = useState<"PRESENT" | "ABSENT" | "LATE" | "LEAVE">("PRESENT");
  const [newLeaveReason, setNewLeaveReason] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correcting, setCorrecting] = useState(false);

  // 1. Initial Load of Sessions and Classes
  useEffect(() => {
    async function loadMeta() {
      try {
        const [clsRes, sessRes] = await Promise.all([
          fetch("/api/academic/classes"),
          fetch("/api/academic/sessions"),
        ]);
        const clsData = await clsRes.json();
        const sessData = await sessRes.json();

        if (sessData.sessions) {
          setSessions(sessData.sessions);
          const current = sessData.sessions.find((s: any) => s.isCurrent) || sessData.sessions[0];
          if (current) setSelectedSessionId(current.id);
        }

        if (clsData.classes) {
          setClasses(clsData.classes);
        }
      } catch (err) {
        console.error("Meta load error:", err);
      }
    }
    loadMeta();
  }, []);

  // 2. Fetch Attendance Data
  const fetchAttendance = async () => {
    if (!selectedSessionId) return;
    try {
      setLoading(true);
      setStatusMessage(null);

      const params = new URLSearchParams({
        sessionId: selectedSessionId,
        date,
      });
      if (selectedClassId) params.append("classId", selectedClassId);
      if (selectedSectionId) params.append("sectionId", selectedSectionId);
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/admin/attendance?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setItems(data.items || []);
        setIsLocked(!!data.isLocked);
        setLockReason(data.lockReason);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        setStatusMessage({ type: "error", text: data.error || "হাজিরা লোড করতে সমস্যা হয়েছে।" });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: "সার্ভারে সংযোগ ব্যর্থ হয়েছে।" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedSessionId, selectedClassId, selectedSectionId, date, statusFilter]);

  // Handle Lock / Unlock
  const handleToggleLock = async () => {
    if (!selectedClassId) {
      alert("হাজিরা লক বা আনলক করার পূর্বে একটি নির্দিষ্ট জামাত নির্বাচন করুন।");
      return;
    }

    const action = isLocked ? "আনলক" : "লক";
    const reasonPrompt = prompt(
      `আপনি কি এই তারিখের (${date}) হাজিরা ${action} করতে চান? কারণ উল্লেখ করুন:`,
      isLocked ? "অ্যাডমিন অনুমোদন সাপেক্ষে আনলক" : "অফিসিয়াল হাজিরা লক"
    );

    if (reasonPrompt === null) return;

    try {
      setLoading(true);
      const endpoint = isLocked ? "/api/admin/attendance/unlock" : "/api/admin/attendance/lock";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          classId: selectedClassId,
          sectionId: selectedSectionId || null,
          date,
          reason: reasonPrompt,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsLocked(!isLocked);
        setStatusMessage({ type: "success", text: data.message });
      } else {
        setStatusMessage({ type: "error", text: data.error || "কার্য সম্পাদন ব্যর্থ হয়েছে।" });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: "সার্ভার অনুরোধ ব্যর্থ।" });
    } finally {
      setLoading(false);
    }
  };

  // Open Correction Modal
  const openCorrection = (item: AdminAttendanceItem) => {
    setCorrectionTarget(item);
    setNewStatus(item.status === "UNMARKED" ? "PRESENT" : item.status);
    setNewLeaveReason(item.leaveReason || "");
    setCorrectionReason("");
  };

  // Submit Admin Correction
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget) return;

    if (!correctionReason.trim()) {
      alert("হাজিরা সংশোধনের সুনির্দিষ্ট কারণ উল্লেখ করা বাধ্যতামূলক।");
      return;
    }

    try {
      setCorrecting(true);

      // If record already exists in database, call correct API
      if (correctionTarget.attendanceId) {
        const res = await fetch("/api/admin/attendance/correct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendanceId: correctionTarget.attendanceId,
            newStatus,
            leaveReason: newStatus === "LEAVE" ? newLeaveReason : null,
            correctionReason: correctionReason.trim(),
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setStatusMessage({ type: "success", text: "হাজিরা সফলভাবে সংশোধন ও অডিট হয়েছে।" });
          setCorrectionTarget(null);
          fetchAttendance();
        } else {
          alert(data.error || "সংশোধন ব্যর্থ হয়েছে।");
        }
      } else {
        // If it was UNMARKED, save as new admin entry
        const res = await fetch("/api/admin/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: selectedSessionId,
            classId: selectedClassId,
            sectionId: selectedSectionId || null,
            date,
            records: [
              {
                studentId: correctionTarget.studentId,
                status: newStatus,
                leaveReason: newStatus === "LEAVE" ? newLeaveReason : null,
              },
            ],
            correctionReason: correctionReason.trim(),
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setStatusMessage({ type: "success", text: "নতুন হাজিরা রেকর্ড সফলভাবে যুক্ত হয়েছে।" });
          setCorrectionTarget(null);
          fetchAttendance();
        } else {
          alert(data.error || "সংরক্ষণ ব্যর্থ হয়েছে।");
        }
      }
    } catch (err) {
      alert("সার্ভার ত্রুটি ঘটেছে।");
    } finally {
      setCorrecting(false);
    }
  };

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* 1. Filter Cockpit */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0B1914] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0D5C3A]" />
              সার্বিক হাজিরা মনিটরিং ও কন্ট্রোল ককপিট (Admin Attendance Control)
            </h2>
            <p className="text-xs text-gray-500">
              মাদরাসার সকল জামাত ও শাখার হাজিরা নিরীক্ষা, লক/আনলক ও অ্যাডমিন সংশোধন ব্যবস্থা।
            </p>
          </div>

          {/* Lock / Unlock Control */}
          {selectedClassId && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleLock}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                  isLocked
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
                }`}
              >
                {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {isLocked ? "হাজিরা আনলক করুন" : "হাজিরা লক করুন"}
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {/* Session */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">শিক্ষাবর্ষ:</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-semibold bg-white"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameBn} {s.isCurrent ? "(চলতি)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Jamat / Class */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">জামাত / শ্রেণি:</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSectionId("");
              }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-semibold bg-white"
            >
              <option value="">-- সকল জামাত (সার্বিক) --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">শাখা:</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={!selectedClassObj?.sections?.length}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-semibold bg-white disabled:bg-gray-100"
            >
              <option value="">-- সকল শাখা --</option>
              {selectedClassObj?.sections?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">তারিখ:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-mono font-semibold"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">স্ট্যাটাস ফিল্টার:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-semibold bg-white"
            >
              <option value="ALL">সকল অবস্থা</option>
              <option value="PRESENT">উপস্থিত</option>
              <option value="ABSENT">অনুপস্থিত</option>
              <option value="LATE">দেরি</option>
              <option value="LEAVE">ছুটি</option>
              <option value="UNMARKED">অনুপস্থিত/আনমার্কড</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="pt-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="শিক্ষার্থীর নাম, রোল বা ছাত্র আইডি দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchAttendance()}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
            />
          </div>
        </div>
      </div>

      {/* 2. Lock Banner & Feedback */}
      {isLocked && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-xs text-amber-900 flex items-start gap-2 shadow-sm">
          <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="font-bold">এই তারিখের হাজিরা বর্তমানে লক করা আছে:</strong>{" "}
            {lockReason || "অফিসিয়ালভাবে লক করা।"}{" "}
            শিক্ষকগণ এটি সম্পাদনা করতে পারবেন না। অ্যাডমিন হিসেবে আপনি নিচে &ldquo;সংশোধন&rdquo; বাটনে ক্লিক করে যে কোনো রেকর্ড পরিবর্তন করতে পারেন।
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

      {/* 3. Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-sm">
          <span className="text-[11px] text-gray-500 font-semibold block">মোট ছাত্র</span>
          <span className="text-lg font-bold font-mono text-gray-900">
            {summary.totalEligibleStudents || items.length}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center shadow-sm bg-emerald-50/30">
          <span className="text-[11px] text-emerald-800 font-semibold block">উপস্থিত</span>
          <span className="text-lg font-bold font-mono text-emerald-700">{summary.presentCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-red-200 text-center shadow-sm bg-red-50/30">
          <span className="text-[11px] text-red-800 font-semibold block">অনুপস্থিত</span>
          <span className="text-lg font-bold font-mono text-red-700">{summary.absentCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-amber-200 text-center shadow-sm bg-amber-50/30">
          <span className="text-[11px] text-amber-800 font-semibold block">দেরি (Late)</span>
          <span className="text-lg font-bold font-mono text-amber-700">{summary.lateCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-blue-200 text-center shadow-sm bg-blue-50/30">
          <span className="text-[11px] text-blue-800 font-semibold block">ছুটি (Leave)</span>
          <span className="text-lg font-bold font-mono text-blue-700">{summary.leaveCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-sm">
          <span className="text-[11px] text-gray-500 font-semibold block">উপস্থিতির হার</span>
          <span className="text-lg font-bold font-mono text-[#0D5C3A]">
            {summary.attendanceRate?.toFixed(1) || 0}%
          </span>
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-gray-500">হাজিরা রেকর্ড লোড হচ্ছে...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-xs text-gray-500">
            নির্বাচিত শর্তানুযায়ী কোনো হাজিরা রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8F3] border-b border-gray-200 text-gray-700 font-semibold">
                <tr>
                  <th className="p-3 w-16 text-center">রোল</th>
                  <th className="p-3">শিক্ষার্থী</th>
                  <th className="p-3">জামাত ও শাখা</th>
                  <th className="p-3 text-center">হাজিরা স্ট্যাটাস</th>
                  <th className="p-3">ছুটি / মন্তব্য</th>
                  <th className="p-3">অডিট ও সংশোধন কারণ</th>
                  <th className="p-3 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((it) => (
                  <tr key={it.studentId} className="hover:bg-gray-50 transition">
                    <td className="p-3 text-center font-mono font-bold text-[#0D5C3A]">
                      {it.rollNumber || "—"}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-gray-900">{it.fullNameBn}</div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        {it.studentIdNumber} {it.fatherPhone ? `• ${it.fatherPhone}` : ""}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>{it.classNameBn || "—"}</div>
                      <div className="text-[11px] text-gray-500">
                        {it.sectionNameBn ? `শাখা: ${it.sectionNameBn}` : "সাধারণ শাখা"}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          it.status === "PRESENT"
                            ? "bg-green-100 text-green-800"
                            : it.status === "ABSENT"
                            ? "bg-red-100 text-red-800"
                            : it.status === "LATE"
                            ? "bg-amber-100 text-amber-800"
                            : it.status === "LEAVE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {it.status === "PRESENT"
                          ? "উপস্থিত"
                          : it.status === "ABSENT"
                          ? "অনুপস্থিত"
                          : it.status === "LATE"
                          ? "দেরি"
                          : it.status === "LEAVE"
                          ? "ছুটি"
                          : "চিহ্নিত নয়"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">
                      {it.leaveReason ? (
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                          {it.leaveReason}
                        </span>
                      ) : (
                        it.remarks || "—"
                      )}
                    </td>
                    <td className="p-3 text-[11px] text-gray-500">
                      {it.correctionReason ? (
                        <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {it.correctionReason}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openCorrection(it)}
                        className="bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-900 border border-gray-200 px-2.5 py-1 rounded text-[11px] font-semibold transition inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        সংশোধন
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Correction Modal */}
      {correctionTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#0B1914] flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-[#0D5C3A]" />
                অ্যাডমিন হাজিরা সংশোধন (Admin Correction)
              </h3>
              <button
                onClick={() => setCorrectionTarget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded border text-xs space-y-1">
              <p>
                শিক্ষার্থী: <strong>{correctionTarget.fullNameBn}</strong>
              </p>
              <p className="text-gray-500 font-mono">
                আইডি: {correctionTarget.studentIdNumber} | রোল: {correctionTarget.rollNumber || "—"}
              </p>
              <p className="text-gray-500">
                তারিখ: <strong>{date}</strong> | বর্তমান স্ট্যাটাস:{" "}
                <span className="font-bold text-emerald-800">{correctionTarget.status}</span>
              </p>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">নতুন হাজিরা স্ট্যাটাস:</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["PRESENT", "ABSENT", "LATE", "LEAVE"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`py-1.5 rounded font-bold transition text-center ${
                        newStatus === st
                          ? "bg-[#0D5C3A] text-white shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {st === "PRESENT"
                        ? "উপস্থিত"
                        : st === "ABSENT"
                        ? "অনুপস্থিত"
                        : st === "LATE"
                        ? "দেরি"
                        : "ছুটি"}
                    </button>
                  ))}
                </div>
              </div>

              {newStatus === "LEAVE" && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">ছুটির কারণ:</label>
                  <input
                    type="text"
                    placeholder="যেমন: অসুস্থতাজনিত ছুটি"
                    value={newLeaveReason}
                    onChange={(e) => setNewLeaveReason(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-[#0D5C3A] outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  সংশোধনের সুনির্দিষ্ট কারণ (বাধ্যতামূলক):
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="যেমন: শিক্ষক ভুলবশত অনুপস্থিত হিসেবে চিহ্নিত করেছিলেন..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-amber-300 bg-amber-50/30 rounded focus:ring-1 focus:ring-[#0D5C3A] outline-none"
                ></textarea>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  * এই কারণটি অডিট ট্রেইলে স্থায়ীভাবে সংরক্ষিত থাকবে।
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setCorrectionTarget(null)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={correcting}
                  className="px-4 py-1.5 bg-[#0D5C3A] hover:bg-[#158052] text-white rounded font-bold shadow flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  {correcting ? "সংরক্ষণ হচ্ছে..." : "সংশোধন নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
