"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  RotateCcw,
  Sparkles,
  Users,
  Check,
  X,
  MessageSquare,
  UserCheck,
} from "lucide-react";

interface LeaveType {
  id: string;
  code: string;
  nameBn: string;
  nameEn: string;
  defaultDaysPerYear: number;
  isPaid: boolean;
}

interface LeaveBalance {
  id: string;
  leaveTypeId: string;
  leaveType: LeaveType;
  allowedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

interface LeaveRequestItem {
  id: string;
  requestCode: string;
  leaveTypeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  emergencyContact?: string | null;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  decisionReason?: string | null;
  createdAt: string;
}

interface StudentLeaveItem {
  id: string;
  studentId: string;
  studentName: string;
  studentIdNumber: string;
  photoUrl?: string | null;
  rollNumber: string;
  className: string;
  sectionName: string;
  guardianName: string;
  guardianPhone: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string | null;
  createdAt: string;
}

export default function TeacherLeaveManager() {
  const [activeTab, setActiveTab] = useState<"MY_LEAVE" | "STUDENT_LEAVE">("MY_LEAVE");

  // Teacher's Own Leave State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Student Leave State
  const [studentLeaves, setStudentLeaves] = useState<StudentLeaveItem[]>([]);
  const [studentLeaveLoading, setStudentLeaveLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<{ [key: string]: string }>({});

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/teacher/leave");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ছুটির তথ্য লোড করতে ব্যর্থ হয়েছে।");
      }
      setRequests(data.requests || []);
      setLeaveTypes(data.leaveTypes || []);
      setBalances(data.balances || []);
      if (data.leaveTypes && data.leaveTypes.length > 0 && !leaveTypeId) {
        setLeaveTypeId(data.leaveTypes[0].id);
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentLeaves = async () => {
    try {
      setStudentLeaveLoading(true);
      const res = await fetch("/api/teacher/leave/students");
      const data = await res.json();
      if (res.ok && data.requests) {
        setStudentLeaves(data.requests);
      }
    } catch (err) {
      console.error("Failed to fetch student leaves", err);
    } finally {
      setStudentLeaveLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
    fetchStudentLeaves();
  }, []);

  const handleReviewStudentLeave = async (
    requestId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      setActionLoadingId(requestId);
      const res = await fetch("/api/teacher/leave/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          status,
          teacherNote: actionNote[requestId] || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "কার্যক্রম সফল হয়নি।");
        return;
      }
      await fetchStudentLeaves();
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Compute duration
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    const diff = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysCount = calculateDays();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!leaveTypeId) {
      setError("ছুটির ধরন নির্বাচন করুন।");
      return;
    }
    if (!startDate || !endDate) {
      setError("ছুটির শুরুর ও শেষের তারিখ নির্বাচন করুন।");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("ছুটির শেষের তারিখ শুরুর তারিখের পূর্বের হতে পারে না।");
      return;
    }
    if (!reason.trim()) {
      setError("ছুটির সুনির্দিষ্ট কারণ উল্লেখ করুন।");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/teacher/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveTypeId,
          startDate,
          endDate,
          reason: reason.trim(),
          emergencyContact: emergencyContact.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ছুটির আবেদন দাখিল ব্যর্থ হয়েছে।");
      }

