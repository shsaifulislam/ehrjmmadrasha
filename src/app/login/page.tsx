"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Search,
  Printer,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Award,
  BookOpen,
  ArrowRight,
  X,
  KeyRound,
  RotateCcw,
  CheckCircle,
} from "lucide-react";

interface JamatClass {
  id: string;
  nameBn: string;
  code: string;
}

interface StudentSearchResult {
  id: string;
  studentIdNumber: string;
  fullNameBn: string;
  fullNameEn: string;
  gender: string;
  residentialStatus: string;
  className: string;
  sectionName: string;
  rollNumber: number;
  sessionName: string;
  fatherName: string;
  guardianPhone: string | null;
  results: Array<{
    examName: string;
    totalMarks: number;
    percentage: number;
    grade: string;
    publishedAt: string;
  }>;
  feeDues: {
    totalDue: number;
    invoices: Array<{
      invoiceNumber: string;
      title: string;
      totalAmount: number;
      paidAmount: number;
      dueAmount: number;
      status: string;
    }>;
  };
}

export default function UnifiedPortalPage() {
  const [activeTab, setActiveTab] = useState<"STAFF_LOGIN" | "STUDENT_PORTAL">("STAFF_LOGIN");

  // Tab 1: Staff / Admin Login state (Empty by default per requirements)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Forgot Password / OTP Reset state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email, 2: OTP, 3: New Pass, 4: Success
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotResetToken, setForgotResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpExpiryTimer, setOtpExpiryTimer] = useState(600); // 10 minutes

  // Timer countdowns for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (forgotModalOpen && forgotStep === 2 && otpExpiryTimer > 0) {
      interval = setInterval(() => {
        setOtpExpiryTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [forgotModalOpen, forgotStep, otpExpiryTimer]);

  // Tab 2: Zero-Friction Student / Guardian Search state
  const [classes, setClasses] = useState<JamatClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [rollOrId, setRollOrId] = useState("1");
  const [dob, setDob] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [studentResult, setStudentResult] = useState<StudentSearchResult | null>(null);

  useEffect(() => {
    fetch("/api/academic/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.classes) {
          setClasses(data.classes);
          if (data.classes.length > 0) {
            setSelectedClassId(data.classes[4]?.id || data.classes[0].id); // Noorani as default
          }
        }
      })
      .catch(() => {});
  }, []);

  // Handle Staff/Admin Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "ভুল ইমেইল বা পাসওয়ার্ড। পুনরায় চেষ্টা করুন।");
        setLoginLoading(false);
        return;
      }

      // Single Unified Admin goes to /admin, Teacher goes to /teacher
      if (data.user.role === "ADMIN") {
        window.location.href = "/admin";
      } else if (data.user.role === "TEACHER") {
        window.location.href = "/teacher";
      } else {
        window.location.href = "/";
      }
    } catch {
      setLoginError("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।");
      setLoginLoading(false);
    }
  };

  // Forgot Password: Step 1 - Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      setForgotError("অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন।");
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "ওটিপি পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
        setForgotLoading(false);
        return;
      }

      setForgotSuccess(data.message);
      setForgotStep(2);
      setResendTimer(60);
      setOtpExpiryTimer(600); // 10 minutes
      setForgotLoading(false);
    } catch {
      setForgotError("সার্ভারে সংযোগে সমস্যা হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করুন।");
      setForgotLoading(false);
    }
  };

  // Forgot Password: Step 2 - Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotError("অনুগ্রহ করে আপনার ইমেইলে প্রাপ্ত ৬-সংখ্যার ওটিপি কোডটি লিখুন।");
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "ওটিপি যাচাই করা সম্ভব হয়নি।");
        setForgotLoading(false);
        return;
      }

      setForgotResetToken(data.resetToken);
      setForgotSuccess(data.message);
      setForgotStep(3);
      setForgotLoading(false);
    } catch {
      setForgotError("সার্ভারে ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
      setForgotLoading(false);
    }
  };

  // Forgot Password: Step 3 - Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setForgotError("পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError("উভয় পাসওয়ার্ড হুবহু এক হতে হবে।");
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await fetch("/api/auth/forgot-password/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          resetToken: forgotResetToken,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।");
        setForgotLoading(false);
        return;
      }

      setForgotSuccess(data.message);
      setForgotStep(4);
      setEmail(forgotEmail); // automatically populate email in login input
      setPassword("");
      setForgotLoading(false);
    } catch {
      setForgotError("সার্ভার ত্রুটি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
      setForgotLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotEmail(email || "");
    setForgotOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError(null);
    setForgotSuccess(null);
    setForgotStep(1);
    setForgotModalOpen(true);
  };

  const closeForgotModal = () => {
    setForgotModalOpen(false);
    setForgotError(null);
    setForgotSuccess(null);
  };

  // Handle Zero-Friction Student Search
  const handleStudentSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError(null);
    setStudentResult(null);

    try {
      const res = await fetch("/api/students/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          rollOrId,
          dob: dob || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || "প্রদত্ত তথ্যের কোনো ছাত্র রেকর্ড পাওয়া যায়নি।");
        setSearchLoading(false);
        return;
      }

      setStudentResult(data.student);
      setSearchLoading(false);
    } catch {
      setSearchError("সার্ভার অনুসন্ধান ব্যর্থ হয়েছে।");
      setSearchLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F8F3]">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center py-10 px-4">
        <div className="w-full max-w-xl bg-white rounded-xl border border-[#E2E8F0] shadow-xl overflow-hidden">
          {/* Header with Official Logo */}
          <div className="bg-[#0D5C3A] text-white p-6 text-center border-b-4 border-[#C59B27] relative">
            <div className="w-16 h-16 rounded-full bg-white border-2 border-[#C59B27] mx-auto mb-2 overflow-hidden shadow-lg flex items-center justify-center">
              <Image
                src="/images/logo.jpg"
                alt="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা লোগো"
                width={64}
                height={64}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-display tracking-tight">
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
            </h1>
            <p className="text-xs text-amber-200 mt-1">
              ডিজিটাল ক্যাম্পাস পোর্টাল ও ইনফরমেশন সিস্টেম (স্থাপিত: ২০২১ইং)
            </p>
          </div>

          {/* Toggle Navigation Tabs */}
          <div className="grid grid-cols-2 bg-[#F1EFE9] text-xs sm:text-sm font-bold border-b border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setActiveTab("STAFF_LOGIN")}
              className={`py-3.5 text-center border-b-2 transition flex items-center justify-center gap-2 ${
                activeTab === "STAFF_LOGIN"
                  ? "border-[#0D5C3A] text-[#0D5C3A] bg-white shadow-sm"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              প্রশাসন ও শিক্ষক লগইন
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("STUDENT_PORTAL")}
              className={`py-3.5 text-center border-b-2 transition flex items-center justify-center gap-2 ${
                activeTab === "STUDENT_PORTAL"
                  ? "border-[#0D5C3A] text-[#0D5C3A] bg-white shadow-sm"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              শিক্ষার্থী ও অভিভাবক পোর্টাল
            </button>
          </div>

          {/* TAB 1: STAFF & ADMIN LOGIN */}
          {activeTab === "STAFF_LOGIN" && (
            <div className="p-6 sm:p-8">
              <div className="mb-6 text-center">
                <h2 className="text-base font-bold text-gray-900">
                  মাদরাসা প্রশাসন ও উস্তাদ লগইন
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  একটি একক অ্যাডমিন প্যানেল দ্বারা সম্পূর্ণ ওয়েবসাইট ও প্রতিষ্ঠান পরিচালিত হয়
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-md text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    অফিসিয়াল ইমেইল এড্রেস (Email Address)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="adminehrjmadrasha@gmail.com"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    গোপন পাসওয়ার্ড (Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                      title={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={openForgotModal}
                      className="text-xs font-semibold text-[#0D5C3A] hover:text-[#083B25] hover:underline flex items-center gap-1 transition"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      পাসওয়ার্ড ভুলে গেছেন? (Forgot Password?)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 rounded-md font-bold text-sm transition flex items-center justify-center gap-2 shadow disabled:opacity-50 mt-2"
                >
                  {loginLoading ? "যাচাই করা হচ্ছে..." : "লগইন করুন (Login)"}
                  {!loginLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: ZERO-FRICTION STUDENT / GUARDIAN SEARCH (NO PASSWORD NEEDED) */}
          {activeTab === "STUDENT_PORTAL" && (
            <div className="p-6 sm:p-8">
              <div className="mb-5 text-center">
                <h2 className="text-base font-bold text-gray-900">
                  জিরো-ফ্রিকশন শিক্ষার্থী ও অভিভাবক অনুসন্ধান
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  কোনো পাসওয়ার্ড ছাড়াই শুধু জামাত ও রোল নম্বর দিয়ে ফলাফল, হাজিরা ও বকেয়া ফি দেখুন
                </p>
              </div>

              <form onSubmit={handleStudentSearch} className="space-y-4 mb-6">
                {searchError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-md text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      জামাত / ক্লাস নির্বাচন করুন
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D5C3A] font-medium"
                    >
                      <option value="">সকল জামাত / সরাসরি আইডি নম্বর</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      রোল অথবা শিক্ষার্থী আইডি *
                    </label>
                    <input
                      type="text"
                      required
                      value={rollOrId}
                      onChange={(e) => setRollOrId(e.target.value)}
                      placeholder="রোল নম্বর (যেমন: 1) বা EHRJ-2026-0001"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D5C3A] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    জন্ম তারিখ (ঐচ্ছিক নিরাপত্তা যাচাই)
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D5C3A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={searchLoading}
                  className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 rounded-md font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  {searchLoading ? "অনুসন্ধান চলছে..." : "তথ্য দেখুন (Search Records)"}
                </button>

                <p className="text-[11px] text-gray-400 text-center">
                  পরীক্ষার জন্য রোল: <span className="font-mono font-bold text-gray-700">1</span> (নূরানী) অথবা আইডি: <span className="font-mono font-bold text-gray-700">EHRJ-2026-0002</span> দিয়ে টেস্ট করতে পারেন।
                </p>
              </form>

              {/* RENDER STUDENT REPORT CARD WHEN FOUND */}
              {studentResult && (
                <div className="border-2 border-[#0D5C3A] rounded-lg p-5 bg-[#F9F8F3] space-y-4">
                  {/* Student Title Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-2">
                    <div>
                      <h3 className="font-bold text-base text-gray-900">
                        {studentResult.fullNameBn}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        আইডি: <span className="text-[#0D5C3A] font-bold">{studentResult.studentIdNumber}</span> | জামাত: {studentResult.className} (রোল: {studentResult.rollNumber})
                      </p>
                      <p className="text-[11px] text-gray-500">
                        পিতা: {studentResult.fatherName} | {studentResult.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="self-start sm:self-center bg-[#0D5C3A] hover:bg-[#158052] text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition no-print shadow"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      প্রিন্ট রেজাল্ট
                    </button>
                  </div>

                  {/* Results & Examination */}
                  <div>
                    <h4 className="text-xs font-bold text-[#0D5C3A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#C59B27]" />
                      পরীক্ষার ফলাফল ও গ্রেড
                    </h4>
                    {studentResult.results.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">কোনো পরীক্ষার ফলাফল এখনও প্রকাশিত হয়নি।</p>
                    ) : (
                      <div className="space-y-2">
                        {studentResult.results.map((r, i) => (
                          <div key={i} className="p-2.5 rounded bg-white border border-gray-200 text-xs flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-gray-900 block">{r.examName}</span>
                              <span className="text-[11px] text-gray-500">মোট প্রাপ্ত নম্বর: {r.totalMarks} ({r.percentage}%)</span>
                            </div>
                            <span className="bg-emerald-100 text-[#0D5C3A] px-2.5 py-1 rounded font-bold font-mono text-xs">
                              {r.grade}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fee & Due Status */}
                  <div className="pt-2 border-t border-gray-200">
                    <h4 className="text-xs font-bold text-[#0D5C3A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#C59B27]" />
                      মাসিক বেতন ও বকেয়া ফি বিবরণ
                    </h4>
                    <div className="flex items-center justify-between p-3 rounded bg-white border border-gray-200 text-xs">
                      <span className="font-semibold text-gray-700">বর্তমান মোট বকেয়া:</span>
                      <span className={`font-mono font-bold text-sm ${studentResult.feeDues.totalDue > 0 ? "text-red-600" : "text-emerald-700"}`}>
                        {studentResult.feeDues.totalDue > 0 ? `৳ ${studentResult.feeDues.totalDue}` : "পরিশোধিত (No Due)"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer note inside card */}
          <div className="bg-gray-50 p-4 border-t border-gray-100 text-center text-xs text-gray-500 space-y-1">
            <p>অফিস ও জরুরি যোগাযোগ: <span className="font-semibold text-gray-800 font-mono">01845-162664</span>, <span className="font-semibold text-gray-800 font-mono">01826-416696</span></p>
            <p className="text-[11px] text-gray-400">পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা</p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FORGOT PASSWORD & GMAIL OTP RESET MODAL */}
        {/* ======================================================== */}
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all my-8">
              {/* Modal Header */}
              <div className="bg-[#083B25] text-white p-5 border-b-4 border-[#C59B27] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#0D5C3A] border border-[#C59B27] flex items-center justify-center text-[#fef08a] shadow-inner">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base leading-tight">
                      পাসওয়ার্ড রিসেট (Password Reset)
                    </h3>
                    <p className="text-[11px] text-emerald-200">
                      Gmail OTP ভেরিফিকেশন ও নতুন পাসওয়ার্ড সেট
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                  title="বন্ধ করুন"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step Progress Indicators */}
              <div className="bg-[#F8FAF9] px-6 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between text-xs">
                  <div className={`flex items-center gap-1.5 ${forgotStep >= 1 ? "text-[#0D5C3A] font-bold" : "text-gray-400"}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${forgotStep >= 1 ? "bg-[#0D5C3A] text-white" : "bg-gray-200 text-gray-600"}`}>
                      1
                    </span>
                    <span>ইমেইল</span>
                  </div>
                  <span className="text-gray-300">──</span>
                  <div className={`flex items-center gap-1.5 ${forgotStep >= 2 ? "text-[#0D5C3A] font-bold" : "text-gray-400"}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${forgotStep >= 2 ? "bg-[#0D5C3A] text-white" : "bg-gray-200 text-gray-600"}`}>
                      2
                    </span>
                    <span>ওটিপি</span>
                  </div>
                  <span className="text-gray-300">──</span>
                  <div className={`flex items-center gap-1.5 ${forgotStep >= 3 ? "text-[#0D5C3A] font-bold" : "text-gray-400"}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${forgotStep >= 3 ? "bg-[#0D5C3A] text-white" : "bg-gray-200 text-gray-600"}`}>
                      3
                    </span>
                    <span>নতুন পাসওয়ার্ড</span>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Alert Messages */}
                {forgotError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccess && forgotStep !== 4 && (
                  <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 text-[#0D5C3A]" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                {/* STEP 1: Enter Email */}
                {forgotStep === 1 && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center text-[#0D5C3A] mb-2">
                        <Mail className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-gray-800">
                        আপনার নিবন্ধিত ইমেইল ঠিকানা দিন
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        আপনার অ্যাকাউন্টে যুক্ত ইমেইলে একটি ৬-সংখ্যার ওটিপি কোড পাঠানো হবে।
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        ইমেইল এড্রেস (Registered Email)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="আপনার ইমেইল (যেমন: adminehrjmadrasha@gmail.com)"
                          className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 rounded-lg font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
                    >
                      {forgotLoading ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin" />
                          ওটিপি পাঠানো হচ্ছে...
                        </>
                      ) : (
                        <>
                          ওটিপি পাঠান (Send OTP)
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP 2: Enter & Verify OTP */}
                {forgotStep === 2 && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center mb-3">
                      <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center text-[#C59B27] mb-2">
                        <KeyRound className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-gray-800">
                        ইমেইল চেক করে ওটিপি লিখুন
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        <strong className="text-[#0D5C3A] font-mono">{forgotEmail}</strong> ঠিকানায় পাঠানো ৬-সংখ্যার কোডটি প্রবেশ করান।
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span className="font-semibold text-gray-700">৬-সংখ্যার ওটিপি কোড:</span>
                        <span className="font-mono text-amber-700 font-semibold">
                          ⏳ মেয়াদ: {Math.floor(otpExpiryTimer / 60)}:{(otpExpiryTimer % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full text-center tracking-[12px] text-2xl font-bold font-mono py-2.5 border-2 border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-emerald-50/30"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading || forgotOtp.length !== 6}
                      className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 rounded-lg font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
                    >
                      {forgotLoading ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin" />
                          যাচাই করা হচ্ছে...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          ওটিপি যাচাই করুন (Verify OTP)
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep(1);
                          setForgotError(null);
                        }}
                        className="text-gray-500 hover:text-gray-800 underline"
                      >
                        ইমেইল পরিবর্তন করুন
                      </button>

                      <button
                        type="button"
                        disabled={resendTimer > 0 || forgotLoading}
                        onClick={() => handleSendOtp()}
                        className="text-[#0D5C3A] hover:underline font-semibold disabled:text-gray-400 disabled:no-underline"
                      >
                        {resendTimer > 0 ? `পুনরায় পাঠান (${resendTimer}s)` : "পুনরায় ওটিপি পাঠান"}
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Set New Password */}
                {forgotStep === 3 && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="text-center mb-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center text-[#0D5C3A] mb-2">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-gray-800">
                        নতুন পাসওয়ার্ড সেট করুন
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        নিরাপদ ও শক্তিশালী পাসওয়ার্ড প্রদান করুন (ন্যূনতম ৬ অক্ষর)।
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        নতুন গোপন পাসওয়ার্ড *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="নতুন পাসওয়ার্ড দিন"
                          className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        নতুন পাসওয়ার্ড নিশ্চিতকরণ (Confirm Password) *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading || !newPassword || !confirmPassword}
                      className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 rounded-lg font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
                    >
                      {forgotLoading ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin" />
                          সংরক্ষণ করা হচ্ছে...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          পাসওয়ার্ড পরিবর্তন করুন
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP 4: Reset Success */}
                {forgotStep === 4 && (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-600 shadow-md">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-emerald-900">
                        আলহামদুলিল্লাহ, পাসওয়ার্ড পরিবর্তন সফল হয়েছে!
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                        আপনার নতুন পাসওয়ার্ড ডাটাবেজে সক্রিয় হয়েছে। নিরাপত্তার স্বার্থে আপনার অ্যাকাউন্টের পূর্বের সকল সেশন বন্ধ করা হয়েছে।
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeForgotModal}
                      className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 rounded-lg font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow"
                    >
                      এখনই নতুন পাসওয়ার্ড দিয়ে লগইন করুন
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
