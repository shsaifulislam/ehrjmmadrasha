"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BangladeshAddressSelector from "@/components/admission/BangladeshAddressSelector";
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
  const [admissionClosed, setAdmissionClosed] = useState(false);
  const [closedNotice, setClosedNotice] = useState<{
    message: string;
    helpline: string;
    sessionName: string;
  } | null>(null);

  // Authenticated User State (Guardian / Student)
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
  } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Inline Auth Gate States
  const [authGateTab, setAuthGateTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [inlineLoginIdentifier, setInlineLoginIdentifier] = useState("");
  const [inlineLoginPassword, setInlineLoginPassword] = useState("");
  const [inlineLoginLoading, setInlineLoginLoading] = useState(false);
  const [inlineLoginError, setInlineLoginError] = useState<string | null>(null);

  const [inlineRegName, setInlineRegName] = useState("");
  const [inlineRegPhone, setInlineRegPhone] = useState("");
  const [inlineRegEmail, setInlineRegEmail] = useState("");
  const [inlineRegPassword, setInlineRegPassword] = useState("");
  const [inlineRegLoading, setInlineRegLoading] = useState(false);
  const [inlineRegError, setInlineRegError] = useState<string | null>(null);

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
    addressMetadata: null as any,

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

  // Handle structured address changes from BangladeshAddressSelector
  const handleAddressChange = useCallback((present: string, permanent: string, structuredData?: any) => {
    setFormData((prev) => {
      if (
        prev.presentAddress === present &&
        prev.permanentAddress === permanent &&
        prev.addressMetadata === structuredData
      ) {
        return prev;
      }
      return {
        ...prev,
        presentAddress: present,
        permanentAddress: permanent,
        guardianAddress: prev.guardianAddress || present,
        addressMetadata: structuredData || null,
      };
    });
  }, []);

  // Load classes, sessions & admission status
  useEffect(() => {
    Promise.all([
      fetch("/api/academic/classes").then((res) => res.json()).catch(() => ({ classes: [] })),
      fetch("/api/academic/sessions").then((res) => res.json()).catch(() => ({ sessions: [] })),
      fetch("/api/admissions/status").then((res) => res.json()).catch(() => null),
    ]).then(([classData, sessionData, statusData]) => {
      if (statusData?.success && statusData?.admission && !statusData.admission.isOpen) {
        setAdmissionClosed(true);
        setClosedNotice({
          message: statusData.admission.closedMessage,
          helpline: statusData.admission.helplinePhone,
          sessionName: statusData.admission.sessionName,
        });
      }

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

  // Load current authenticated user (Guardian / Student)
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
          // Auto-fill guardian fields if not filled yet
          setFormData((prev) => ({
            ...prev,
            guardianName: prev.guardianName || (data.user.role === "GUARDIAN" ? data.user.name : prev.guardianName),
            guardianPhone: prev.guardianPhone || data.user.phone || "",
            guardianEmail: prev.guardianEmail || (data.user.email?.includes("@") ? data.user.email : prev.guardianEmail),
          }));
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

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

  // Inline Login Handler for Auth Gate
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineLoginLoading(true);
    setInlineLoginError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: inlineLoginIdentifier.trim(),
          password: inlineLoginPassword,
          panel: "GUARDIAN",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setCurrentUser(data.user);
        setFormData((prev) => ({
          ...prev,
          guardianName: prev.guardianName || (data.user.role === "GUARDIAN" ? data.user.name : prev.guardianName),
          guardianPhone: prev.guardianPhone || data.user.phone || "",
          guardianEmail: prev.guardianEmail || (data.user.email?.includes("@") ? data.user.email : prev.guardianEmail),
        }));
      } else {
        setInlineLoginError(data.error || "লগইন ব্যর্থ হয়েছে। সঠিক মোবাইল নম্বর ও পাসওয়ার্ড প্রদান করুন।");
      }
    } catch {
      setInlineLoginError("সার্ভার ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setInlineLoginLoading(false);
    }
  };

  // Inline Registration Handler for Auth Gate
  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineRegLoading(true);
    setInlineRegError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inlineRegName.trim(),
          phone: inlineRegPhone.trim(),
          email: inlineRegEmail.trim().toLowerCase(),
          password: inlineRegPassword,
          role: "GUARDIAN",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setCurrentUser(data.user);
        setFormData((prev) => ({
          ...prev,
          guardianName: data.user.name,
          guardianPhone: data.user.phone || inlineRegPhone.trim(),
          guardianEmail: data.user.email || inlineRegEmail.trim(),
        }));
      } else {
        setInlineRegError(data.error || "অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। তথ্য সঠিক কিনা যাচাই করুন।");
      }
    } catch {
      setInlineRegError("সার্ভার সংযোগে ত্রুটি। আবার চেষ্টা করুন।");
    } finally {
      setInlineRegLoading(false);
    }
  };

  // Submit Final Application
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      setError("ভর্তি আবেদন দাখিল করার জন্য অভিভাবক অ্যাকাউন্টে লগইন করা অথবা নতুন অ্যাকাউন্ট তৈরি করা আবশ্যক।");
      return;
    }

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
        if (data.requiresAuth) {
          setShowAuthModal(true);
        }
        setError(data.error || "আবেদন জমাদানে ত্রুটি হয়েছে।");
      }
    } catch {
      setError("সার্ভার ত্রুটি। আবেদনটি জমা দেওয়া যায়নি।");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 9));
  };

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 p-8 bg-white rounded-2xl border border-slate-200/80 shadow-lg">
          <div className="w-10 h-10 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-700">ডিজিটাল ভর্তি আবেদন পোর্টাল লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  // Admission Closed Screen
  if (admissionClosed) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-16 flex-1 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner border border-amber-200">
            <Clock className="w-10 h-10 text-amber-700" />
          </div>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold shadow-sm">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>ভর্তি কার্যক্রম সাময়িকভাবে স্থগিত</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              নতুন শিক্ষার্থী ভর্তি আবেদন বর্তমানে বন্ধ রয়েছে
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              {closedNotice?.message ||
                "বর্তমানে নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম সাময়িকভাবে বন্ধ রয়েছে। পরবর্তী সেশনের ভর্তি বিজ্ঞপ্তি খুব শীঘ্রই ওয়েবসাইটে এবং নোটিশ বোর্ডে প্রকাশ করা হবে।"}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl max-w-md mx-auto space-y-4 text-left">
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/70 text-xs text-amber-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                জরুরি ভর্তি ও তথ্য সেবা
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ভর্তি সংক্রান্ত পরবর্তী তারিখ ও বিশেষ তথ্যের জন্য মাদরাসা অফিসে সরাসরি যোগাযোগ করতে পারেন।
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href={`tel:${closedNotice?.helpline || "01845162664"}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-[#0D5C3A] hover:bg-[#158052] text-white transition shadow-md"
              >
                <span>অফিসিয়াল হেল্পলাইনে কল করুন ({closedNotice?.helpline || "01845-162664"})</span>
              </a>
              <a
                href="https://wa.me/8801845162664"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-50 text-[#0D5C3A] border border-emerald-300 hover:bg-emerald-100 transition"
              >
                <span>হোয়াটসঅ্যাপ ও ইমোতে বার্তা পাঠান</span>
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/notices"
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-sm"
            >
              ভর্তি নোটিশ বোর্ড দেখুন
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition shadow-sm"
            >
              মূল পাতায় ফিরে যান
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Success Confirmation Screen
  if (successData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-16 flex-1 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-[#0D5C3A] flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#0D5C3A] border border-emerald-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>আবেদন সফলভাবে গৃহীত হয়েছে</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              আলহামদুলিল্লাহ! আপনার ভর্তি আবেদন সংরক্ষিত হয়েছে
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              আপনার ভর্তি আবেদন মাদরাসার মূল ডেটাবেজে তালিকাভুক্ত হয়েছে। নিচের ট্র্যাকিং নম্বরটি ভবিষ্যৎ রেফারেন্সের জন্য সংরক্ষণ করুন।
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xl max-w-md mx-auto space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-amber-400 to-[#0D5C3A]" />
            <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">আবেদন ট্র্যাকিং নম্বর</span>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-2xl font-black text-[#0D5C3A] tracking-wider select-all">
              {successData.applicationNumber}
            </div>
            <p className="text-xs text-slate-500 leading-tight">
              অভিভাবকের মোবাইল নম্বর ও এই ট্র্যাকিং নম্বর ব্যবহার করে যে কোনো সময় আবেদনের সর্বশেষ অবস্থা বা ভাইভা নোটিশ ট্র্যাক করতে পারবেন।
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={`/admission/track?trackingId=${successData.applicationNumber}`}
              className="px-6 py-3 rounded-xl bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs font-bold shadow-md shadow-emerald-950/20 transition-all hover:scale-[1.02]"
            >
              অনলাইনে আবেদন ট্র্যাক করুন
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-sm transition flex items-center gap-2 hover:scale-[1.02]"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              ভর্তি স্লিপ প্রিন্ট করুন
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <Link
              href="/admission"
              className="text-xs font-bold text-[#0D5C3A] hover:underline flex items-center gap-1.5 mb-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              ভর্তি নির্দেশিকায় ফিরুন
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              অনলাইন ডিজিটাল ভর্তি আবেদন ফরম (২০২৬)
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowResumeModal(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              ড্রাফট পুনরুদ্ধার
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-300/80 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              {savingDraft ? "সংরক্ষণ হচ্ছে..." : "ড্রাফট সেভ করুন"}
            </button>
          </div>
        </div>

        {/* Notices */}
        {draftNotice && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-semibold flex items-center justify-between shadow-sm">
            <span>{draftNotice}</span>
            <button onClick={() => setDraftNotice(null)} className="text-emerald-700 font-bold text-base px-1">×</button>
          </div>
        )}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2 shadow-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Account Guidance / Mandatory Auth Gate Banner */}
        {currentUser ? (
          <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0D5C3A] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#0D5C3A] bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                    ✓ সত্যায়িত অভিভাবক প্রোফাইল: {currentUser.role === "GUARDIAN" ? "অভিভাবক" : currentUser.role}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{currentUser.name}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {currentUser.email || currentUser.phone} — ভর্তি আবেদনটি স্বয়ংক্রিয়ভাবে আপনার অভিভাবক অ্যাকাউন্টে সংরক্ষিত হবে।
                </p>
              </div>
            </div>
            <Link
              href="/portal"
              className="text-xs font-bold text-[#0D5C3A] hover:underline px-3 py-1.5 rounded-lg bg-white border border-emerald-200 shadow-xs"
            >
              পোর্টালে যান &rarr;
            </Link>
          </div>
        ) : null}

        {/* ========================================================
            MANDATORY AUTH GATEWAY (IF NOT LOGGED IN)
            ======================================================== */}
        {!currentUser ? (
          <div className="bg-white rounded-3xl border-2 border-[#D4AF37] shadow-2xl p-6 sm:p-10 space-y-8 relative overflow-hidden card-3d">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0D5C3A] via-[#D4AF37] to-[#041F14]" />

            {/* Header with Emblem */}
            <div className="text-center max-w-xl mx-auto space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-inner animate-pulse-glow">
                <ShieldAlert className="w-8 h-8 text-amber-800" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-xs font-bold">
                <span>লগইন বা একাউন্ট তৈরি বাধ্যতামূলক</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                ভর্তি আবেদন ফরম শুরুর পূর্বে অভিভাবক অ্যাকাউন্ট আবশ্যক
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                সম্মানিত অভিভাবক, ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় অনলাইনে ভর্তি আবেদন ফরম পূরণ করতে হলে প্রথমে অভিভাবক একাউন্টে লগইন থাকতে হবে অথবা একটি নতুন একাউন্ট তৈরি করতে হবে।
              </p>
            </div>

            {/* Why Account is Mandatory - Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D5C3A] flex-shrink-0" />
                <span>আবেদনের সকল তথ্য অভিভাবক প্রোফাইলে সংরক্ষিত থাকবে</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D5C3A] flex-shrink-0" />
                <span>ভর্তি পরীক্ষার প্রবেশপত্র ও ফলাফল সরাসরি ডাউনলোড</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D5C3A] flex-shrink-0" />
                <span>ভর্তি ফি ও মাসিক ফি ডিজিটাল পরিশোধ সুবিধা</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D5C3A] flex-shrink-0" />
                <span>মৌখিক ও লিখিত পরীক্ষার তাৎক্ষণিক এসএমএস নোটিশ</span>
              </div>
            </div>

            {/* Inline Auth Box: Tabs (Login vs Register) */}
            <div className="max-w-md mx-auto bg-slate-50/80 rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
              <div className="flex rounded-xl bg-slate-200/80 p-1 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthGateTab("LOGIN");
                    setInlineLoginError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    authGateTab === "LOGIN"
                      ? "bg-white text-[#0D5C3A] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  অভিভাবক লগইন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthGateTab("REGISTER");
                    setInlineRegError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    authGateTab === "REGISTER"
                      ? "bg-white text-[#0D5C3A] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  নতুন একাউন্ট তৈরি করুন
                </button>
              </div>

              {/* TAB 1: LOGIN */}
              {authGateTab === "LOGIN" && (
                <form onSubmit={handleInlineLogin} className="space-y-3.5">
                  {inlineLoginError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>{inlineLoginError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      মোবাইল নম্বর অথবা ইমেইল <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={inlineLoginIdentifier}
                      onChange={(e) => setInlineLoginIdentifier(e.target.value)}
                      placeholder="018XXXXXXXX অথবা guardian@gmail.com"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#0D5C3A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      পাসওয়ার্ড <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={inlineLoginPassword}
                      onChange={(e) => setInlineLoginPassword(e.target.value)}
                      placeholder="আপনার পাসওয়ার্ড"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#0D5C3A] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={inlineLoginLoading}
                    className="w-full py-3 rounded-xl bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs font-bold shadow-md shadow-emerald-950/20 transition flex items-center justify-center gap-2"
                  >
                    {inlineLoginLoading ? "লগইন হচ্ছে..." : "লগইন করুন ও আবেদন শুরু করুন"}
                  </button>

                  <div className="text-center pt-2">
                    <Link
                      href="/login?tab=guardian&redirect=/admission/apply"
                      className="text-xs text-[#0D5C3A] hover:underline font-semibold"
                    >
                      মূল লগইন পেজে যেতে এখানে ক্লিক করুন &rarr;
                    </Link>
                  </div>
                </form>
              )}

              {/* TAB 2: REGISTER */}
              {authGateTab === "REGISTER" && (
                <form onSubmit={handleInlineRegister} className="space-y-3.5">
                  {inlineRegError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>{inlineRegError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      অভিভাবকের পূর্ণ নাম <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={inlineRegName}
                      onChange={(e) => setInlineRegName(e.target.value)}
                      placeholder="যেমন: মো: রফিকুল ইসলাম"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#0D5C3A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ১১ ডিজিটের মোবাইল নম্বর <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={inlineRegPhone}
                      onChange={(e) => setInlineRegPhone(e.target.value)}
                      placeholder="018XXXXXXXX"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#0D5C3A] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ইমেইল ঠিকানা <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={inlineRegEmail}
                      onChange={(e) => setInlineRegEmail(e.target.value)}
                      placeholder="guardian@gmail.com"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#0D5C3A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={inlineRegPassword}
                      onChange={(e) => setInlineRegPassword(e.target.value)}
                      placeholder="পাসওয়ার্ড দিন"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#0D5C3A] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={inlineRegLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-slate-950 text-xs font-black shadow-md transition flex items-center justify-center gap-2"
                  >
                    {inlineRegLoading ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন ও সরাসরি আবেদন শুরু করুন"}
                  </button>

                  <div className="text-center pt-2">
                    <Link
                      href="/login?tab=register&redirect=/admission/apply"
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      রেজিস্ট্রেশন পাতায় যেতে ক্লিক করুন &rarr;
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Stepper Progress Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] gap-2">
            {steps.map((s) => {
              const isDone = currentStep > s.id;
              const isCurrent = currentStep === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => handleStepClick(s.id)}
                  className={`flex-1 flex flex-col items-center cursor-pointer select-none transition-all ${
                    s.id < currentStep ? "hover:opacity-80" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                      isDone
                        ? "bg-[#0D5C3A] text-white shadow-md shadow-emerald-900/20"
                        : isCurrent
                        ? "bg-gradient-to-r from-[#0D5C3A] to-emerald-600 text-white ring-4 ring-emerald-100 shadow-md"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isDone ? "✓" : s.id}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 font-medium whitespace-nowrap ${
                      isCurrent ? "font-bold text-[#0D5C3A]" : isDone ? "text-slate-700" : "text-slate-400"
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
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
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
                <p className="text-xs text-stone-500">
                  বাংলাদেশ প্রশাসনিক কাঠামো (বিভাগ, জেলা, উপজেলা, ডাকঘর) এবং ইলিয়টগঞ্জ ও সমগ্র দেশের গ্রামভিত্তিক পূর্ণাঙ্গ ঠিকানা দিন।
                </p>
              </div>

              <BangladeshAddressSelector
                presentAddressValue={formData.presentAddress}
                permanentAddressValue={formData.permanentAddress}
                initialPresentState={formData.addressMetadata?.present}
                initialPermanentState={formData.addressMetadata?.permanent}
                onAddressChange={handleAddressChange}
              />
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
                onClick={handleNextStep}
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
          </>
        )}
      </main>

      {/* Mandatory Auth Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-amber-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-400 to-[#0D5C3A]" />
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 font-display">
                অভিভাবক অ্যাকাউন্ট লগইন আবশ্যক
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                অনলাইনে ভর্তি আবেদন ফরম পূরণ ও দাখিল করার জন্য অনুগ্রহ করে আপনার অভিভাবক একাউন্টে লগইন করুন অথবা মাত্র ১ মিনিটে একটি নতুন অ্যাকাউন্ট খুলুন।
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5 space-y-1.5 text-[11px] text-amber-900 font-medium">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>আবেদনের লাইভ অগ্রগতি ও ভাইভা শিডিউল নোটিশ</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>অভিভাবক পোর্টালে শিক্ষার্থীর চূড়ান্ত ভর্তি পরীক্ষার ফলাফল</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>ডিজিটাল ভর্তি স্লিপ ও ফি রসিদ সংরক্ষণ</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <Link
                href="/login?tab=guardian&redirect=/admission/apply"
                className="w-full sm:flex-1 py-2.5 rounded-xl border-2 border-[#0D5C3A] text-[#0D5C3A] hover:bg-emerald-50 text-xs font-bold text-center shadow-xs transition"
              >
                লগইন করুন
              </Link>
              <Link
                href="/login?tab=register&redirect=/admission/apply"
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs font-bold text-center shadow-md shadow-emerald-950/20 transition"
              >
                নতুন অ্যাকাউন্ট খুলুন
              </Link>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium transition"
              >
                পরে করব (বন্ধ করুন)
              </button>
            </div>
          </div>
        </div>
      )}

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
