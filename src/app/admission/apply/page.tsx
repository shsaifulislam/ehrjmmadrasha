"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  User,
  Users,
  Home,
  BookOpen,
  HeartHandshake,
  Paperclip,
  Check,
  ShieldAlert,
  Search,
  Save,
  RotateCcw,
  Sparkles,
  Calculator,
  HelpCircle,
  Clock,
  Printer,
} from "lucide-react";

interface JamatClass {
  id: string;
  nameBn: string;
  nameEn: string;
  code: string;
  sections?: { id: string; nameBn: string }[];
}

interface AcademicSession {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface FeeBreakdown {
  classId: string;
  admissionFee: number;
  sessionFee: number;
  monthlyTuition: number;
  residentialFee: number;
  totalPayableAtAdmission: number;
  potentialAssistancePercentage: number;
  netPayableAfterAssistance: number;
  assistanceReason: string | null;
}

function ApplicationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialClassId = searchParams.get("classId") || "";

  const [currentStep, setCurrentStep] = useState(1);
  const [classes, setClasses] = useState<JamatClass[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  // Resume Draft Modal State
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeTokenInput, setResumeTokenInput] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);

  // Fee calculation state
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
  const [loadingFee, setLoadingFee] = useState(false);

  // Submission token for idempotency
  const [submissionToken] = useState(() => `SUB-TOKEN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  // Success result
  const [successData, setSuccessData] = useState<{
    applicationNumber: string;
    message: string;
    duplicateMatches?: any[];
  } | null>(null);

  // Main Form Data State
  const [formData, setFormData] = useState({
    // Step 1: Session & Class
    sessionId: "",
    desiredClassId: initialClassId,
    desiredSectionId: "",

    // Step 2: Student Information
    studentNameBn: "",
    studentNameEn: "",
    studentNameAr: "",
    dateOfBirth: "",
    gender: "MALE",
    bloodGroup: "",
    birthCertificateNo: "",
    nidNo: "",
    nationality: "বাংলাদেশী",

    // Step 3: Parents & Guardian Information
    fatherNameBn: "",
    fatherPhone: "",
    fatherOccupation: "",
    motherNameBn: "",
    motherPhone: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianRelation: "FATHER",
    guardianAddress: "",

    // Step 4: Address
    presentAddress: "",
    permanentAddress: "",

    // Step 5: Academic Background
    previousInstitute: "",
    previousClass: "",

    // Step 6: Residential & Welfare
    desiredResidentialStatus: "NON_RESIDENTIAL",
    isOrphan: false,
    isFinanciallyWeak: false,
    financialAssistanceRequested: false,
    specialAssistanceDetails: "",

    // Step 7: Documents Checklist
    photoUrl: "",
    birthCertDocUrl: "",
    previousCertDocUrl: "",
    guardianNidDocUrl: "",

    // Step 9: Declaration
    declarationConfirmed: false,
  });

  // Load classes & sessions
  useEffect(() => {
    Promise.all([
      fetch("/api/academic/classes").then((res) => res.json()).catch(() => ({ classes: [] })),
      fetch("/api/academic/sessions").then((res) => res.json()).catch(() => ({ sessions: [] })),
    ]).then(([classData, sessionData]) => {
      if (classData.classes && classData.classes.length > 0) {
        setClasses(classData.classes);
        if (!initialClassId) {
          setFormData((prev) => ({ ...prev, desiredClassId: classData.classes[0].id }));
        }
      }
      if (sessionData.sessions && sessionData.sessions.length > 0) {
        setSessions(sessionData.sessions);
        const current = sessionData.sessions.find((s: any) => s.isCurrent) || sessionData.sessions[0];
        if (current) {
          setFormData((prev) => ({ ...prev, sessionId: current.id }));
        }
      }
      setLoadingInitial(false);
    });
  }, [initialClassId]);

  // Dynamically calculate fee breakdown when class or residential status changes
  useEffect(() => {
    if (!formData.desiredClassId) return;

    setLoadingFee(true);
    const query = new URLSearchParams({
      classId: formData.desiredClassId,
      sessionId: formData.sessionId,
      residentialStatus: formData.desiredResidentialStatus,
      isOrphan: String(formData.isOrphan),
      isFinanciallyWeak: String(formData.isFinanciallyWeak),
      financialAssistanceRequested: String(formData.financialAssistanceRequested),
    });

    fetch(`/api/admissions/fees?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.feeBreakdown) {
          setFeeBreakdown(data.feeBreakdown);
        }
      })
      .catch((err) => console.error("Fee calculation error:", err))
      .finally(() => setLoadingFee(false));
  }, [
    formData.desiredClassId,
    formData.sessionId,
    formData.desiredResidentialStatus,
    formData.isOrphan,
    formData.isFinanciallyWeak,
    formData.financialAssistanceRequested,
  ]);

  // Save as Draft
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setDraftNotice(null);
    setError(null);

    try {
      const res = await fetch("/api/admissions/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStep,
          formData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setDraftNotice(`খসড়া সংরক্ষিত হয়েছে (${data.progressPercentage}% সম্পন্ন)। রিজিউম টোকেন: ${data.resumeToken}`);
      } else {
        setError(data.error || "ড্রাফট সংরক্ষণে ত্রুটি হয়েছে।");
      }
    } catch {
      setError("সার্ভার সংযোগে সমস্যা হয়েছে। ড্রাফট সংরক্ষণ করা যায়নি।");
    } finally {
      setSavingDraft(false);
    }
  };

  // Resume Draft
  const handleResumeDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeTokenInput.trim()) return;

    setResumeLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admissions/draft?token=${encodeURIComponent(resumeTokenInput.trim())}`);
      const data = await res.json();
      if (res.ok && data.draft) {
        setFormData((prev) => ({
          ...prev,
          ...data.draft.formData,
        }));
        setCurrentStep(data.draft.currentStep || 1);
        setShowResumeModal(false);
        setDraftNotice("পূর্বের সংরক্ষিত ড্রাফট সফলভাবে রিস্টোর করা হয়েছে।");
      } else {
        setError(data.error || "প্রদত্ত টোকেনে কোনো ড্রাফট পাওয়া যায়নি।");
      }
    } catch {
      setError("ড্রাফট পুনরুদ্ধারে সমস্যা হয়েছে।");
    } finally {
      setResumeLoading(false);
    }
  };

  // Submit Final Application
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.declarationConfirmed) {
      setError("আবেদন জমা দিতে অবশ্যই ঘোষণাপত্রে সম্মতি দিন।");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const documentsList = [
        ...(formData.photoUrl ? [{ type: "STUDENT_PHOTO", url: formData.photoUrl }] : []),
        ...(formData.birthCertDocUrl ? [{ type: "BIRTH_CERTIFICATE", url: formData.birthCertDocUrl }] : []),
        ...(formData.guardianNidDocUrl ? [{ type: "GUARDIAN_NID", url: formData.guardianNidDocUrl }] : []),
        ...(formData.previousCertDocUrl ? [{ type: "PREVIOUS_MARKSHEET", url: formData.previousCertDocUrl }] : []),
      ];

      const res = await fetch("/api/admissions/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          documents: documentsList,
          submissionToken,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessData({
          applicationNumber: data.applicationNumber,
          message: data.message,
          duplicateMatches: data.duplicateMatches,
        });
      } else {
        setError(data.error || "আবেদন জমাদানে ত্রুটি হয়েছে।");
      }
    } catch {
      setError("সার্ভার ত্রুটি। আবেদনটি জমা দেওয়া যায়নি।");
    } finally {
      setSubmitting(false);
    }
  };

  // Steps definition
  const steps = [
    { id: 1, title: "সেশন ও জামাত" },
    { id: 2, title: "শিক্ষার্থীর তথ্য" },
    { id: 3, title: "অভিভাবকের তথ্য" },
    { id: 4, title: "ঠিকানা" },
    { id: 5, title: "পূর্বতন প্রতিষ্ঠান" },
    { id: 6, title: "আবাসিক ও সহায়তা" },
    { id: 7, title: "কাগজপত্র" },
    { id: 8, title: "ফি বিবরণী" },
    { id: 9, title: "ঘোষণাপত্র ও জমাদান" },
  ];

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs text-stone-500 font-sans">
        ভর্তি ফরম লোড হচ্ছে...
      </div>
    );
  }

  // Success Confirmation Screen
  if (successData) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-16 flex-1 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0D5C3A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#0D5C3A] uppercase tracking-wider">
              ভর্তি আবেদন সফলভাবে সম্পন্ন
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-display">
              আলহামদুলিল্লাহ! আপনার আবেদন গৃহীত হয়েছে
            </h1>
            <p className="text-xs text-stone-600 max-w-md mx-auto">
              ভর্তি আবেদনটি মাদরাসার সিস্টেমে সংরক্ষিত হয়েছে। নিচের ট্র্যাকিং আইডিটি সংরক্ষণ করুন।
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm max-w-md mx-auto space-y-3">
            <span className="text-xs text-stone-500 font-semibold block">আবেদন ট্র্যাকিং নম্বর</span>
            <span className="text-2xl font-black font-mono text-[#0D5C3A] block">
              {successData.applicationNumber}
            </span>
            <p className="text-[11px] text-stone-500">
              অভিভাবকের মোবাইল নম্বর ও এই ট্র্যাকিং নম্বর ব্যবহার করে যে কোনো সময় আবেদনের সর্বশেষ অবস্থা জানতে পারবেন।
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={`/admission/track?trackingId=${successData.applicationNumber}`}
              className="px-6 py-3 rounded-xl bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs font-bold shadow transition"
            >
              আবেদন ট্র্যাক করুন
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-6 py-3 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              প্রিন্ট রসিদ
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <Link
              href="/admission"
              className="text-xs font-semibold text-[#0D5C3A] hover:underline flex items-center gap-1 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              ভর্তি বিজ্ঞপ্তিতে ফিরুন
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-display">
              অনলাইন ভর্তি আবেদন ফরম (২০২৬)
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowResumeModal(true)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
              ড্রাফট রিস্টোর
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Save className="w-3.5 h-3.5" />
              {savingDraft ? "সংরক্ষণ হচ্ছে..." : "ড্রাফট সেভ করুন"}
            </button>
          </div>
        </div>

        {/* Notices */}
        {draftNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center justify-between">
            <span>{draftNotice}</span>
            <button onClick={() => setDraftNotice(null)} className="text-emerald-600 font-mono text-sm">×</button>
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stepper Progress Bar */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[650px] gap-2">
            {steps.map((s) => {
              const isDone = currentStep > s.id;
              const isCurrent = currentStep === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => s.id < currentStep && setCurrentStep(s.id)}
                  className={`flex-1 flex flex-col items-center cursor-pointer select-none ${
                    s.id < currentStep ? "hover:opacity-80" : ""
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? "bg-[#0D5C3A] text-white"
                        : isCurrent
                        ? "bg-[#0D5C3A] text-white ring-4 ring-emerald-100"
                        : "bg-stone-100 text-stone-400 border border-stone-200"
                    }`}
                  >
                    {isDone ? "✓" : s.id}
                  </div>
                  <span
                    className={`text-[11px] mt-1 font-medium whitespace-nowrap ${
                      isCurrent ? "font-bold text-[#0D5C3A]" : "text-stone-500"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content Container */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm">
          {/* STEP 1: SESSION & CLASS */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-lg font-bold text-stone-900 font-display">১. শিক্ষাবর্ষ ও জামাত নির্বাচন</h2>
                <p className="text-xs text-stone-500">যে শ্রেণিতে শিক্ষার্থী ভর্তি হতে ইচ্ছুক তা নির্বাচন করুন।</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">শিক্ষাবর্ষ (Session) *</label>
                  <select
                    value={formData.sessionId}
                    onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs bg-stone-50 outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isCurrent ? "(চলতি সেশন)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">আবেদনকৃত জামাত / শ্রেণি *</label>
                  <select
                    value={formData.desiredClassId}
                    onChange={(e) => setFormData({ ...formData, desiredClassId: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs bg-stone-50 outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn} ({c.nameEn})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: STUDENT INFORMATION */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-lg font-bold text-stone-900 font-display">২. শিক্ষার্থীর ব্যক্তিগত তথ্য</h2>
                <p className="text-xs text-stone-500">জন্মনিবন্ধন সনদ অনুযায়ী সঠিক তথ্য প্রদান করুন।</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-stone-700">শিক্ষার্থীর পূর্ণ নাম (বাংলায়) *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentNameBn}
                    onChange={(e) => setFormData({ ...formData, studentNameBn: e.target.value })}
                    placeholder="উদা: আব্দুল্লাহ আল মাহাদী"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">নাম (ইংরেজিতে)</label>
                  <input
                    type="text"
                    value={formData.studentNameEn}
                    onChange={(e) => setFormData({ ...formData, studentNameEn: e.target.value })}
                    placeholder="উদা: Abdullah Al Mahadi"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">জন্ম তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">লিঙ্গ *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs bg-stone-50 outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  >
                    <option value="MALE">ছাত্র (পুরুষ)</option>
                    <option value="FEMALE">ছাত্রী (মহিলা)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">রক্তের গ্রুপ</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs bg-stone-50 outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  >
                    <option value="">নির্বাচন করুন</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-stone-700">জন্মনিবন্ধন সনদ নম্বর (১৭ ডিজিট)</label>
                  <input
                    type="text"
                    maxLength={17}
                    value={formData.birthCertificateNo}
                    onChange={(e) => setFormData({ ...formData, birthCertificateNo: e.target.value })}
                    placeholder="১৭ ডিজিটের ডিজিটাল জন্মনিবন্ধন নম্বর"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">জাতীয়তা</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PARENTS & GUARDIAN */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-lg font-bold text-stone-900 font-display">৩. পিতামাতা ও অভিভাবকের তথ্য</h2>
                <p className="text-xs text-stone-500">প্রয়োজনে যোগাযোগের জন্য সচল মোবাইল নম্বর দিন।</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">পিতার নাম (বাংলায়) *</label>
                  <input
                    type="text"
                    required
                    value={formData.fatherNameBn}
                    onChange={(e) => setFormData({ ...formData, fatherNameBn: e.target.value })}
                    placeholder="পিতার পূর্ণ নাম"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">পিতার মোবাইল নম্বর</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={formData.fatherPhone}
                    onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                    placeholder="০১XXXXXXXXX"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">মাতার নাম (বাংলায়)</label>
                  <input
                    type="text"
                    value={formData.motherNameBn}
                    onChange={(e) => setFormData({ ...formData, motherNameBn: e.target.value })}
                    placeholder="মাতার পূর্ণ নাম"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">মাতার মোবাইল নম্বর</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={formData.motherPhone}
                    onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                    placeholder="০১XXXXXXXXX"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">মূল অভিভাবকের নাম *</label>
                  <input
                    type="text"
                    required
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    placeholder="অভিভাবকের নাম"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">অভিভাবকের মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={formData.guardianPhone}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    placeholder="০১XXXXXXXXX"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">সম্পর্ক *</label>
                  <select
                    value={formData.guardianRelation}
                    onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs bg-stone-50 outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  >
                    <option value="FATHER">পিতা</option>
                    <option value="MOTHER">মাতা</option>
                    <option value="BROTHER">ভাই</option>
                    <option value="UNCLE">চাচা / মামা</option>
                    <option value="LEGAL_GUARDIAN">আইনগত অভিভাবক</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">অভিভাবকের ইমেইল (ঐচ্ছিক)</label>
                  <input
                    type="email"
                    value={formData.guardianEmail}
                    onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                    placeholder="example@mail.com"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ADDRESS */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-lg font-bold text-stone-900 font-display">৪. ঠিকানা ও যোগাযোগ</h2>
                <p className="text-xs text-stone-500">গ্রাম, ডাকঘর, উপজেলা ও জেলার বিবরণ দিন।</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">বর্তমান ঠিকানা *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.presentAddress}
                    onChange={(e) => setFormData({ ...formData, presentAddress: e.target.value })}
                    placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা..."
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">স্থায়ী ঠিকানা *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.permanentAddress}
                    onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                    placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা..."
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: ACADEMIC BACKGROUND */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-lg font-bold text-stone-900 font-display">৫. পূর্বতন প্রাতিষ্ঠানিক তথ্য</h2>
                <p className="text-xs text-stone-500">পূর্বে অধ্যয়নরত মাদরাসা বা বিদ্যালয়ের বিবরণ (যদি থাকে)।</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">পূর্ববর্তী প্রতিষ্ঠানের নাম</label>
                  <input
                    type="text"
                    value={formData.previousInstitute}
                    onChange={(e) => setFormData({ ...formData, previousInstitute: e.target.value })}
                    placeholder="মাদরাসা বা স্কুলের নাম"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">সর্বশেষ উত্তীর্ণ জামাত / শ্রেণি</label>
                  <input
                    type="text"
                    value={formData.previousClass}
                    onChange={(e) => setFormData({ ...formData, previousClass: e.target.value })}
                    placeholder="যেমন: নূরানী ৩য় জামাত বা ৫ম শ্রেণি"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: RESIDENTIAL & WELFARE */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-lg font-bold text-stone-900 font-display">৬. আবাসিক ও কল্যাণমূলক তথ্য</h2>
                <p className="text-xs text-stone-500">বোর্ডিং এবং আর্থিক সহায়তা সংক্রান্ত তথ্যাদি।</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">আবাসিক অবস্থা নির্বাচন করুন *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "NON_RESIDENTIAL", label: "অনাবাসিক (Non-Residential)" },
                      { id: "RESIDENTIAL", label: "আবাসিক (Full Residential)" },
                      { id: "DAY_CARE", label: "ডে-কেয়ার (Day Care)" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, desiredResidentialStatus: opt.id })}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                          formData.desiredResidentialStatus === opt.id
                            ? "bg-emerald-50 border-[#0D5C3A] text-[#0D5C3A]"
                            : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Welfare / Assistance Flags */}
                <div className="pt-2 border-t border-stone-100 space-y-3">
                  <label className="text-xs font-bold text-stone-700 block">বিশেষ বিবেচনা ও সহায়তা আবেদন</label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isOrphan}
                        onChange={(e) => setFormData({ ...formData, isOrphan: e.target.checked })}
                        className="rounded text-[#0D5C3A] focus:ring-[#0D5C3A]"
                      />
                      <span className="text-xs font-medium text-stone-800">শিক্ষার্থী পিতৃহীন / এতিম (Orphan)</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFinanciallyWeak}
                        onChange={(e) => setFormData({ ...formData, isFinanciallyWeak: e.target.checked })}
                        className="rounded text-[#0D5C3A] focus:ring-[#0D5C3A]"
                      />
                      <span className="text-xs font-medium text-stone-800">আর্থিকভাবে অসচ্ছল পরিবার</span>
                    </label>
                  </div>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-amber-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.financialAssistanceRequested}
                      onChange={(e) => setFormData({ ...formData, financialAssistanceRequested: e.target.checked })}
                      className="rounded text-[#0D5C3A] focus:ring-[#0D5C3A]"
                    />
                    <span className="text-xs font-bold text-amber-900">
                      ভর্তি বা মাসিক বেতনে প্রাতিষ্ঠানিক আর্থিক সহায়তার আবেদন করছি
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: REQUIRED DOCUMENTS */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-lg font-bold text-stone-900 font-display">৭. প্রয়োজনীয় কাগজপত্র আপলোড</h2>
                <p className="text-xs text-stone-500">অনলাইনে আপলোডকৃত ফাইলসমূহ জেপিজি, পিএনজি বা পিডিএফ হতে হবে (সর্বোচ্চ ৫ মেগাবাইট)।</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                  <span className="text-xs font-bold text-stone-800 block">শিক্ষার্থীর সদ্যতোলা পাসপোর্ট ছবি URL (বা ক্লাউড লিংক)</span>
                  <input
                    type="text"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="https://.../photo.jpg"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                  <span className="text-xs font-bold text-stone-800 block">ডিজিটাল জন্মনিবন্ধন সনদ স্ক্যান কপি URL</span>
                  <input
                    type="text"
                    value={formData.birthCertDocUrl}
                    onChange={(e) => setFormData({ ...formData, birthCertDocUrl: e.target.value })}
                    placeholder="https://.../birth-cert.pdf"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                  <span className="text-xs font-bold text-stone-800 block">অভিভাবকের জাতীয় পরিচয়পত্র (NID) কপি URL</span>
                  <input
                    type="text"
                    value={formData.guardianNidDocUrl}
                    onChange={(e) => setFormData({ ...formData, guardianNidDocUrl: e.target.value })}
                    placeholder="https://.../guardian-nid.pdf"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: FEE BREAKDOWN */}
          {currentStep === 8 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-lg font-bold text-stone-900 font-display">৮. প্রাতিষ্ঠানিক ফি বিবরণী ও আর্থিক হিসাব</h2>
                <p className="text-xs text-stone-500">অনুমোদিত ফি কাঠামো এবং আর্থিক সহায়তার সম্ভাব্য হিসাব।</p>
              </div>

              {loadingFee ? (
                <div className="p-8 text-center text-xs text-stone-500 animate-pulse">
                  ফি বিবরণী হিসাব করা হচ্ছে...
                </div>
              ) : feeBreakdown ? (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-4">
                  <div className="divide-y divide-stone-200 text-xs">
                    <div className="py-2 flex justify-between">
                      <span className="text-stone-600">ভর্তি ফি (এককালীন):</span>
                      <span className="font-mono font-bold text-stone-900">{feeBreakdown.admissionFee} ৳</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-stone-600">সেশন ফি:</span>
                      <span className="font-mono font-bold text-stone-900">{feeBreakdown.sessionFee} ৳</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-stone-600">প্রথম মাসের বেতন:</span>
                      <span className="font-mono font-bold text-stone-900">{feeBreakdown.monthlyTuition} ৳</span>
                    </div>
                    {feeBreakdown.residentialFee > 0 && (
                      <div className="py-2 flex justify-between">
                        <span className="text-stone-600">আবাসিক / বোর্ডিং ফি:</span>
                        <span className="font-mono font-bold text-stone-900">{feeBreakdown.residentialFee} ৳</span>
                      </div>
                    )}
                    <div className="py-2.5 flex justify-between font-bold text-stone-900 bg-stone-100/60 px-2 rounded">
                      <span>মোট প্রদেয় ফি (প্রাথমিক):</span>
                      <span className="font-mono text-sm">{feeBreakdown.totalPayableAtAdmission} ৳</span>
                    </div>
                  </div>

                  {feeBreakdown.potentialAssistancePercentage > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-amber-900 block">
                        সম্ভাব্য আর্থিক সহায়তার প্রস্তাব: {feeBreakdown.potentialAssistancePercentage}% ছাড়
                      </span>
                      <p className="text-amber-800 leading-tight">
                        {feeBreakdown.assistanceReason}। চূড়ান্ত অনুমোদন মাদরাসা কর্তৃপক্ষের নিরীক্ষার পর কার্যকর হবে।
                      </p>
                      <div className="pt-1 font-bold text-stone-900">
                        সহায়তা পরবর্তী প্রদেয়: <span className="font-mono">{feeBreakdown.netPayableAfterAssistance} ৳</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-stone-500">ফি বিবরণী লোড করা সম্ভব হয়নি।</div>
              )}
            </div>
          )}

          {/* STEP 9: DECLARATION & SUBMIT */}
          {currentStep === 9 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-lg font-bold text-stone-900 font-display">৯. ঘোষণাপত্র ও চূড়ান্ত আবেদন জমাদান</h2>
                <p className="text-xs text-stone-500">আবেদন জমাদানের পূর্বে তথ্যাবলীর সঠিকতা নিশ্চিত করুন।</p>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3 text-xs">
                <h3 className="font-bold text-[#0D5C3A]">অভিভাবকের প্রতিশ্রুতি ও অঙ্গীকারনামা</h3>
                <p className="text-stone-700 leading-relaxed">
                  আমি সজ্ঞানে ঘোষণা করছি যে, এই ভর্তি আবেদনপত্রে প্রদত্ত সকল তথ্য ও কাগজপত্র সম্পূর্ণ সত্য এবং নির্ভুল।
                  ভবিষ্যতে কোনো তথ্য মিথ্যা বা অসত্য প্রমাণিত হলে মাদরাসা কর্তৃপক্ষের যে কোনো সিদ্ধান্ত আমি বিনা বাক্য ব্যয়ে
                  মেনে নিতে বাধ্য থাকিব। মাদরাসার যাবতীয় নিয়ম-শৃঙ্খলা মেনে আমার সন্তান/পোষ্যকে পরিচালনা করিব।
                </p>

                <label className="flex items-center gap-2 pt-2 border-t border-emerald-200/60 cursor-pointer font-bold text-stone-900">
                  <input
                    type="checkbox"
                    checked={formData.declarationConfirmed}
                    onChange={(e) => setFormData({ ...formData, declarationConfirmed: e.target.checked })}
                    className="rounded text-[#0D5C3A] focus:ring-[#0D5C3A]"
                  />
                  <span>আমি অঙ্গীকারনামাটি পাঠ করেছি এবং এতে পূর্ণ সম্মতি প্রদান করছি।</span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-stone-100 mt-6">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                পূর্ববর্তী ধাপ
              </button>
            ) : <div />}

            {currentStep < 9 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2.5 rounded-xl bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                পরবর্তী ধাপ
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || !formData.declarationConfirmed}
                onClick={handleSubmit}
                className="px-7 py-3 rounded-xl bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs font-bold flex items-center gap-2 shadow-lg transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? "আবেদন জমা হচ্ছে..." : "চূড়ান্ত আবেদন জমা দিন"}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Resume Draft Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 font-display">সংরক্ষিত ড্রাফট আবেদন পুনরুদ্ধার</h3>
            <p className="text-xs text-stone-600">
              ড্রাফট সংরক্ষণের সময় প্রাপ্ত রিজিউম টোকেন (Resume Token) বা অভিভাবকের মোবাইল নম্বর দিন।
            </p>

            <form onSubmit={handleResumeDraft} className="space-y-3">
              <input
                type="text"
                required
                value={resumeTokenInput}
                onChange={(e) => setResumeTokenInput(e.target.value)}
                placeholder="রিজিউম টোকেন অথবা মোবাইল নম্বর..."
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-[#0D5C3A]"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResumeModal(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-stone-600 text-xs font-semibold hover:bg-stone-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={resumeLoading}
                  className="px-5 py-2 rounded-lg bg-[#0D5C3A] text-white text-xs font-bold hover:bg-[#158052] disabled:opacity-50"
                >
                  {resumeLoading ? "খোঁজা হচ্ছে..." : "রিস্টোর করুন"}
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

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs text-stone-500 font-sans">
          ভর্তি আবেদন পোর্টাল প্রস্তুত হচ্ছে...
        </div>
      }
    >
      <ApplicationForm />
    </Suspense>
  );
}
