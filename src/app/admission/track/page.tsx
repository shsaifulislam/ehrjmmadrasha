"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Building,
  Calendar,
  FileCheck,
  GraduationCap,
  Printer,
  HelpCircle,
  Phone,
  Shield,
  Send,
  Download,
  QrCode,
  Check,
} from "lucide-react";

interface TimelineStep {
  step: string;
  titleBn: string;
  status: "COMPLETED" | "CURRENT" | "PENDING";
  date: string | null;
  descriptionBn: string;
}

interface ChecklistItem {
  id: string;
  titleBn: string;
  completed: boolean;
  notes?: string;
}

interface DocumentItem {
  id: string;
  titleBn: string;
  status: string;
  rejectionReason?: string;
  url?: string;
}

interface TrackingDetails {
  trackingId: string;
  studentNameBn: string;
  desiredClass: string;
  status: string;
  applicationDate: string;
  phoneMasked: string;
  nidOrBirthMasked: string;
  nextActionInstruction: string;
  correctionRequired: string | null;
  examScheduledAt: string | null;
  timeline: TimelineStep[];
  documents: DocumentItem[];
  feeStatus: {
    admissionFee: number;
    paidAmount: number;
    dueAmount: number;
    paymentStatus: string;
  };
  onboardingChecklist?: ChecklistItem[];
  admissionConfirmationSlip?: {
    studentId: string;
    studentNameBn: string;
    sessionName: string;
    classNameBn: string;
    sectionNameBn: string;
    rollNumber: number;
    admissionDate: string;
    institutionNameBn: string;
    verificationQrCode: string;
  };
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialAppId = searchParams.get("appId") || searchParams.get("trackingId") || "";
  const initialPhone = searchParams.get("phone") || "";

  const [trackingId, setTrackingId] = useState(initialAppId);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Correction Resubmission State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [correctionNote, setCorrectionNote] = useState("");
  const [correctionPhone, setCorrectionPhone] = useState("");
  const [correctedDocUrl, setCorrectedDocUrl] = useState("");
  const [correctionSuccessMsg, setCorrectionSuccessMsg] = useState<string | null>(null);