      setSuccessMessage(
        `ছুটির আবেদন সফলভাবে দাখিল হয়েছে (আবেদন কোড: ${data.request?.requestCode || ""})।`
      );
      setReason("");
      setEmergencyContact("");
      await fetchLeaveData();
    } catch (err: any) {
      setError(err.message || "ছুটির আবেদন প্রক্রিয়াকরণে সমস্যা হয়েছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            অনুমোদিত
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            প্রত্যাখ্যাত
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            বাতিলকৃত
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            পর্যালোচনায় / অপেক্ষমান
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("MY_LEAVE")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === "MY_LEAVE"
              ? "border-[#0D5C3A] text-[#0D5C3A]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>আমার ছুটির আবেদন</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("STUDENT_LEAVE");
            fetchStudentLeaves();
          }}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === "STUDENT_LEAVE"
              ? "border-[#0D5C3A] text-[#0D5C3A]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>শিক্ষার্থীদের ছুটির আবেদন পর্যালোচনা</span>
          {studentLeaves.filter((s) => s.status === "PENDING").length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-mono">
              {studentLeaves.filter((s) => s.status === "PENDING").length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "STUDENT_LEAVE" ? (
        /* Student Leave Review Section */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#0D5C3A]" />
                ক্লাসের শিক্ষার্থীদের ছুটির আবেদন ও অভিভাবক মতামত
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                আপনার তত্ত্বাবধানে থাকা ক্লাসের শিক্ষার্থীদের অভিভাবক প্রেরিত ছুটির আবেদন পর্যালোচনা ও সুপারিশ করুন।
              </p>
            </div>
            <button
              onClick={fetchStudentLeaves}
              disabled={studentLeaveLoading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${studentLeaveLoading ? "animate-spin" : ""}`} />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          {studentLeaveLoading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              শিক্ষার্থীদের ছুটির তথ্য লোড হচ্ছে...
            </div>
          ) : studentLeaves.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600">কোনো শিক্ষার্থীর ছুটির আবেদন জমা নেই</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                অভিভাবকগণ পোর্টাল থেকে ছুটির আবেদন দাখিল করলে এখানে প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {studentLeaves.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border-2 border-slate-100 hover:border-emerald-200 rounded-xl bg-slate-50/50 hover:bg-white transition space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.studentName}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                        আইডি: {item.studentIdNumber}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                        {item.className} ({item.sectionName}) - রোল: {item.rollNumber}
                      </span>
                    </div>
                    <div>{getStatusBadge(item.status)}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <strong>ছুটির সময়কাল:</strong>{" "}
                      {new Date(item.startDate).toLocaleDateString("bn-BD")} হতে{" "}
                      {new Date(item.endDate).toLocaleDateString("bn-BD")}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <strong>অভিভাবক:</strong> {item.guardianName} |{" "}
                      <a
                        href={`tel:${item.guardianPhone}`}
                        className="inline-flex items-center gap-1 font-mono text-[#0D5C3A] font-bold hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        {item.guardianPhone}
                      </a>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700">
                    <strong>ছুটির কারণ:</strong> {item.reason}
                  </div>

                  {item.adminNote && (
                    <div className="text-xs p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                      <strong>শিক্ষক / মুহতামিমের মন্তব্য:</strong> {item.adminNote}
                    </div>
                  )}

                  {item.status === "PENDING" && (
                    <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-2 items-center">
                      <div className="relative flex-1 w-full">
                        <input
                          type="text"
                          placeholder="মন্তব্য বা সুপারিশ লিখুন (ঐচ্ছিক)..."
                          value={actionNote[item.id] || ""}
                          onChange={(e) =>
                            setActionNote({ ...actionNote, [item.id]: e.target.value })
                          }
                          className="w-full text-xs p-2 pl-7 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                        />
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleReviewStudentLeave(item.id, "APPROVED")}
                          disabled={actionLoadingId === item.id}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>অনুমোদন করুন</span>
                        </button>
                        <button
                          onClick={() => handleReviewStudentLeave(item.id, "REJECTED")}
                          disabled={actionLoadingId === item.id}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>প্রত্যাখ্যান</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Teacher's Own Leave Section */
        <>
          {balances.length > 0 && (
            <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>আমার বর্তমান বাৎসরিক ছুটির ব্যালেন্স ({new Date().getFullYear()})</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ডিজিটাল রেকর্ড
                </span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 perspective-1000">
                {balances.map((b) => (
                  <div
                    key={b.id}
                    className="card-3d p-4 bg-white border-2 border-slate-200/90 hover:border-[#D4AF37] rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-[#D4AF37]" />
                    <span className="text-xs font-bold text-slate-800 truncate pt-1">
                      {b.leaveType?.nameBn || "ছুটি"}
                    </span>
                    <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-2">
                      <span className="text-xl font-black text-[#0D5C3A] font-mono">
                        {b.remainingDays} <span className="text-xs font-sans font-bold">দিন</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        ব্যবহৃত: {b.usedDays} দিন
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#0D5C3A]" />
                  মুহতামিম বরাবর ছুটির আবেদন
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ছুটির কারণ ও সময়কাল উল্লেখ করে অনলাইনে আবেদন দাখিল করুন।
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ছুটির ধরন <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={leaveTypeId}
                    onChange={(e) => setLeaveTypeId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]"
                  >
                    {leaveTypes.map((lt) => (
                      <option key={lt.id} value={lt.id}>
                        {lt.nameBn} ({lt.defaultDaysPerYear} দিন/বছর)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      শুরুর তারিখ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      শেষের তারিখ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]"
                    />
                  </div>
                </div>

                {daysCount > 0 && (
                  <div className="p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-emerald-800 text-[11px] font-semibold flex items-center justify-between">
                    <span>মোট ছুটির সময়কাল:</span>
                    <span className="font-bold font-mono text-xs">{daysCount} দিন</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    জরুরি যোগাযোগের মোবাইল নম্বর
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="017XXXXXXXX"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="w-full p-2.5 pl-8 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ছুটির সুনির্দিষ্ট কারণ ও বিবরণ <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="ছুটি গ্রহণের কারণ বিস্তারিত লিখুন..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>আবেদন পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>আবেদন দাখিল করুন</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* History Table */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0D5C3A]" />
                    আবেদনের ইতিহাস ও বর্তমান স্ট্যাটাস
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    আপনার দাখিলকৃত সকল ছুটির আবেদন ও প্রশাসনিক সিদ্ধান্ত।
                  </p>
                </div>
                <button
                  onClick={fetchLeaveData}
                  disabled={loading}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                  title="রিফ্রেশ করুন"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  ছুটির আবেদন তালিকা লোড হচ্ছে...
                </div>
              ) : requests.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-600">কোনো ছুটির আবেদন পাওয়া যায়নি</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    প্রয়োজনে বাম পাশের ফর্ম থেকে নতুন ছুটির আবেদন দাখিল করতে পারেন।
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="space-y-3">
                    {requests.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 border border-slate-200/80 rounded-xl bg-slate-50/60 hover:bg-white hover:border-emerald-300 hover:shadow-sm transition space-y-2 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              {req.requestCode}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-200">
                              {req.leaveType?.nameBn || "ছুটি"}
                            </span>
                          </div>
                          <div>{getStatusBadge(req.status)}</div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px]">
                          <div>
                            <strong>সময়কাল:</strong>{" "}
                            {new Date(req.startDate).toLocaleDateString("bn-BD")} হতে{" "}
                            {new Date(req.endDate).toLocaleDateString("bn-BD")} (
                            {req.totalDays} দিন)
                          </div>
                          {req.emergencyContact && (
                            <div>
                              <strong>জরুরি যোগাযোগ:</strong> {req.emergencyContact}
                            </div>
                          )}
                        </div>

                        <div className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 text-[11px]">
                          <strong>কারণ:</strong> {req.reason}
                        </div>

                        {req.decisionReason && (
                          <div className="text-[11px] p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900">
                            <strong>প্রশাসনিক মন্তব্য:</strong> {req.decisionReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
