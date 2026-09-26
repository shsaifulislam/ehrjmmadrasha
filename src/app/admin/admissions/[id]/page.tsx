"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowLeft,
  User,
  Users,
  Home,
  BookOpen,
  HeartHandshake,
  Paperclip,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  AlertTriangle,
  ShieldAlert,
  Send,
  Printer,
  History,
  Check,
  AlertCircle,
} from "lucide-react";

export default function AdminAdmissionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [application, setApplication] = useState<any>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available sections for the desired class
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");

  // Modals for actions
  const [modalType, setModalType] = useState<
    "VERIFY" | "EXAM" | "CORRECTION" | "REJECT" | "APPROVE" | null
  >(null);

  // Form states inside modals
  const [verifyStatus, setVerifyStatus] = useState("VERIFIED");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examResult, setExamResult] = useState<"PASS" | "FAIL" | "">("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [linkExistingStudentId, setLinkExistingStudentId] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");

  const fetchApplicationDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/admissions/${id}`);
      const data = await res.json();
      if (res.ok && data.application) {
        setApplication(data.application);
        setDuplicateMatches(data.duplicateMatches || []);
        setAuditLogs(data.auditLogs || []);
        if (data.application.desiredSectionId) {
          setSelectedSectionId(data.application.desiredSectionId);
        }

        // Fetch sections for this class
        if (data.application.desiredClassId) {
          fetch(`/api/academic/sections?classId=${data.application.desiredClassId}`)
            .then((r) => r.json())
            .then((sData) => {
              if (sData.sections) setSections(sData.sections);
            })
            .catch(() => {});
        }
      } else {
        setErrorMsg(data.error || "আবেদন পাওয়া যায়নি।");
      }
    } catch {
      setErrorMsg("সার্ভার ত্রুটি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchApplicationDetails();
  }, [id]);

  // Execute Workflow Action
  const handleAction = async (endpoint: string, payload: any) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/admissions/${id}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setModalType(null);
        alert(data.message || "কার্যক্রম সফলভাবে সম্পন্ন হয়েছে।");
        fetchApplicationDetails();
      } else {
        alert(data.error || "কার্যক্রম সম্পন্ন করা সম্ভব হয়নি।");
      }
    } catch {
      alert("সার্ভারের সাথে সংযোগ ব্যাহত হয়েছে।");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-stone-500 max-w-7xl mx-auto">
        আবেদনের তথ্য লোড করা হচ্ছে...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-12 text-center max-w-7xl mx-auto space-y-4">
        <div className="text-red-600 font-bold">{errorMsg || "আবেদন খুঁজে পাওয়া যায়নি।"}</div>
        <Link href="/admin/admissions" className="text-xs text-[#0D5C3A] underline font-semibold">
          ← ভর্তি আবেদন তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  const isApproved = application.status === "APPROVED";
  const isRejected = application.status === "REJECTED";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/admissions"
            className="p-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-[#0D5C3A]">
                {application.applicationNumber}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  application.source === "OFFICE"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {application.source === "OFFICE" ? "অফিস এন্ট্রি" : "অনলাইন আবেদন"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border">
                {application.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-stone-900 mt-0.5">
              {application.studentNameBn}
              {application.studentNameEn && (
                <span className="text-sm font-normal text-stone-500 ml-2">
                  ({application.studentNameEn})
                </span>
              )}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            আবেদন প্রিন্ট
          </button>
        </div>
      </div>

      {/* Main Cockpit Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Details, Duplicates, Documents, History */}
        <div className="lg:col-span-2 space-y-6">
          {/* DUPLICATE WARNING CARD */}
          {duplicateMatches.length > 0 && !isApproved && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  সম্ভাব্য পূর্ববর্তী রেকর্ড পাওয়া গেছে ({duplicateMatches.length} টি ম্যাচ)
                </div>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  যাচাই সাপেক্ষ
                </span>
              </div>
              <p className="text-xs text-amber-800">
                মাদরাসার ডাটাবেজে অনুরূপ জন্ম নিবন্ধন, এনআইডি, মোবাইল বা নাম পাওয়া গেছে। এটি একই শিক্ষার্থীর পুনরায় আবেদন হলে নিচের বাটনের মাধ্যমে বিদ্যমান শিক্ষার্থীর সাথে লিংক করতে পারেন।
              </p>

              <div className="space-y-2">
                {duplicateMatches.map((match, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-3 rounded-lg border border-amber-200 text-xs flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-stone-900 flex items-center gap-2">
                        <span>{match.fullNameBn}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-700">
                          {match.identifier}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            match.confidence === "HIGH"
                              ? "bg-rose-100 text-rose-800"
                              : match.confidence === "MEDIUM"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {match.confidence} CONFIDENCE
                        </span>
                      </div>
                      <div className="text-stone-600 text-[11px] mt-0.5">{match.matchReason}</div>
                      <div className="text-stone-400 text-[10px]">
                        ফোন: {match.guardianPhone} | স্ট্যাটাস: {match.status}
                      </div>
                    </div>

                    {match.sourceType === "STUDENT" && (
                      <button
                        type="button"
                        onClick={() => {
                          setLinkExistingStudentId(match.recordId);
                          setModalType("APPROVE");
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold"
                      >
                        এই শিক্ষার্থীর সাথে লিংক করুন
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APPROVED SUCCESS BANNER */}
          {isApproved && application.createdStudent && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                শিক্ষার্থী ভর্তি সফলভাবে অনুমোদিত ও তালিকাভুক্ত হয়েছে!
              </div>
              <div className="text-xs text-emerald-800 space-y-1">
                <p>
                  স্থায়ী শিক্ষার্থী আইডি:{" "}
                  <strong className="font-mono text-stone-900">
                    {application.createdStudent.studentIdNumber}
                  </strong>
                </p>
                <p>
                  তালিকাভুক্ত জামাত:{" "}
                  <strong>{application.desiredClass?.nameBn}</strong>
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/admin/students"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D5C3A] hover:bg-[#158052] text-white rounded text-xs font-semibold shadow-sm"
                >
                  শিক্ষার্থী প্রোফাইল দেখুন →
                </Link>
              </div>
            </div>
          )}

          {/* 1. Student Personal Information Card */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-[#0D5C3A] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-200">
              <User className="w-4 h-4" />
              ১. শিক্ষার্থীর পরিচিতি
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-stone-500 block">বাংলা নাম:</span>
                <span className="font-bold text-stone-900">{application.studentNameBn}</span>
              </div>
              <div>
                <span className="text-stone-500 block">ইংরেজি নাম:</span>
                <span className="font-semibold text-stone-900">{application.studentNameEn || "—"}</span>
              </div>
              <div>
                <span className="text-stone-500 block">আরবি নাম:</span>
                <span className="font-serif text-stone-900">{application.studentNameAr || "—"}</span>
              </div>
              <div>
                <span className="text-stone-500 block">জন্ম তারিখ:</span>
                <span className="font-mono text-stone-900">
                  {new Date(application.dateOfBirth).toLocaleDateString("bn-BD")}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">লিঙ্গ:</span>
                <span className="font-semibold text-stone-900">
                  {application.gender === "MALE" ? "ছাত্র" : "ছাত্রী"}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">রক্তের গ্রুপ:</span>
                <span className="font-semibold text-stone-900">{application.bloodGroup || "অজানা"}</span>
              </div>
              <div>
                <span className="text-stone-500 block">জন্ম নিবন্ধন নম্বর:</span>
                <span className="font-mono text-stone-900">{application.birthCertificateNo || "—"}</span>
              </div>
              <div>
                <span className="text-stone-500 block">জাতীয় পরিচয়পত্র:</span>
                <span className="font-mono text-stone-900">{application.nidNo || "—"}</span>
              </div>
              <div>
                <span className="text-stone-500 block">জাতীয়তা:</span>
                <span className="text-stone-900">{application.nationality || "বাংলাদেশী"}</span>
              </div>
            </div>
          </div>

          {/* 2. Parents & Guardian Card */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-[#0D5C3A] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-200">
              <Users className="w-4 h-4" />
              ২. পিতামাতা ও অভিভাবক
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-stone-500 block">পিতার নাম:</span>
                <span className="font-semibold text-stone-900">{application.fatherNameBn || "—"}</span>
              </div>
              <div>
                <span className="text-stone-500 block">পিতার ফোন:</span>
                <span className="font-mono text-stone-900">{application.fatherPhone || "—"}</span>
              </div>
              <div>
                <span className="text-stone-500 block">পিতার পেশা:</span>
                <span className="text-stone-900">{application.fatherOccupation || "—"}</span>
              </div>
              <div>
                <span className="text-stone-500 block">মাতার নাম:</span>
                <span className="font-semibold text-stone-900">{application.motherNameBn || "—"}</span>
              </div>
              <div>
                <span className="text-stone-500 block">প্রধান অভিভাবক:</span>
                <span className="font-bold text-stone-900">{application.guardianName} ({application.guardianRelation})</span>
              </div>
              <div>
                <span className="text-stone-500 block">অভিভাবকের মোবাইল:</span>
                <span className="font-mono font-bold text-[#0D5C3A]">{application.guardianPhone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-stone-500 block">অভিভাবকের ইমেইল:</span>
                <span className="font-mono text-stone-900">{application.guardianEmail || "—"}</span>
              </div>
            </div>
          </div>

          {/* 3. Academic Preference & Section Selection */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-[#0D5C3A] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-200">
              <BookOpen className="w-4 h-4" />
              ৩. একাডেমিক পছন্দ ও শাখা নির্ধারণ
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-stone-500 block">শিক্ষাবর্ষ / সেশন:</span>
                <span className="font-semibold text-stone-900">{application.session?.name || "চলতি সেশন"}</span>
              </div>
              <div>
                <span className="text-stone-500 block">আবেদনকৃত জামাত:</span>
                <span className="font-bold text-[#0D5C3A]">{application.desiredClass?.nameBn}</span>
              </div>
              <div>
                <span className="text-stone-500 block">নির্ধারিত শাখা (Section):</span>
                <select
                  disabled={isApproved}
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full mt-1 p-1.5 border border-stone-300 rounded text-xs outline-none focus:border-[#0D5C3A] bg-white font-semibold"
                >
                  <option value="">স্বয়ংক্রিয় / সাধারণ শাখা</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>{sec.nameBn}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-stone-500 block">পূর্ববর্তী শিক্ষা প্রতিষ্ঠান:</span>
                <span className="text-stone-900">{application.previousInstitute || "—"}</span>
              </div>
              <div>
                <span className="text-stone-500 block">পূর্ববর্তী উত্তীর্ণ শ্রেণি:</span>
                <span className="text-stone-900">{application.previousClass || "—"}</span>
              </div>
            </div>
          </div>

          {/* 4. Residential & Welfare */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-[#0D5C3A] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-200">
              <HeartHandshake className="w-4 h-4" />
              ৪. আবাসিক ও কল্যাণমূলক সুবিধা
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-stone-500 block">আবাসিক মর্যাদা:</span>
                <span className="font-bold text-stone-900">
                  {application.desiredResidentialStatus === "RESIDENTIAL"
                    ? "আবাসিক"
                    : application.desiredResidentialStatus === "DAY_CARE"
                    ? "ডে-কেয়ার"
                    : "অনাবাসিক"}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">পিতৃহীন / ইয়াতীম:</span>
                <span className={`font-bold ${application.isOrphan ? "text-amber-700" : "text-stone-700"}`}>
                  {application.isOrphan ? "হ্যাঁ (১০০% ভর্তি ফি মওকুফ)" : "না"}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">আর্থিক অসচ্ছলতা ছাড়ের আবেদন:</span>
                <span className="font-semibold text-stone-900">
                  {application.financialAssistanceRequested ? "হ্যাঁ" : "না"}
                </span>
              </div>
              {application.specialAssistanceDetails && (
                <div className="col-span-3 bg-stone-50 p-2.5 rounded border border-stone-200">
                  <span className="text-stone-500 block font-semibold">আর্থিক ছাড়ের আবেদনের বিবরণ:</span>
                  <p className="text-stone-800 mt-0.5">{application.specialAssistanceDetails}</p>
                </div>
              )}
            </div>
          </div>

          {/* 5. Audit History Trail */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-200">
              <History className="w-4 h-4 text-stone-500" />
              ৫. অডিট ট্রেইল ও কার্যক্রমের ইতিহাস ({auditLogs.length} টি রেকর্ড)
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <div className="text-xs text-stone-400">কোনো অডিট রেকর্ড নেই।</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="text-[11px] p-2 bg-stone-50 rounded border border-stone-100 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[#0D5C3A]">{log.action}</span>
                      <span className="text-stone-600 ml-2 font-mono">
                        {log.detailsJson || (typeof log.details === "string" ? log.details : JSON.stringify(log.details || ""))}
                      </span>
                    </div>
                    <span className="font-mono text-stone-400">
                      {new Date(log.createdAt).toLocaleString("bn-BD")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Workflow Action Cockpit */}
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="border-b border-stone-200 pb-2">
              <h2 className="text-sm font-bold text-stone-900 font-display">
                ভর্তি সিদ্ধান্ত ও ওয়ার্কফ্লো (Action Panel)
              </h2>
              <p className="text-xs text-stone-500">
                বর্তমান ধাপ: <span className="font-bold text-[#0D5C3A]">{application.status}</span>
              </p>
            </div>

            {/* Status Transition Buttons */}
            {!isApproved && !isRejected ? (
              <div className="space-y-2.5">
                {/* 1. Start Review */}
                {application.status === "SUBMITTED" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAction("review", { reviewNotes: "অ্যাডমিন নিরীক্ষা শুরু করেছেন।" })}
                    className="w-full flex items-center justify-center gap-2 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    <Clock className="w-4 h-4" />
                    পর্যালোচনা শুরু করুন (UNDER_REVIEW)
                  </button>
                )}

                {/* 2. Verify Documents */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setModalType("VERIFY")}
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <FileCheck className="w-4 h-4" />
                  কাগজপত্র যাচাই করুন (VERIFICATION)
                </button>

                {/* 3. Schedule Exam / Interview */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setModalType("EXAM")}
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <GraduationCap className="w-4 h-4" />
                  পরীক্ষা / সাক্ষাতকার পরিচালনা
                </button>

                {/* 4. Request Correction */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setModalType("CORRECTION")}
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <AlertTriangle className="w-4 h-4" />
                  সংশোধনের অনুরোধ করুন
                </button>

                {/* 5. APPROVE ADMISSION (CRITICAL TRANSACTION) */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setModalType("APPROVE")}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-[#0D5C3A] hover:bg-[#158052] text-white rounded-lg text-xs font-extrabold transition shadow-md"
                >
                  <Check className="w-4 h-4" />
                  ভর্তি চূড়ান্ত অনুমোদন ও তালিকাভুক্তি
                </button>

                {/* 6. REJECT */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setModalType("REJECT")}
                  className="w-full flex items-center justify-center gap-2 p-2.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
                >
                  <XCircle className="w-4 h-4" />
                  আবেদন বাতিল করুন (Reject)
                </button>
              </div>
            ) : isApproved ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#0D5C3A] mx-auto" />
                <span className="font-bold text-xs text-[#0D5C3A] block">
                  আবেদনটি চূড়ান্তভাবে অনুমোদিত হয়েছে
                </span>
                <p className="text-[11px] text-stone-600">
                  শিক্ষার্থী, অভিভাবক ও রোল নম্বর তৈরি সম্পন্ন। পুনঃঅনুমোদন নিষ্প্রয়োজন।
                </p>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-center space-y-2">
                <XCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <span className="font-bold text-xs text-rose-800 block">
                  আবেদনটি বাতিল করা হয়েছে
                </span>
                <p className="text-[11px] text-rose-700">
                  বাতিলের কারণ: {application.rejectionReason}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: VERIFICATION */}
      {modalType === "VERIFY" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-stone-900 pb-2 border-b">কাগজপত্র ও তথ্য যাচাইকরণ</h3>
            <div>
              <label className="block font-semibold mb-1">যাচাইকরণ ফলাফল:</label>
              <select
                value={verifyStatus}
                onChange={(e) => setVerifyStatus(e.target.value)}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="VERIFIED">সঠিক ও অনুমোদিত (VERIFIED)</option>
                <option value="PENDING">অসম্পূর্ণ / অপেক্ষমাণ (PENDING)</option>
                <option value="REJECTED">ত্রুটিপূর্ণ (REJECTED)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">যাচাইকরণ মন্তব্য / নোট:</label>
              <textarea
                rows={3}
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="যেমন: মূল জন্মসনদ ও প্রত্যয়নপত্র স্বচক্ষে পরিদর্শন করা হয়েছে।"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalType(null)} className="px-4 py-1.5 border rounded">বাতিল</button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction("verify", { verificationStatus: verifyStatus, verificationNotes: verifyNotes })}
                className="px-4 py-1.5 bg-cyan-600 text-white rounded font-bold"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXAM / INTERVIEW */}
      {modalType === "EXAM" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-stone-900 pb-2 border-b">ভর্তি পরীক্ষা / মৌখিক সাক্ষাতকার</h3>
            <div>
              <label className="block font-semibold mb-1">পরীক্ষার নির্ধারিত তারিখ ও সময়:</label>
              <input
                type="datetime-local"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">পরীক্ষার ফলাফল (যদি সম্পন্ন হয়ে থাকে):</label>
              <select
                value={examResult}
                onChange={(e) => setExamResult(e.target.value as any)}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">অপেক্ষমাণ (Pending)</option>
                <option value="PASS">উত্তীর্ণ (PASS)</option>
                <option value="FAIL">অনুত্তীর্ণ (FAIL)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalType(null)} className="px-4 py-1.5 border rounded">বাতিল</button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction("exam-interview", { scheduledAt: examDate || null, result: examResult || null })}
                className="px-4 py-1.5 bg-purple-600 text-white rounded font-bold"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CORRECTION */}
      {modalType === "CORRECTION" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-stone-900 pb-2 border-b">আবেদনে সংশোধনের অনুরোধ</h3>
            <div>
              <label className="block font-semibold mb-1">সংশোধনের সুনির্দিষ্ট বিবরণ / কারণ *:</label>
              <textarea
                rows={3}
                required
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="যেমন: জন্ম নিবন্ধন নম্বর ১৭ ডিজিটের নয় অথবা পিতার ভোটার আইডি সংযুক্ত করুন।"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalType(null)} className="px-4 py-1.5 border rounded">বাতিল</button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction("correction", { correctionReason })}
                className="px-4 py-1.5 bg-amber-600 text-white rounded font-bold"
              >
                অনুরোধ পাঠান
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT */}
      {modalType === "REJECT" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-rose-700 pb-2 border-b">ভর্তি আবেদন বাতিল নিশ্চিতকরণ</h3>
            <div>
              <label className="block font-semibold mb-1">বাতিল করার সুনির্দিষ্ট কারণ *:</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="যেমন: সংশ্লিষ্ট জামাতে আসন পূর্ণ অথবা প্রয়োজনীয় শর্ত পূরণ হয়নি।"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalType(null)} className="px-4 py-1.5 border rounded">ফিরে যান</button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction("reject", { rejectionReason })}
                className="px-4 py-1.5 bg-rose-600 text-white rounded font-bold"
              >
                বাতিল নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: APPROVE (CRITICAL TRANSACTION) */}
      {modalType === "APPROVE" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="pb-2 border-b">
              <h3 className="text-sm font-bold text-[#0D5C3A] font-display">
                ভর্তি চূড়ান্ত অনুমোদন ও ডেটাবেজ ট্রানজ্যাকশন
              </h3>
              <p className="text-[11px] text-stone-500">
                এই কার্যক্রমের মাধ্যমে শিক্ষার্থী প্রোফাইল, অভিভাবক লিংক, রোল নম্বর ও ভর্তি ইনভয়েস তৈরি হবে।
              </p>
            </div>

            <div className="bg-stone-50 p-3 rounded-lg border space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">শিক্ষার্থী:</span>
                <span className="font-bold text-stone-900">{application.studentNameBn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">জামাত:</span>
                <span className="font-bold text-[#0D5C3A]">{application.desiredClass?.nameBn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">প্রাথমিক ভর্তি ফি:</span>
                <span className="font-bold font-mono">
                  {application.isOrphan ? "০ টাকা (১০০% ইয়াতীম ছাড়)" : "১৫০০ টাকা"}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">নির্ধারিত শাখা (Section):</label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">স্বয়ংক্রিয় শাখা</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.nameBn}</option>
                ))}
              </select>
            </div>

            {linkExistingStudentId && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 font-semibold">
                ✓ নির্বাচিত পূর্ববর্তী শিক্ষার্থীর সাথে লিংক করা হবে (নয়া ছাত্র তৈরি হবে না)।
              </div>
            )}

            <div>
              <label className="block font-semibold mb-1">অনুমোদন সংক্রান্ত নোট (ঐচ্ছিক):</label>
              <textarea
                rows={2}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="যেমন: মৌখিক পরীক্ষায় উত্তীর্ণ সাপেক্ষে অনুমোদিত।"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setModalType(null)} className="px-4 py-2 border rounded">বাতিল</button>
              <button
                disabled={actionLoading}
                onClick={() =>
                  handleAction("approve", {
                    assignedSectionId: selectedSectionId || null,
                    linkExistingStudentId: linkExistingStudentId || null,
                    approvalNotes: approvalNotes || null,
                  })
                }
                className="px-5 py-2 bg-[#0D5C3A] hover:bg-[#158052] text-white rounded font-bold shadow disabled:opacity-50"
              >
                {actionLoading ? "অনুমোদন হচ্ছে..." : "চূড়ান্ত অনুমোদন সম্পন্ন করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
