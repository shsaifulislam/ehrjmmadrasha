"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Printer,
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

interface DuplicateMatch {
  confidence: "HIGH" | "MEDIUM" | "LOW";
  matchReason: string;
  identifier: string;
  fullNameBn: string;
  guardianPhone: string;
  status: string;
}

export default function AdmissionPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [classes, setClasses] = useState<JamatClass[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live duplicate detection warning state
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateMatch[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Success result
  const [successData, setSuccessData] = useState<{
    applicationNumber: string;
    message: string;
    duplicateMatches?: DuplicateMatch[];
  } | null>(null);

  // Unique submission token for idempotency (double-click / refresh protection)
  const [submissionToken] = useState(() => `SUB-TOKEN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  // Form states
  const [formData, setFormData] = useState({
    // Step 1: Student Personal Information
    studentNameBn: "",
    studentNameEn: "",
    studentNameAr: "",
    dateOfBirth: "",
    gender: "MALE",
    bloodGroup: "",
    birthCertificateNo: "",
    nidNo: "",
    nationality: "বাংলাদেশী",

    // Step 2: Parents & Guardian
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

    // Step 3: Address & Contact
    presentAddress: "",
    permanentAddress: "",

    // Step 4: Academic Preference
    sessionId: "",
    desiredClassId: "",
    desiredSectionId: "",
    previousInstitute: "",
    previousClass: "",

    // Step 5: Residential & Welfare
    desiredResidentialStatus: "NON_RESIDENTIAL",
    isOrphan: false,
    isFinanciallyWeak: false,
    financialAssistanceRequested: false,
    specialAssistanceDetails: "",

    // Step 6: Documents
    photoUrl: "",
    birthCertDocUrl: "",
    previousCertDocUrl: "",
  });

  // Fetch classes & sessions on load
  useEffect(() => {
    Promise.all([
      fetch("/api/academic/classes").then((res) => res.json()).catch(() => ({ classes: [] })),
      fetch("/api/academic/sessions").then((res) => res.json()).catch(() => ({ sessions: [] })),
    ]).then(([classData, sessionData]) => {
      if (classData.classes && classData.classes.length > 0) {
        setClasses(classData.classes);
        setFormData((prev) => ({ ...prev, desiredClassId: classData.classes[0].id }));
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
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Run duplicate check on Step change or before Review step
  const checkDuplicateRecords = async () => {
    if (!formData.studentNameBn || !formData.guardianPhone) return;
    setCheckingDuplicates(true);
    try {
      const res = await fetch("/api/admissions/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentNameBn: formData.studentNameBn,
          dateOfBirth: formData.dateOfBirth,
          fatherNameBn: formData.fatherNameBn || formData.guardianName,
          guardianPhone: formData.guardianPhone,
          birthCertificateNo: formData.birthCertificateNo,
          nidNo: formData.nidNo,
        }),
      });
      const data = await res.json();
      if (data.matches && data.matches.length > 0) {
        setDuplicateWarning(data.matches);
      } else {
        setDuplicateWarning([]);
      }
    } catch {
      // Non-blocking duplicate check
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleNextStep = () => {
    setError(null);

    // Validation per step
    if (currentStep === 1) {
      if (!formData.studentNameBn.trim()) {
        setError("শিক্ষার্থীর বাংলা নাম প্রদান করা আবশ্যক।");
        return;
      }
      if (!formData.dateOfBirth) {
        setError("শিক্ষার্থীর জন্মতারিখ নির্ধারণ করুন।");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.guardianName.trim() || !formData.guardianPhone.trim()) {
        setError("অভিভাবকের নাম এবং ১১ ডিজিটের সক্রিয় মোবাইল নম্বর প্রদান করুন।");
        return;
      }
      if (!/^01[0-9]{9}$/.test(formData.guardianPhone.trim())) {
        setError("অভিভাবকের মোবাইল নম্বরটি সঠিক নয় (১১ ডিজিট হতে হবে, যেমন: 018XXXXXXXX)।");
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.presentAddress.trim()) {
        setError("বর্তমান ঠিকানা উল্লেখ করুন।");
        return;
      }
      // If permanent address is empty, copy present address
      if (!formData.permanentAddress.trim()) {
        setFormData((prev) => ({ ...prev, permanentAddress: prev.presentAddress }));
      }
    } else if (currentStep === 4) {
      if (!formData.desiredClassId) {
        setError("আবেদনকৃত জামাত / শ্রেণি নির্বাচন করুন।");
        return;
      }
      // Trigger live duplicate check before review
      checkDuplicateRecords();
    } else if (currentStep === 6) {
      checkDuplicateRecords();
    }

    setCurrentStep((prev) => Math.min(prev + 1, 7));
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        address: formData.presentAddress,
        submissionToken,
        source: "ONLINE",
        documents: [
          formData.photoUrl ? { title: "শিক্ষার্থীর ছবি", url: formData.photoUrl } : null,
          formData.birthCertDocUrl ? { title: "জন্ম নিবন্ধন সনদ", url: formData.birthCertDocUrl } : null,
          formData.previousCertDocUrl ? { title: "পূর্ববর্তী মার্কশিট / ছাড়পত্র", url: formData.previousCertDocUrl } : null,
        ].filter(Boolean),
      };

      const res = await fetch("/api/admissions/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ভর্তি আবেদন জমা ব্যর্থ হয়েছে।");
        setSubmitting(false);
        return;
      }

      setSuccessData({
        applicationNumber: data.applicationNumber,
        message: data.message,
        duplicateMatches: data.duplicateMatches,
      });
      setSubmitting(false);
    } catch {
      setError("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। দয়া করে পুনরায় চেষ্টা করুন।");
      setSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: "শিক্ষার্থীর তথ্য", icon: User },
    { num: 2, title: "অভিভাবক", icon: Users },
    { num: 3, title: "ঠিকানা", icon: Home },
    { num: 4, title: "জামাত পছন্দ", icon: BookOpen },
    { num: 5, title: "আবাসিক ও সুবিধা", icon: HeartHandshake },
    { num: 6, title: "কাগজপত্র", icon: Paperclip },
    { num: 7, title: "পর্যালোচনা ও দাখিল", icon: FileText },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full py-8 px-4 sm:px-6">
        {/* Top Header / Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-200">
          <div>
            <span className="text-xs font-semibold text-[#0D5C3A] tracking-wider uppercase">
              ভর্তি কার্যক্রম • ২০২৫-২০২৬
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-display">
              অনলাইন নতুন ছাত্র ভর্তি আবেদন
            </h1>
          </div>
          <Link
            href="/admission/track"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-[#0D5C3A] hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition"
          >
            <Search className="w-3.5 h-3.5" />
            পূর্বের আবেদন ট্র্যাক করুন
          </Link>
        </div>

        {/* SUCCESS RECEIPT VIEW */}
        {successData ? (
          <div className="bg-white rounded-2xl border-2 border-[#0D5C3A] p-6 sm:p-10 shadow-xl text-center animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-[#0D5C3A] flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2 font-display">
              ভর্তি আবেদন সফলভাবে দাখিল হয়েছে!
            </h2>
            <p className="text-sm text-stone-600 mb-6">{successData.message}</p>

            {successData.duplicateMatches && successData.duplicateMatches.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left max-w-xl mx-auto">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs mb-1">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  সম্ভাব্য পূর্ববর্তী রেকর্ড নোটিশ
                </div>
                <p className="text-xs text-amber-800">
                  আপনার আবেদনের তথ্যের সাথে পূর্বের রেকর্ড মিলেছে। মাদরাসা কর্তৃপক্ষ যাচাই করে আবেদনটি বিবেচনা করবেন।
                </p>
              </div>
            )}

            {/* Tracking ID Badge Card */}
            <div className="bg-[#FAF8F5] border border-stone-200 p-6 rounded-xl max-w-lg mx-auto mb-8 text-left shadow-sm">
              <div className="border-b border-stone-200 pb-4 mb-4 text-center">
                <span className="text-xs text-stone-500 font-medium block uppercase tracking-wide">
                  আবেদন ট্র্যাকিং নম্বর (Application Tracking ID)
                </span>
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#0D5C3A] tracking-wider block mt-1">
                  {successData.applicationNumber}
                </span>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  ভর্তি পরীক্ষার ফলাফল ও অবস্থা ট্র্যাকিং করার জন্য এই নম্বরটি সংরক্ষণ করুন।
                </span>
              </div>

              <div className="text-xs space-y-2 text-stone-700">
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">শিক্ষার্থীর নাম:</span>
                  <span className="font-semibold text-stone-900">{formData.studentNameBn}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">অভিভাবকের নাম:</span>
                  <span className="font-semibold text-stone-900">{formData.guardianName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">অভিভাবকের মোবাইল:</span>
                  <span className="font-mono font-semibold text-stone-900">{formData.guardianPhone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-500">আবেদনের তারিখ:</span>
                  <span className="font-semibold text-stone-900">{new Date().toLocaleDateString("bn-BD")}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-[#0D5C3A] hover:bg-[#158052] text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                রিসিপ্ট প্রিন্ট / সেভ করুন
              </button>
              <Link
                href={`/admission/track?appId=${encodeURIComponent(successData.applicationNumber)}`}
                className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-5 py-2.5 rounded-lg font-semibold text-sm transition"
              >
                আবেদনের অবস্থা দেখুন
              </Link>
            </div>
          </div>
        ) : (
          /* MULTI-STEP ADMISSION FORM */
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            {/* Step Progress Bar */}
            <div className="bg-stone-50 p-4 border-b border-stone-200 overflow-x-auto">
              <div className="flex items-center justify-between min-w-[600px] px-2">
                {stepsList.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.num;
                  const isCompleted = currentStep > step.num;
                  return (
                    <div key={step.num} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted
                              ? "bg-[#0D5C3A] text-white"
                              : isActive
                              ? "bg-[#C59B27] text-white ring-4 ring-amber-100"
                              : "bg-stone-200 text-stone-500"
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <span
                          className={`text-[11px] mt-1.5 whitespace-nowrap font-medium ${
                            isActive ? "text-stone-900 font-bold" : "text-stone-500"
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>
                      {idx < stepsList.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 transition-all ${
                            isCompleted ? "bg-[#0D5C3A]" : "bg-stone-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="m-6 mb-0 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Live Duplicate Warning Notice */}
            {duplicateWarning.length > 0 && currentStep >= 4 && (
              <div className="m-6 mb-0 bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  সম্ভাব্য পূর্ববর্তী রেকর্ড পাওয়া গেছে (Duplicate Warning)
                </div>
                <p className="text-amber-800">
                  প্রদত্ত তথ্যের সাথে মাদরাসার ডাটাবেজে পূর্ববর্তী রেকর্ড মিলেছে। তবে আবেদন বাতিল হবে না, মাদরাসা অ্যাডমিন তা নিরীক্ষা করবেন।
                </p>
                <div className="space-y-1 bg-white p-2.5 rounded border border-amber-200 text-[11px]">
                  {duplicateWarning.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center text-stone-700">
                      <span>• {m.matchReason}</span>
                      <span className="font-mono text-stone-500">{m.identifier} ({m.fullNameBn})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {/* STEP 1: Student Information */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-stone-200 pb-2">
                    <h2 className="text-base font-bold text-stone-900 font-display">১. শিক্ষার্থীর ব্যক্তিগত পরিচিতি</h2>
                    <p className="text-xs text-stone-500">শিক্ষার্থীর সঠিক জন্মনিবন্ধন বা শিক্ষাগত তথ্যানুযায়ী পূরণ করুন।</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        শিক্ষার্থীর পূর্ণ নাম (বাংলায়) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="studentNameBn"
                        required
                        value={formData.studentNameBn}
                        onChange={handleChange}
                        placeholder="যেমন: মুহাম্মদ আব্দুল্লাহ"
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        শিক্ষার্থীর নাম (ইংরেজিতে - ক্যাপিটাল লেটার)
                      </label>
                      <input
                        type="text"
                        name="studentNameEn"
                        value={formData.studentNameEn}
                        onChange={handleChange}
                        placeholder="e.g. MUHAMMAD ABDULLAH"
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs uppercase outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        শিক্ষার্থীর নাম (আরবিতে - ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        name="studentNameAr"
                        dir="rtl"
                        value={formData.studentNameAr}
                        onChange={handleChange}
                        placeholder="محمد عبد الله"
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-serif outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        জন্ম তারিখ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        required
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        লিঙ্গ <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A] bg-white"
                      >
                        <option value="MALE">ছাত্র (পুরুষ)</option>
                        <option value="FEMALE">ছাত্রী (মহিলা)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        রক্তের গ্রুপ (Blood Group)
                      </label>
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A] bg-white"
                      >
                        <option value="">নির্বাচন করুন</option>
                        <option value="A_POSITIVE">A+ (A Positive)</option>
                        <option value="A_NEGATIVE">A- (A Negative)</option>
                        <option value="B_POSITIVE">B+ (B Positive)</option>
                        <option value="B_NEGATIVE">B- (B Negative)</option>
                        <option value="O_POSITIVE">O+ (O Positive)</option>
                        <option value="O_NEGATIVE">O- (O Negative)</option>
                        <option value="AB_POSITIVE">AB+ (AB Positive)</option>
                        <option value="AB_NEGATIVE">AB- (AB Negative)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        জন্ম নিবন্ধন নম্বর (১৭ ডিজিট)
                      </label>
                      <input
                        type="text"
                        name="birthCertificateNo"
                        value={formData.birthCertificateNo}
                        onChange={handleChange}
                        placeholder="১৭ ডিজিটের জন্ম নিবন্ধন নম্বর"
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-mono outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Parents & Guardian */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-stone-200 pb-2">
                    <h2 className="text-base font-bold text-stone-900 font-display">২. পিতামাতা ও অভিভাবকের বিবরণ</h2>
                    <p className="text-xs text-stone-500">মাদরাসা কর্তৃপক্ষের সাথে যোগাযোগের জন্য অভিভাবকের তথ্য অপরিহার্য।</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">পিতার নাম (বাংলায়)</label>
                      <input
                        type="text"
                        name="fatherNameBn"
                        value={formData.fatherNameBn}
                        onChange={handleChange}
                        placeholder="পিতার নাম"
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">পিতার পেশা</label>
                      <input
                        type="text"
                        name="fatherOccupation"
                        value={formData.fatherOccupation}
                        onChange={handleChange}
                        placeholder="যেমন: ব্যবসা / শিক্ষকতা / প্রবাস"
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">মাতার নাম (বাংলায়)</label>
                      <input
                        type="text"
                        name="motherNameBn"
                        value={formData.motherNameBn}
                        onChange={handleChange}
                        placeholder="মাতার নাম"
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">মাতার মোবাইল নম্বর</label>
                      <input
                        type="tel"
                        name="motherPhone"
                        value={formData.motherPhone}
                        onChange={handleChange}
                        placeholder="01XXXXXXXXX"
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-mono outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-stone-200">
                      <h3 className="text-xs font-bold text-[#0D5C3A] uppercase tracking-wide mb-3">
                        প্রধান অভিভাবকের তথ্য (যার সাথে মাদরাসা যোগাযোগ রাখবে)
                      </h3>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        অভিভাবকের নাম <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="guardianName"
                        required
                        value={formData.guardianName}
                        onChange={handleChange}
                        placeholder="অভিভাবকের নাম"
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        সম্পর্ক <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="guardianRelation"
                        value={formData.guardianRelation}
                        onChange={handleChange}
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A] bg-white"
                      >
                        <option value="FATHER">পিতা</option>
                        <option value="MOTHER">মাতা</option>
                        <option value="BROTHER">ভাই</option>
                        <option value="UNCLE">চাচা / মামা</option>
                        <option value="GRANDFATHER">দাদা / নানা</option>
                        <option value="LEGAL_GUARDIAN">আইনগত অভিভাবক</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        অভিভাবকের মোবাইল নম্বর <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="guardianPhone"
                        required
                        value={formData.guardianPhone}
                        onChange={handleChange}
                        placeholder="01XXXXXXXXX"
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-mono outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        অভিভাবকের ইমেইল (Gmail - ঐচ্ছিক)
                      </label>
                      <input
                        type="email"
                        name="guardianEmail"
                        value={formData.guardianEmail}
                        onChange={handleChange}
                        placeholder="example@gmail.com"
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Address & Contact */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-stone-200 pb-2">
                    <h2 className="text-base font-bold text-stone-900 font-display">৩. ঠিকানা ও যোগাযোগ</h2>
                    <p className="text-xs text-stone-500">গ্রাম, ডাকঘর, উপজেলা ও জেলা স্পষ্টভাবে উল্লেখ করুন।</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        বর্তমান ঠিকানা <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="presentAddress"
                        rows={3}
                        required
                        value={formData.presentAddress}
                        onChange={handleChange}
                        placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা..."
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-stone-700">স্থায়ী ঠিকানা</label>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, permanentAddress: prev.presentAddress }))}
                          className="text-[11px] text-[#0D5C3A] hover:underline font-semibold"
                        >
                          বর্তমান ঠিকানার অনুরূপ করুন
                        </button>
                      </div>
                      <textarea
                        name="permanentAddress"
                        rows={3}
                        value={formData.permanentAddress}
                        onChange={handleChange}
                        placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা..."
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Academic Preference */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-stone-200 pb-2">
                    <h2 className="text-base font-bold text-stone-900 font-display">৪. একাডেমিক তথ্য ও পছন্দনীয় জামাত</h2>
                    <p className="text-xs text-stone-500">যে জামাত বা বিভাগে ভর্তি হতে আগ্রহী তা নির্বাচন করুন।</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        শিক্ষাবর্ষ / সেশন <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="sessionId"
                        value={formData.sessionId}
                        onChange={handleChange}
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A] bg-white"
                      >
                        {sessions.map((sess) => (
                          <option key={sess.id} value={sess.id}>
                            {sess.name} {sess.isCurrent ? "(বর্তমান সেশন)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        আবেদনকৃত জামাত / শ্রেণি <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="desiredClassId"
                        required
                        value={formData.desiredClassId}
                        onChange={handleChange}
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A] bg-white font-semibold text-[#0D5C3A]"
                      >
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.nameBn} ({cls.nameEn})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        পূর্ববর্তী শিক্ষা প্রতিষ্ঠানের নাম (যদি থাকে)
                      </label>
                      <input
                        type="text"
                        name="previousInstitute"
                        value={formData.previousInstitute}
                        onChange={handleChange}
                        placeholder="যেমন: দারুল উলুম মাদরাসা"
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        পূর্ববর্তী উত্তীর্ণ শ্রেণি / বিভাগ
                      </label>
                      <input
                        type="text"
                        name="previousClass"
                        value={formData.previousClass}
                        onChange={handleChange}
                        placeholder="যেমন: নূরানী ৩য় জামাত"
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Residential & Welfare */}
              {currentStep === 5 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-stone-200 pb-2">
                    <h2 className="text-base font-bold text-stone-900 font-display">৫. আবাসিক সুবিধা ও আর্থিক সহযোগিতা</h2>
                    <p className="text-xs text-stone-500">মাদরাসার আবাসন ও ইয়াতীম/অসচ্ছল তহবিলের তথ্য।</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        আবাসিক মর্যাদা নির্বাচন করুন <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: "NON_RESIDENTIAL", label: "অনাবাসিক (Non-Residential)", desc: "বাসা থেকে যাতায়াত করবে" },
                          { id: "RESIDENTIAL", label: "আবাসিক (Residential)", desc: "বোর্ডিং ও মাদরাসা হোস্টেলে থাকবে" },
                          { id: "DAY_CARE", label: "ডে-কেয়ার (Day Care)", desc: "সকাল থেকে বিকাল পর্যন্ত অবস্থান করবে" },
                        ].map((item) => (
                          <label
                            key={item.id}
                            className={`border rounded-xl p-3.5 cursor-pointer transition ${
                              formData.desiredResidentialStatus === item.id
                                ? "border-[#0D5C3A] bg-emerald-50/50 ring-2 ring-[#0D5C3A]/20"
                                : "border-stone-200 hover:bg-stone-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="desiredResidentialStatus"
                              value={item.id}
                              checked={formData.desiredResidentialStatus === item.id}
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <div className="font-semibold text-xs text-stone-900">{item.label}</div>
                            <div className="text-[11px] text-stone-500 mt-1">{item.desc}</div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-3">
                      <h3 className="text-xs font-bold text-stone-800">কল্যাণমূলক ও ছাড়ের আবেদন</h3>

                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          name="isOrphan"
                          checked={formData.isOrphan}
                          onChange={handleChange}
                          className="mt-0.5 rounded text-[#0D5C3A] focus:ring-[#0D5C3A]"
                        />
                        <div>
                          <span className="text-xs font-semibold text-stone-900">শিক্ষার্থী কি পিতৃহীন বা ইয়াতীম?</span>
                          <span className="text-[11px] text-stone-500 block">
                            (ইলিয়টগঞ্জ হাজী রহমত উল্লাহ মাদরাসায় ইয়াতীম শিক্ষার্থীদের জন্য ১০০% ভর্তি ফি মওকুফ সুবিধা রয়েছে)
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          name="financialAssistanceRequested"
                          checked={formData.financialAssistanceRequested}
                          onChange={handleChange}
                          className="mt-0.5 rounded text-[#0D5C3A] focus:ring-[#0D5C3A]"
                        />
                        <div>
                          <span className="text-xs font-semibold text-stone-900">আর্থিক অসচ্ছলতার কারণে বিশেষ ফি ছাড়ের আবেদন</span>
                          <span className="text-[11px] text-stone-500 block">
                            (ভর্তি কমিটির যাচাইপূর্বক লিল্লাহ বোর্ডিং ফান্ড বা বৃত্তি বিবেচনা করা হবে)
                          </span>
                        </div>
                      </label>

                      {formData.financialAssistanceRequested && (
                        <div className="pt-2">
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            আর্থিক সমস্যার বিবরণ বা অভিভাবকের অক্ষমতার কারণ:
                          </label>
                          <textarea
                            name="specialAssistanceDetails"
                            rows={2}
                            value={formData.specialAssistanceDetails}
                            onChange={handleChange}
                            placeholder="পারিবারিক আর্থিক অবস্থা সংক্ষেপে উল্লেখ করুন..."
                            className="w-full p-2 border border-stone-300 rounded text-xs outline-none focus:border-[#0D5C3A]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Documents Attachment URLs */}
              {currentStep === 6 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-stone-200 pb-2">
                    <h2 className="text-base font-bold text-stone-900 font-display">৬. প্রয়োজনীয় ডকুমেন্টস ও সনদ</h2>
                    <p className="text-xs text-stone-500">অনলাইনে সংযুক্ত করুন অথবা ভর্তির সময় সশরীরে অফিসে দাখিল করুন।</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          শিক্ষার্থীর পাসপোর্ট সাইজ ছবির লিংক / ফাইল নোট
                        </label>
                        <input
                          type="text"
                          name="photoUrl"
                          value={formData.photoUrl}
                          onChange={handleChange}
                          placeholder="ছবি লিংক বা 'অফিসে জমা দেওয়া হবে'"
                          className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          জন্ম নিবন্ধন সনদের কপি / ফাইল লিংক
                        </label>
                        <input
                          type="text"
                          name="birthCertDocUrl"
                          value={formData.birthCertDocUrl}
                          onChange={handleChange}
                          placeholder="সনদ লিংক বা 'অফিসে জমা দেওয়া হবে'"
                          className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          পূর্ববর্তী মাদরাসার ছাড়পত্র / মার্কশিট (যদি থাকে)
                        </label>
                        <input
                          type="text"
                          name="previousCertDocUrl"
                          value={formData.previousCertDocUrl}
                          onChange={handleChange}
                          placeholder="ছাড়পত্র লিংক বা বিবরণ"
                          className="w-full p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A]"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-500 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                      💡 তথ্য: অনলাইন ফর্মে কোনো কারণে ফাইল আপলোড করতে সমস্যা হলে খালি রাখতে পারেন। ভর্তির চূড়ান্ত সাক্ষাৎকারের সময় মূল সনদ ও ছবি সরাসরি অফিসে জমা দেওয়ার সুযোগ রয়েছে।
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: Review & Final Submission */}
              {currentStep === 7 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-stone-200 pb-2">
                    <h2 className="text-base font-bold text-stone-900 font-display">৭. আবেদন পর্যালোচনা ও নিশ্চিতকরণ</h2>
                    <p className="text-xs text-stone-500">দাখিলের পূর্বে সকল তথ্য যাচাই করে নিন। জমাদানের পর তথ্য অপরিবর্তনীয় থাকবে।</p>
                  </div>

                  <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-5 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-stone-200">
                      <div>
                        <span className="text-stone-500 block">শিক্ষার্থীর নাম (বাংলা):</span>
                        <span className="font-bold text-stone-900 text-sm">{formData.studentNameBn}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">জন্ম তারিখ:</span>
                        <span className="font-semibold text-stone-900">{formData.dateOfBirth}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">লিঙ্গ:</span>
                        <span className="font-semibold text-stone-900">{formData.gender === "MALE" ? "ছাত্র (পুরুষ)" : "ছাত্রী (মহিলা)"}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">জন্ম নিবন্ধন নম্বর:</span>
                        <span className="font-mono font-semibold text-stone-900">{formData.birthCertificateNo || "প্রদান করা হয়নি"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-stone-200">
                      <div>
                        <span className="text-stone-500 block">অভিভাবকের নাম:</span>
                        <span className="font-bold text-stone-900">{formData.guardianName} ({formData.guardianRelation})</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">অভিভাবকের মোবাইল:</span>
                        <span className="font-mono font-bold text-[#0D5C3A]">{formData.guardianPhone}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-stone-500 block">বর্তমান ঠিকানা:</span>
                        <span className="font-semibold text-stone-900">{formData.presentAddress}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-stone-500 block">পছন্দনীয় জামাত:</span>
                        <span className="font-bold text-stone-900">
                          {classes.find((c) => c.id === formData.desiredClassId)?.nameBn || "নির্বাচিত জামাত"}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">আবাসিক অবস্থা:</span>
                        <span className="font-semibold text-stone-900">
                          {formData.desiredResidentialStatus === "RESIDENTIAL" ? "আবাসিক" : formData.desiredResidentialStatus === "DAY_CARE" ? "ডে-কেয়ার" : "অনাবাসিক"}
                        </span>
                      </div>
                      {formData.isOrphan && (
                        <div className="sm:col-span-2 bg-emerald-50 text-[#0D5C3A] font-semibold p-2 rounded border border-emerald-200">
                          ✓ শিক্ষার্থী ইয়াতীম (১০০% প্রাথমিক ভর্তি ফি মওকুফ বিবেচিত)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0D5C3A] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold block mb-0.5">অঙ্গীকারনামা:</span>
                      আমি প্রত্যয়ন করছি যে উপরে প্রদত্ত যাবতীয় তথ্য সম্পূর্ণ নির্ভুল ও সত্য। কোনো ভুল প্রমাণিত হলে মাদরাসা কর্তৃপক্ষের সিদ্ধান্ত চূড়ান্ত বলে গণ্য হবে।
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    পূর্ববর্তী ধাপ
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 7 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0D5C3A] hover:bg-[#158052] text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    পরবর্তী ধাপ
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#0D5C3A] hover:bg-[#158052] text-white rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                        জমা দেওয়া হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        চূড়ান্তভাবে আবেদন দাখিল করুন
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
