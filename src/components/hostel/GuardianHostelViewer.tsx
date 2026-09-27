"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  ShieldCheck,
  User,
  RotateCw,
  Send,
  History,
  FileText,
  Info,
  XCircle,
} from "lucide-react";

export default function GuardianHostelViewer({ defaultStudentId }: { defaultStudentId?: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(defaultStudentId || "");
  const [error, setError] = useState<string | null>(null);

  // Request Form Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqType, setReqType] = useState<"ADMISSION" | "STATUS_CHANGE" | "CHECKOUT">("ADMISSION");
  const [targetStatus, setTargetStatus] = useState<"RESIDENTIAL" | "DAY_CARE" | "NON_RESIDENTIAL">("RESIDENTIAL");
  const [desiredEffectiveDate, setDesiredEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [reqReason, setReqReason] = useState("");
  const [reqMsg, setReqMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchHostelData = async (studentId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = studentId ? `/api/portal/hostel?studentId=${studentId}` : "/api/portal/hostel";
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.selectedStudentId) {
          setSelectedStudentId(json.selectedStudentId);
        }
      } else {
        setError(json.error || "হোস্টেল ও আবাসন তথ্য লোড করতে ব্যর্থ।");
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগে ত্রুটি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostelData(defaultStudentId);
  }, [defaultStudentId]);

  const handleStudentChange = (stId: string) => {
    setSelectedStudentId(stId);
    fetchHostelData(stId);
  };

  const handleOpenModal = () => {
    setReqMsg(null);
    setReqReason("");
    // Default target status based on current
    const currentStatus = data?.student?.residentialStatus;
    if (currentStatus === "RESIDENTIAL") {
      setReqType("CHECKOUT");
      setTargetStatus("NON_RESIDENTIAL");
    } else {
      setReqType("ADMISSION");
      setTargetStatus("RESIDENTIAL");
    }
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqReason.trim()) {
      setReqMsg({ text: "আবেদনের কারণ বা বিবরণ প্রদান করুন।", type: "error" });
      return;
    }

    setSubmittingReq(true);
    setReqMsg(null);
    try {
      const res = await fetch("/api/portal/hostel/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          requestType: reqType,
          targetStatus: reqType === "CHECKOUT" ? "NON_RESIDENTIAL" : targetStatus,
          desiredEffectiveDate,
          reason: reqReason,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setReqMsg({ text: json.message || "আবেদন সফলভাবে দাখিল হয়েছে।", type: "success" });
        setTimeout(() => {
          setShowRequestModal(false);
          fetchHostelData(selectedStudentId);
        }, 1500);
      } else {
        setReqMsg({ text: json.error || "আবেদন দাখিল করা যায়নি।", type: "error" });
      }
    } catch (err: any) {
      setReqMsg({ text: err.message || "নেটওয়ার্ক ত্রুটি।", type: "error" });
    } finally {
      setSubmittingReq(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-500 shadow-sm">
        <RotateCw className="w-5 h-5 animate-spin mx-auto text-[#0D5C3A] mb-2" />
        হোস্টেল ও আবাসিক তথ্য লোড হচ্ছে...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6 text-center text-xs text-red-600 shadow-sm">
        <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-500" />
        {error}
      </div>
    );
  }

  const { student, enrollment, requests, history, financeSummary, rules } = data || {};

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESIDENTIAL":
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            আবাসিক (Full Residential)
          </span>
        );
      case "DAY_CARE":
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            ডে-কেয়ার (Day Care — খাদ্য ফি ছাড়)
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
            <User className="w-3.5 h-3.5 text-gray-500" />
            অনাবাসিক (Non-Residential)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Child Switcher */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#0D5C3A]" />
            <h2 className="text-base font-bold text-gray-900">
              হোস্টেল ও আবাসিক সেবা পোর্টাল
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            শিক্ষার্থীর আবাসন অবস্থা, চেক-ইন/আউট ইতিহাস, নির্ধারিত ফি এবং আবেদনের বিবরণ।
          </p>
        </div>

        {/* Children switcher if guardian has multiple children */}
        {data?.allChildren && data.allChildren.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">সন্তান পরিবর্তন:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="p-1.5 border border-gray-300 rounded text-xs outline-none bg-gray-50 font-medium"
            >
              {data.allChildren.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.fullNameBn} (রোল {c.enrollments?.[0]?.rollNumber || "N/A"})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {student && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Status & Details Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Status Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold font-mono text-base shadow-inner">
                    {student.enrollments?.[0]?.rollNumber || "ID"}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{student.fullNameBn}</h3>
                    <p className="text-xs text-gray-500 font-mono">
                      আইডি: {student.studentId} • শ্রেণি: {student.enrollments?.[0]?.class?.nameBn || "N/A"}
                    </p>
                  </div>
                </div>
                <div>{getStatusBadge(student.residentialStatus)}</div>
              </div>

              {/* Residential Context Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-gray-500 text-[11px] block">আবাসন স্ট্যাটাস</span>
                  <span className="font-bold text-gray-800 block mt-0.5">
                    {student.residentialStatus === "RESIDENTIAL"
                      ? "আবাসিক"
                      : student.residentialStatus === "DAY_CARE"
                      ? "ডে-কেয়ার"
                      : "অনাবাসিক"}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-gray-500 text-[11px] block">ভর্তি / চেক-ইন তারিখ</span>
                  <span className="font-bold text-gray-800 block mt-0.5 font-mono">
                    {enrollment?.checkInDate
                      ? new Date(enrollment.checkInDate).toLocaleDateString("bn-BD")
                      : enrollment?.admissionDate
                      ? new Date(enrollment.admissionDate).toLocaleDateString("bn-BD")
                      : "প্রযোজ্য নয়"}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-gray-500 text-[11px] block">বর্তমান অবস্থা</span>
                  <span className="font-bold text-emerald-700 block mt-0.5">
                    {enrollment?.status === "CHECKED_IN"
                      ? "উপস্থিত / সক্রিয়"
                      : enrollment?.status === "APPROVED"
                      ? "অনুমোদিত"
                      : enrollment?.status === "CHECKED_OUT"
                      ? "প্রস্থানকৃত (Checked Out)"
                      : "রেকর্ড সংরক্ষিত"}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-gray-500 text-[11px] block">খাদ্য বিলিং নীতি</span>
                  <span className="font-bold text-gray-800 block mt-0.5">
                    {student.residentialStatus === "DAY_CARE"
                      ? "৳০ (ডে-কেয়ার ছাড়)"
                      : student.residentialStatus === "RESIDENTIAL"
                      ? "প্রযোজ্য"
                      : "অনাবাসিক"}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleOpenModal}
                  className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  আবাসন আবেদন দাখিল করুন
                </button>
              </div>
            </div>

            {/* Submitted Requests Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#0D5C3A]" />
                  আপনার দাখিলকৃত আবাসন আবেদনসমূহ
                </h4>
                <span className="text-[11px] text-gray-500 font-mono">
                  মোট: {requests?.length || 0} টি
                </span>
              </div>

              {(!requests || requests.length === 0) ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  কোনো চলমান বা পূর্ববর্তী আবেদন নেই।
                </div>
              ) : (
                <div className="divide-y divide-gray-100 text-xs">
                  {requests.map((req: any) => (
                    <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800 font-mono">{req.requestNumber}</span>
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {req.requestType === "ADMISSION"
                              ? "আবাসিক ভর্তি"
                              : req.requestType === "CHECKOUT"
                              ? "চেক-আউট / প্রস্থান"
                              : "স্ট্যাটাস পরিবর্তন"}
                          </span>
                        </div>
                        <p className="text-gray-600 text-[11px] mt-1">{req.reason}</p>
                        <span className="text-[10px] text-gray-400 font-mono">
                          দাখিল: {new Date(req.createdAt).toLocaleDateString("bn-BD")} • কাঙ্ক্ষিত তারিখ: {new Date(req.desiredEffectiveDate).toLocaleDateString("bn-BD")}
                        </span>
                      </div>
                      <div className="flex flex-col sm:items-end">
                        {req.status === "PENDING" && (
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            বিবেচনাধীন (Pending)
                          </span>
                        )}
                        {req.status === "APPROVED" && (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            অনুমোদিত (Approved)
                          </span>
                        )}
                        {req.status === "REJECTED" && (
                          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-600" />
                            বাতিল (Rejected)
                          </span>
                        )}
                        {req.adminNotes && (
                          <span className="text-[10px] text-gray-500 mt-1 italic">
                            মন্তব্য: {req.adminNotes}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Residential History Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#0D5C3A]" />
                  শিক্ষার্থীর আবাসন পরিবর্তন ইতিহাস (ঐতিহাসিক অপরিবর্তনীয় রেকর্ড)
                </h4>
                <span className="text-[11px] text-gray-500 font-mono">
                  {history?.length || 0} টি পরিবর্তন
                </span>
              </div>

              {(!history || history.length === 0) ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  কোনো আবাসন পরিবর্তনের রেকর্ড নেই।
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                  {history.map((h: any) => (
                    <div key={h.id} className="relative text-xs">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#0D5C3A] border-2 border-white shadow" />
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-bold text-gray-900">
                            {h.previousStatus || "প্রাথমিক"} ➔ {h.newStatus}
                          </span>
                          <span className="text-[11px] text-gray-500 font-mono">
                            কার্যকর তারিখ: {new Date(h.effectiveDate).toLocaleDateString("bn-BD")}
                          </span>
                        </div>
                        {h.reason && (
                          <p className="text-gray-600 mt-1 text-[11px] leading-relaxed">
                            কারণ: {h.reason}
                          </p>
                        )}
                        <div className="mt-1 text-[10px] text-gray-400 flex items-center justify-between">
                          <span>লগ করেছেন: {h.recordedBy?.name || "এডমিন"}</span>
                          <span>সেশন: {h.session?.name || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Financial Overview & Madrasha Rules */}
          <div className="space-y-6">
            {/* Financial Summary Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <DollarSign className="w-4 h-4 text-[#C59B27]" />
                আবাসিক আর্থিক সারসংক্ষেপ (Finance Integration)
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded bg-gray-50 border border-gray-100">
                  <span className="text-gray-600">হোস্টেল ফি বকেয়া:</span>
                  <span className="font-bold font-mono text-gray-900">
                    ৳ {financeSummary?.hostelFeeDue?.toLocaleString("bn-BD") || "০"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded bg-gray-50 border border-gray-100">
                  <span className="text-gray-600">খাদ্য ফি বকেয়া:</span>
                  <span className="font-bold font-mono text-gray-900">
                    ৳ {financeSummary?.foodFeeDue?.toLocaleString("bn-BD") || "০"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-900">
                  <span className="font-semibold">পরিশোধিত ফি:</span>
                  <span className="font-bold font-mono">
                    ৳ {financeSummary?.paidAmount?.toLocaleString("bn-BD") || "০"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded bg-red-50 border border-red-100 text-red-900">
                  <span className="font-bold">সর্বমোট আবাসন বকেয়া:</span>
                  <span className="font-bold font-mono text-sm">
                    ৳ {financeSummary?.outstandingBalance?.toLocaleString("bn-BD") || "০"}
                  </span>
                </div>
              </div>

              {student.residentialStatus === "DAY_CARE" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>ডে-কেয়ার নীতি:</strong> মাদরাসার প্রাতিষ্ঠানিক বিধান অনুযায়ী ডে-কেয়ার ছাত্রদের জন্য কোনো খাদ্য ফি প্রযোজ্য নয় (৳০)।
                  </span>
                </div>
              )}
            </div>

            {/* Hostel Rules & Notice Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <ShieldCheck className="w-4 h-4 text-[#0D5C3A]" />
                আবাসিক শৃঙ্খলা ও নীতিমালা
              </h4>

              <div className="text-xs text-gray-600 space-y-2 leading-relaxed">
                <p>
                  ১. আবাসিক শিক্ষার্থীদের অবশ্যই জামাতে ৫ ওয়াক্ত সালাত ও নির্ধারিত মোরাকাবা-মুতালাআয় অংশ নিতে হবে।
                </p>
                <p>
                  ২. হোস্টেল ত্যাগ বা ছুটির পূর্বে অভিভাবককে অনলাইন পোর্টাল অথবা অফিসে লিখিত চেক-আউট আবেদন দাখিল করতে হবে।
                </p>
                <p>
                  ৩. প্রতি ইংরেজি মাসের ১০ তারিখের মধ্যে হোস্টেল ও খাদ্য ফি পরিশোধ করা বাঞ্ছনীয়।
                </p>
                <p>
                  ৪. অননুমোদিত কোনো বৈদ্যুতিক বা ক্ষতিকর সামগ্রী রাখা সম্পূর্ণ নিষিদ্ধ।
                </p>
              </div>

              {rules?.notes && (
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-700 italic">
                  মাদরাসা নোটিশ: {rules.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#0D5C3A]" />
                আবাসন সংক্রান্ত অভিভাবক আবেদন দাখিল
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            {reqMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  reqMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {reqMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  শিক্ষার্থী
                </label>
                <input
                  type="text"
                  disabled
                  value={`${student.fullNameBn} (আইডি: ${student.studentId})`}
                  className="w-full p-2 bg-gray-100 border border-gray-300 rounded text-gray-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    আবেদনের ধরণ *
                  </label>
                  <select
                    value={reqType}
                    onChange={(e: any) => setReqType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  >
                    <option value="ADMISSION">আবাসিক ভর্তি আবেদন</option>
                    <option value="STATUS_CHANGE">আবাসিক ধরণ পরিবর্তন</option>
                    <option value="CHECKOUT">হোস্টেল প্রস্থান (Check-Out)</option>
                  </select>
                </div>

                {reqType !== "CHECKOUT" && (
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      কাঙ্ক্ষিত আবাসন ধরণ *
                    </label>
                    <select
                      value={targetStatus}
                      onChange={(e: any) => setTargetStatus(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                    >
                      <option value="RESIDENTIAL">আবাসিক (Full Residential)</option>
                      <option value="DAY_CARE">ডে-কেয়ার (Day Care)</option>
                      <option value="NON_RESIDENTIAL">অনাবাসিক (Non-Residential)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    কাঙ্ক্ষিত কার্যকর তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={desiredEffectiveDate}
                    onChange={(e) => setDesiredEffectiveDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  আবেদনের কারণ বা বিবরণ *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="যেমন: পড়াশোনার সুবিধার জন্য আবাসিক করতে চাই বা দূরবর্তী বাড়ি হওয়ায়..."
                  className="w-full p-2.5 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-5 py-2 rounded font-bold shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingReq ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  আবেদন দাখিল করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