  const fetchTracking = async (tId: string, pNo?: string) => {
    if (!tId.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const isPhoneOnly = /^01[0-9]{9}$/.test(tId.trim());
      const queryParams = new URLSearchParams();
      if (isPhoneOnly) {
        queryParams.set("phone", tId.trim());
      } else {
        queryParams.set("trackingId", tId.trim());
        if (pNo?.trim()) queryParams.set("phone", pNo.trim());
      }
      queryParams.set("enhanced", "true");

      const res = await fetch(`/api/admissions/track?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok && data.tracking) {
        setResult(data.tracking);
      } else if (res.ok && data.application) {
        // Fallback backward-compatible legacy payload mapping
        setResult({
          trackingId: data.application.trackingId,
          studentNameBn: data.application.studentNameBn,
          desiredClass: data.application.desiredClass,
          status: data.application.status,
          applicationDate: data.application.applicationDate,
          phoneMasked: "০১XXXXXXXXX",
          nidOrBirthMasked: "XXXXXXXXXXXX",
          nextActionInstruction: data.application.nextActionInstruction,
          correctionRequired: data.application.correctionRequired,
          examScheduledAt: data.application.examScheduledAt,
          timeline: [],
          documents: [],
          feeStatus: { admissionFee: 0, paidAmount: 0, dueAmount: 0, paymentStatus: "PENDING" },
        });
      } else {
        setErrorMsg(data.error || "প্রদত্ত তথ্যের সাথে কোনো ভর্তি আবেদন খুঁজে পাওয়া যায়নি।");
      }
    } catch {
      setErrorMsg("সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। পুনরায় চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialAppId) {
      fetchTracking(initialAppId, initialPhone);
    }
  }, [initialAppId, initialPhone]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(trackingId, phone);
  };

  // Submit Correction Resubmission
  const handleResubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;
    setResubmitting(true);
    setErrorMsg(null);
    setCorrectionSuccessMsg(null);

    try {
      const res = await fetch("/api/admissions/resubmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: result.trackingId,
          guardianPhone: correctionPhone || phone,
          applicantNotes: correctionNote,
          correctedDocuments: correctedDocUrl ? [{ type: "RESUBMITTED_DOC", url: correctedDocUrl }] : [],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCorrectionSuccessMsg("সংশোধিত তথ্য সফলভাবে জমা হয়েছে। আবেদনটি পুনরায় রিভিউ করা হবে।");
        setShowCorrectionModal(false);
        fetchTracking(result.trackingId, correctionPhone || phone);
      } else {
        setErrorMsg(data.error || "সংশোধন জমাদানে সমস্যা হয়েছে।");
      }
    } catch {
      setErrorMsg("সার্ভার সংযোগ ত্রুটি।");
    } finally {
      setResubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return { label: "অনুমোদিত (Approved)", bg: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle2 };
      case "REJECTED":
        return { label: "অননুমোদিত (Rejected)", bg: "bg-rose-100 text-rose-800 border-rose-300", icon: XCircle };
      case "CORRECTION_REQUESTED":
        return { label: "সংশোধন প্রয়োজন (Action Required)", bg: "bg-amber-100 text-amber-800 border-amber-300", icon: AlertTriangle };
      case "EXAM_INTERVIEW":
        return { label: "পরীক্ষা / সাক্ষাতকার", bg: "bg-purple-100 text-purple-800 border-purple-300", icon: GraduationCap };
      case "VERIFICATION":
        return { label: "কাগজপত্র যাচাইকরণ", bg: "bg-cyan-100 text-cyan-800 border-cyan-300", icon: FileCheck };
      case "UNDER_REVIEW":
        return { label: "পর্যালোচনাধীন", bg: "bg-blue-100 text-blue-800 border-blue-300", icon: Clock };
      default:
        return { label: "আবেদন গৃহীত (Submitted)", bg: "bg-stone-100 text-stone-800 border-stone-300", icon: Clock };
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <Link
            href="/admission"
            className="text-xs font-semibold text-[#0D5C3A] hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            ভর্তি বিজ্ঞপ্তিতে ফিরুন
          </Link>
          <span className="text-xs text-stone-500 font-medium">ডিজিটাল ট্র্যাকিং ও অনবোর্ডিং পোর্টাল</span>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-emerald-50 text-[#0D5C3A] mb-1">
            <Building className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-display">
            ভর্তি আবেদন ট্র্যাকিং ও অনবোর্ডিং
          </h1>
          <p className="text-xs text-stone-600 max-w-md mx-auto">
            নিরাপদ ট্র্যাকিংয়ের জন্য আপনার ট্র্যাকিং নম্বর (EHRJ-ADM-YYYY-XXXX) এবং আবেদনে ব্যবহৃত মোবাইল নম্বর প্রবেশ করান।
          </p>

          <form onSubmit={handleTrackSubmit} className="max-w-xl mx-auto pt-3 grid grid-cols-1 sm:grid-cols-5 gap-2">
            <input
              type="text"
              required
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="ট্র্যাকিং আইডি (EHRJ-ADM-YYYY-XXXX)..."
              className="sm:col-span-3 p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A] bg-stone-50 font-mono"
            />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="মোবাইল (ঐচ্ছিক নিরাপত্তা)..."
              className="sm:col-span-2 p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A] bg-stone-50 font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="sm:col-span-5 bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50 mt-1"
            >
              <Search className="w-4 h-4" />
              {loading ? "অনুসন্ধান হচ্ছে..." : "আবেদনের অবস্থা জানুন"}
            </button>
          </form>

          {errorMsg && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {correctionSuccessMsg && (
            <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{correctionSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* TRACKING DETAILS */}
        {result && (
          <div className="space-y-6">
            {/* Header Status Bar */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-6 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-stone-500 uppercase block tracking-wider">
                    আবেদন ট্র্যাকিং নম্বর
                  </span>
                  <span className="font-mono text-xl font-bold text-[#0D5C3A]">
                    {result.trackingId}
                  </span>
                </div>

                <div>
                  {(() => {
                    const badge = getStatusBadge(result.status);
                    const Icon = badge.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                        <Icon className="w-4 h-4" />
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Masked Info & Dates */}
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-stone-100">
                <div>
                  <span className="text-stone-500 font-medium block">শিক্ষার্থীর নাম</span>
                  <span className="font-bold text-stone-900 block mt-0.5">{result.studentNameBn}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-medium block">আবেদনকৃত জামাত</span>
                  <span className="font-semibold text-stone-900 block mt-0.5">{result.desiredClass}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-medium block">আবেদনের তারিখ</span>
                  <span className="font-mono text-stone-800 block mt-0.5">{result.applicationDate}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-medium block">নিবন্ধিত অভিভাবক নম্বর</span>
                  <span className="font-mono text-stone-800 block mt-0.5">{result.phoneMasked}</span>
                </div>
              </div>

              {/* Instructions Banner */}
              <div className="p-6 space-y-3">
                <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-[#0D5C3A] flex items-center gap-1.5 uppercase tracking-wide">
                    <HelpCircle className="w-4 h-4" />
                    পরবর্তী করণীয় ও মাদরাসার নির্দেশনা:
                  </span>
                  <p className="text-xs text-stone-800 leading-relaxed font-medium">
                    {result.nextActionInstruction}
                  </p>

                  {result.correctionRequired && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-amber-900 block">
                        ⚠️ জরুরি সংশোধন প্রয়োজন: {result.correctionRequired}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCorrectionModal(true)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        অনলাইনে সংশোধিত তথ্য বা ফাইল জমা দিন
                      </button>
                    </div>
                  )}

                  {result.examScheduledAt && (
                    <div className="mt-2 p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-700" />
                      <span>
                        পরীক্ষা / সাক্ষাতকারের নির্ধারিত সময়:{" "}
                        <strong>{new Date(result.examScheduledAt).toLocaleString("bn-BD")}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline Progress */}
            {result.timeline && result.timeline.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-stone-900 font-display">আবেদনের পর্যায়ক্রমিক অগ্রগতি (Timeline)</h3>
                <div className="space-y-3">
                  {result.timeline.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                          step.status === "COMPLETED"
                            ? "bg-[#0D5C3A] text-white"
                            : step.status === "CURRENT"
                            ? "bg-amber-400 text-stone-900"
                            : "bg-stone-200 text-stone-500"
                        }`}
                      >
                        {step.status === "COMPLETED" ? "✓" : idx + 1}
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900">{step.titleBn}</span>
                          {step.date && <span className="text-stone-400 font-mono text-[11px]">{step.date}</span>}
                        </div>
                        <span className="text-stone-500 block leading-tight">{step.descriptionBn}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Post-Enrollment Onboarding Checklist */}
            {result.status === "APPROVED" && result.onboardingChecklist && (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-[#0D5C3A]" />
                  <h3 className="text-sm font-bold font-display">তালিকাভুক্তি ও একাডেমিক অনবোর্ডিং চেকলিস্ট</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.onboardingChecklist.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                        item.completed ? "bg-emerald-50/50 border-emerald-200 text-emerald-900" : "bg-stone-50 border-stone-200 text-stone-600"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        item.completed ? "bg-[#0D5C3A] text-white" : "bg-stone-300 text-stone-600"
                      }`}>
                        {item.completed ? "✓" : "•"}
                      </span>
                      <span className="font-medium">{item.titleBn}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Printable Digital Admission Slip (If Approved) */}
            {result.status === "APPROVED" && result.admissionConfirmationSlip && (
              <div className="bg-white rounded-2xl border-2 border-[#0D5C3A] p-6 shadow-md space-y-4 print:p-8 print:m-0 print:border-black">
                <div className="text-center pb-4 border-b border-stone-200 space-y-1">
                  <h2 className="text-base font-black text-[#0D5C3A] font-display">
                    {result.admissionConfirmationSlip.institutionNameBn}
                  </h2>
                  <span className="text-xs font-bold text-stone-800 uppercase block tracking-wider">
                    ডিজিটাল ভর্তি নিশ্চিতকরণ সনদ ও রসিদ (Admission Confirmation)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-stone-500 font-medium block">শিক্ষার্থীর আইডি (Student ID):</span>
                    <span className="font-mono font-bold text-base text-[#0D5C3A]">
                      {result.admissionConfirmationSlip.studentId}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-medium block">শিক্ষার্থীর নাম:</span>
                    <span className="font-bold text-stone-900">{result.admissionConfirmationSlip.studentNameBn}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-medium block">শিক্ষাবর্ষ:</span>
                    <span className="font-semibold text-stone-800">{result.admissionConfirmationSlip.sessionName}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-medium block">ভর্তিযোগ্য জামাত ও শাখা:</span>
                    <span className="font-semibold text-stone-800">
                      {result.admissionConfirmationSlip.classNameBn} ({result.admissionConfirmationSlip.sectionNameBn})
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-medium block">নির্ধারিত রোল নম্বর:</span>
                    <span className="font-mono font-bold text-stone-900">{result.admissionConfirmationSlip.rollNumber}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-medium block">ভর্তির তারিখ:</span>
                    <span className="font-mono text-stone-800">{result.admissionConfirmationSlip.admissionDate}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-100 no-print">
                  <span className="text-[11px] text-stone-400 font-mono">
                    QR ভেরিফিকেশন: {result.admissionConfirmationSlip.verificationQrCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    সনদ প্রিন্ট / ডাউনলোড করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Resubmission Modal */}
      {showCorrectionModal && result && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 font-display">সংশোধিত তথ্য জমাদান</h3>
            <p className="text-xs text-stone-600">
              কর্তৃপক্ষের অনুরোধ: <strong>{result.correctionRequired}</strong>
            </p>

            <form onSubmit={handleResubmitCorrection} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">অভিভাবকের মোবাইল নম্বর (নিরাপত্তা যাচাই) *</label>
                <input
                  type="text"
                  required
                  value={correctionPhone}
                  onChange={(e) => setCorrectionPhone(e.target.value)}
                  placeholder="০১XXXXXXXXX"
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">সংশোধনের বিবরণ বা বক্তব্য *</label>
                <textarea
                  rows={3}
                  required
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  placeholder="অনুরোধকৃত তথ্যের বিবরণ বা ব্যাখ্যা..."
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">নতুন ডকুমেন্ট URL (যদি প্রযোজ্য হয়)</label>
                <input
                  type="text"
                  value={correctedDocUrl}
                  onChange={(e) => setCorrectedDocUrl(e.target.value)}
                  placeholder="https://.../updated-doc.pdf"
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-stone-600 text-xs font-semibold hover:bg-stone-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={resubmitting}
                  className="px-5 py-2 rounded-lg bg-[#0D5C3A] text-white text-xs font-bold hover:bg-[#158052] disabled:opacity-50"
                >
                  {resubmitting ? "জমা হচ্ছে..." : "সংশোধন জমা দিন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs text-stone-500 font-sans">
          ট্র্যাকিং পোর্টাল লোড হচ্ছে...
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
