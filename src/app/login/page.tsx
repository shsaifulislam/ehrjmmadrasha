"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  Users,
  UserPlus,
  GraduationCap,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  ArrowRight,
  Sparkles,
  Phone,
  FileCheck,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"INSTITUTIONAL" | "GUARDIAN">("INSTITUTIONAL");

  // Tab 1: Institutional (Admin, Principal, Teacher) credentials
  const [instIdentifier, setInstIdentifier] = useState("");
  const [instPassword, setInstPassword] = useState("");
  const [instShowPassword, setInstShowPassword] = useState(false);
  const [instLoading, setInstLoading] = useState(false);
  const [instError, setInstError] = useState<string | null>(null);

  // Tab 2: Guardian/Student credentials & Mode (LOGIN vs REGISTER)
  const [guardianMode, setGuardianMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [guardIdentifier, setGuardIdentifier] = useState("");
  const [guardPassword, setGuardPassword] = useState("");
  const [guardShowPassword, setGuardShowPassword] = useState(false);
  const [guardLoading, setGuardLoading] = useState(false);
  const [guardError, setGuardError] = useState<string | null>(null);

  // Guardian/Student Registration Form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regRole, setRegRole] = useState<"GUARDIAN" | "STUDENT">("GUARDIAN");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Guardian Activation Help Modal
  const [activationHelpOpen, setActivationHelpOpen] = useState(false);

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

  // Auto-switch tab based on query params, redirect target, or pathname, and check active session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab")?.toLowerCase();
      const modeParam = params.get("mode")?.toLowerCase();
      const redirectParam = (params.get("redirect") || "").toLowerCase();
      const path = window.location.pathname.toLowerCase();

      if (
        tabParam === "guardian" ||
        tabParam === "portal" ||
        tabParam === "parent" ||
        tabParam === "student" ||
        path.includes("guardian") ||
        redirectParam.includes("portal") ||
        redirectParam.includes("guardian")
      ) {
        setActiveTab("GUARDIAN");
      } else if (
        tabParam === "admin" ||
        tabParam === "teacher" ||
        tabParam === "principal" ||
        tabParam === "institutional" ||
        path.includes("admin") ||
        path.includes("teacher") ||
        path.includes("principal") ||
        redirectParam.includes("admin") ||
        redirectParam.includes("teacher") ||
        redirectParam.includes("principal")
      ) {
        setActiveTab("INSTITUTIONAL");
      }

      if (tabParam === "register" || modeParam === "register" || modeParam === "signup") {
        setActiveTab("GUARDIAN");
        setGuardianMode("REGISTER");
      }

      // Check if user already has an active, valid session
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.authenticated && data?.user) {
            const targetUrl = getSafeRedirectUrl(window.location.search, data.user.role);
            window.location.href = targetUrl;
          }
        })
        .catch(() => {});
    }
  }, []);

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

  function getDefaultRouteForRole(role: string): string {
    switch (role) {
      case "ADMIN":
        return "/admin";
      case "PRINCIPAL":
        return "/principal";
      case "TEACHER":
        return "/teacher";
      case "GUARDIAN":
        return "/portal";
      default:
        return "/";
    }
  }

  function getSafeRedirectUrl(searchStr: string, userRole: string): string {
    try {
      const params = new URLSearchParams(searchStr);
      const redirect = params.get("redirect");
      const defaultRoute = getDefaultRouteForRole(userRole);
      if (!redirect) return defaultRoute;

      const decoded = decodeURIComponent(redirect).trim();
      if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.startsWith("/\\")) {
        return defaultRoute;
      }
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded) || decoded.includes(":") || decoded.includes("\0")) {
        return defaultRoute;
      }

      // Prevent self-redirect loops back to login
      if (decoded === "/login" || decoded.startsWith("/login?") || decoded.startsWith("/login/")) {
        return defaultRoute;
      }

      // Role boundary check
      if (userRole === "GUARDIAN") {
        if (decoded.startsWith("/admin") || decoded.startsWith("/teacher") || decoded.startsWith("/principal")) {
          return "/portal";
        }
      } else if (userRole === "TEACHER") {
        if (decoded.startsWith("/admin") || decoded.startsWith("/portal") || decoded.startsWith("/principal")) {
          return "/teacher";
        }
      }

      return decoded;
    } catch {
      return getDefaultRouteForRole(userRole);
    }
  }

  // Handle Institutional Login Submit
  const handleInstitutionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (instLoading) return;
    setInstLoading(true);
    setInstError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: instIdentifier,
          password: instPassword,
          panel: "INSTITUTIONAL",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setInstError(data.error || "ভুল ইমেইল বা পাসওয়ার্ড। পুনরায় চেষ্টা করুন।");
        setInstLoading(false);
        return;
      }

      const targetUrl = getSafeRedirectUrl(window.location.search, data.user.role);
      window.location.href = targetUrl;
    } catch {
      setInstError("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।");
      setInstLoading(false);
    }
  };

  // Handle Guardian/Student Login Submit
  const handleGuardianLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardLoading) return;
    setGuardLoading(true);
    setGuardError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: guardIdentifier,
          password: guardPassword,
          panel: "GUARDIAN",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setGuardError(data.error || "ভুল মোবাইল/ইমেইল অথবা পাসওয়ার্ড। অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।");
        setGuardLoading(false);
        return;
      }

      const targetUrl = getSafeRedirectUrl(window.location.search, data.user.role);
      window.location.href = targetUrl;
    } catch {
      setGuardError("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।");
      setGuardLoading(false);
    }
  };

  // Handle Self-Registration for Guardians & Students
  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regLoading) return;
    setRegLoading(true);
    setRegError(null);
    setRegSuccess(null);

    if (regPassword !== regConfirmPassword) {
      setRegError("পাসওয়ার্ড এবং পাসওয়ার্ড নিশ্চিতকরণ হুবহু মিলছে না।");
      setRegLoading(false);
      return;
    }

    if (regPassword.length < 6) {
      setRegError("পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।");
      setRegLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          role: regRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "অ্যাকাউন্ট নিবন্ধন করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।");
        setRegLoading(false);
        return;
      }

      setRegSuccess(data.message || "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! স্বয়ংক্রিয়ভাবে প্রবেশ করানো হচ্ছে...");
      setTimeout(() => {
        const targetUrl = getSafeRedirectUrl(window.location.search, data.user?.role || "GUARDIAN");
        window.location.href = targetUrl;
      }, 1000);
    } catch {
      setRegError("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।");
      setRegLoading(false);
    }
  };

  // Forgot Password: Step 1 - Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotEmail || forgotEmail.trim().length < 3) {
      setForgotError("অনুগ্রহ করে আপনার নিবন্ধিত ইমেইল অথবা মোবাইল নম্বর প্রদান করুন।");
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "ওটিপি পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
        setForgotLoading(false);
        return;
      }

      if (data.email) {
        setForgotEmail(data.email);
      }
      setForgotSuccess(data.message);
      setForgotStep(2);
      setResendTimer(60);
      setOtpExpiryTimer(600);
      setForgotLoading(false);
    } catch {
      setForgotError("সার্ভার ত্রুটি। কিছুক্ষণ পর আবার চেষ্টা করুন।");
      setForgotLoading(false);
    }
  };

  // Forgot Password: Step 2 - Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotError("অনুগ্রহ করে ৬ সংখ্যার সঠিক ওটিপি কোডটি লিখুন।");
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
        setForgotError(data.error || "ভুল বা মেয়াদোত্তীর্ণ ওটিপি কোড।");
        setForgotLoading(false);
        return;
      }

      setForgotResetToken(data.resetToken);
      setForgotStep(3);
      setForgotLoading(false);
    } catch {
      setForgotError("সার্ভার ত্রুটি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
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
      if (activeTab === "INSTITUTIONAL") {
        setInstIdentifier(forgotEmail);
      } else {
        setGuardIdentifier(forgotEmail);
      }
      setForgotLoading(false);
    } catch {
      setForgotError("সার্ভার ত্রুটি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
      setForgotLoading(false);
    }
  };

  const openForgotModal = (prefillEmail: string) => {
    setForgotEmail(prefillEmail.includes("@") ? prefillEmail : "");
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

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient subtle light glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/5 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
          
          {/* LEFT: Institutional Identity & Heritage Brand Area (5 Cols on LG) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#063321] via-[#0A4B2F] to-[#041F14] text-white p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b-2 lg:border-b-0 lg:border-r-2 border-[#D4AF37] order-2 lg:order-1">
            {/* Subtle Islamic Arabesque Ambient Accent */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

            {/* Top Identity Block */}
            <div className="relative z-10 space-y-5">
              {/* Calligraphic Bismillah */}
              <div className="text-center font-arabic text-amber-300 text-sm tracking-widest border-b border-amber-400/20 pb-2">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-[#D4AF37] p-0.5 shadow-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <Image
                    src="/images/logo.jpg"
                    alt={INSTITUTION_INFO.nameBn}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                <div>
                  <span className="font-arabic text-[#D4AF37] text-xs tracking-wider block">
                    الجامعة الإسلامية رحمة الله إليوت غنج
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-200 block">
                    পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি
                  </span>
                  <span className="inline-block mt-0.5 bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    স্থাপিত: ২০২১ ইং • কঠোরভাবে কোনো EIIN নেই
                  </span>
                </div>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black font-display text-white leading-tight">
                  {INSTITUTION_INFO.nameBn}
                </h1>
                <p className="text-xs text-emerald-100/90 mt-2 leading-relaxed font-light">
                  কওমি ও হাফিজিয়া মাদ্রাসা, লিল্লাহ বোর্ডিং ও এতিমখানা কমপ্লেক্স।
                  দ্বীনি শিক্ষা ও নৈতিক চরিত্র গঠনের নির্ভরযোগ্য দ্বীনি শিক্ষা প্রতিষ্ঠান।
                </p>
              </div>

              {/* Institutional Highlights */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-3 text-xs text-emerald-100 bg-white/5 border border-emerald-600/40 rounded-2xl px-3.5 py-2.5 backdrop-blur-sm">
                  <ShieldCheck className="w-4 h-4 text-amber-300 flex-shrink-0" />
                  <span>অনুমোদিত জিমেইল গেটকিপার সুরক্ষিত প্রশাসন</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-emerald-100 bg-white/5 border border-emerald-600/40 rounded-2xl px-3.5 py-2.5 backdrop-blur-sm">
                  <FileCheck className="w-4 h-4 text-amber-300 flex-shrink-0" />
                  <span>ভর্তি, উপস্থিতি, ফলাফল, সনদ ও হিসাব পর্যবেক্ষণ</span>
                </div>
              </div>

              {/* Real Campus Entrance Gate Snapshot */}
              <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/50 shadow-md aspect-[16/9]">
                <Image
                  src="/images/campus-entrance.jpg"
                  alt="মাদরাসা প্রবেশদ্বার ও সাইনবোর্ড"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute bottom-2 left-3 text-[10px] font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ক্যাম্পাস প্রবেশদ্বার ও সাইনবোর্ড
                </span>
              </div>
            </div>

            {/* Bottom Quick Trust Info */}
            <div className="relative z-10 pt-6 mt-4 border-t border-emerald-800/80 text-xs text-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between font-medium">
                <span>স্থাপিত: ২০২১ ইং (ESTD 2021)</span>
                <span>দাউদকান্দি, কুমিল্লা</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-amber-200/90 pt-1">
                <Link href="/results" className="hover:text-white flex items-center gap-1 transition">
                  <Search className="w-3.5 h-3.5 text-[#D4AF37]" />
                  পাবলিক রেজাল্ট যাচাই
                </Link>
                <Link href="/contact" className="hover:text-white transition">
                  জরুরি হেল্পলাইন
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Login & Registration Card (7 Cols on LG) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white order-1 lg:order-2">
            
            {/* Header */}
            <div className="mb-6">
              <span className="text-[11px] font-bold text-[#0D5C3A] bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full uppercase tracking-wider inline-block mb-2">
                মাদরাসা অনলাইন প্রবেশদ্বার
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {activeTab === "INSTITUTIONAL"
                  ? "প্রশাসন ও শিক্ষক প্রবেশদ্বার"
                  : guardianMode === "LOGIN"
                  ? "অভিভাবক পোর্টাল (Guardian Portal)"
                  : "নতুন অভিভাবক নিবন্ধন"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {activeTab === "INSTITUTIONAL"
                  ? "মাদরাসার মুহতামিম, শিক্ষক ও কর্মকর্তাদের সংরক্ষিত লগইন"
                  : guardianMode === "LOGIN"
                  ? "সন্তানের সার্বিক তথ্য, ফি ও ফলাফলের জন্য মোবাইল অথবা ইমেইল দিয়ে প্রবেশ করুন"
                  : "সন্তানের ভর্তির আবেদন ও সেবার জন্য অভিভাবক অ্যাকাউন্ট খুলুন"}
              </p>
            </div>

            {/* Clear Role Separation Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6 border border-slate-200">
              <button
                type="button"
                id="tab-institutional"
                onClick={() => setActiveTab("INSTITUTIONAL")}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                  activeTab === "INSTITUTIONAL"
                    ? "bg-[#0D5C3A] text-white shadow-md shadow-emerald-950/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                <UserCheck className="w-4 h-4 text-amber-300" />
                <span>প্রশাসন ও শিক্ষক</span>
              </button>

              <button
                type="button"
                id="tab-guardian"
                onClick={() => setActiveTab("GUARDIAN")}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                  activeTab === "GUARDIAN"
                    ? "bg-[#0D5C3A] text-white shadow-md shadow-emerald-950/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                <Users className="w-4 h-4 text-amber-300" />
                <span>অভিভাবক পোর্টাল</span>
              </button>
            </div>

            {/* TAB 1: ADMINISTRATION & TEACHER LOGIN */}
            {/* TAB 1: ADMINISTRATION & TEACHER LOGIN */}
            {activeTab === "INSTITUTIONAL" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Authorized Gmail Gatekeeper Security Badge */}
                <div className="bg-gradient-to-r from-emerald-950 via-[#063922] to-emerald-950 border border-amber-400/50 rounded-2xl p-4 text-xs text-white shadow-md relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-2 mb-1 text-amber-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>অনুমোদিত জিমেইল গেটকিপার (Authorized Gmail Guard)</span>
                  </div>
                  <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                    শুধুমাত্র এডমিন প্যানেল থেকে অনুমোদিত প্রধান শিক্ষক, উস্তাদ ও কর্মকর্তাদের অফিশিয়াল জিমেইল (Gmail) বা ইউজারনেম দিয়ে প্রবেশাধিকার সংরক্ষিত।
                  </p>
                  
                  {/* Quick autofill helper chip for Admin testing */}
                  <div className="mt-2.5 pt-2 border-t border-emerald-800/60 flex items-center gap-2">
                    <span className="text-[10px] text-emerald-300 font-medium">কুইক টেস্ট:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setInstIdentifier("adminehrjmadrasha@gmail.com");
                        setInstPassword("Saiful018228222@@##");
                      }}
                      className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>এডমিন ক্রিডেনশিয়াল পূরণ করুন</span>
                    </button>
                  </div>
                </div>

                {instError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{instError}</span>
                  </div>
                )}

                <form
                  onSubmit={handleInstitutionalLogin}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      অনুমোদিত জিমেইল (Gmail) অথবা ইউজারনেম *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        id="inst-identifier"
                        name="identifier"
                        required
                        value={instIdentifier}
                        onChange={(e) => setInstIdentifier(e.target.value)}
                        placeholder="যেমন: adminehrjmadrasha@gmail.com অথবা অনুমোদিত Gmail"
                        className="w-full pl-10 pr-3.5 py-3 text-xs rounded-xl border border-slate-300 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/20 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700">
                        পাসওয়ার্ড *
                      </label>
                      <button
                        type="button"
                        onClick={() => openForgotModal(instIdentifier)}
                        className="text-xs text-[#0D5C3A] hover:underline font-bold cursor-pointer"
                      >
                        পাসওয়ার্ড ভুলে গেছেন?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={instShowPassword ? "text" : "password"}
                        id="inst-password"
                        name="password"
                        required
                        value={instPassword}
                        onChange={(e) => setInstPassword(e.target.value)}
                        placeholder="আপনার পাসওয়ার্ড লিখুন"
                        className="w-full pl-10 pr-10 py-3 text-xs rounded-xl border border-slate-300 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/20 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setInstShowPassword(!instShowPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={instShowPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                      >
                        {instShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="inst-submit-btn"
                    disabled={instLoading}
                    className="w-full bg-[#0D5C3A] hover:bg-[#063321] text-white py-3.5 rounded-xl text-xs font-black transition shadow-lg shadow-emerald-950/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-98"
                  >
                    {instLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>যাচাই করা হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-amber-300" />
                        <span>প্রশাসন ও শিক্ষক হিসেবে প্রবেশ করুন</span>
                      </>
                    )}
                  </button>

                  </form>
                </div>
            )}

            {/* TAB 2: GUARDIAN & STUDENT PORTAL & REGISTRATION */}
            {activeTab === "GUARDIAN" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Sub-Tabs: Login vs Register Toggle */}
                <div className="flex items-center gap-2 p-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setGuardianMode("LOGIN");
                      setGuardError(null);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-center transition cursor-pointer ${
                      guardianMode === "LOGIN"
                        ? "bg-[#0D5C3A] text-white shadow-sm"
                        : "text-slate-700 hover:text-[#0D5C3A]"
                    }`}
                  >
                    লগইন করুন (Sign In)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGuardianMode("REGISTER");
                      setRegError(null);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      guardianMode === "REGISTER"
                        ? "bg-[#0D5C3A] text-white shadow-sm"
                        : "text-slate-700 hover:text-[#0D5C3A]"
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                    <span>নতুন অ্যাকাউন্ট খুলুন (Sign Up)</span>
                  </button>
                </div>

                {/* MODE A: GUARDIAN PORTAL LOGIN */}
                {guardianMode === "LOGIN" && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 text-xs text-emerald-950 leading-relaxed">
                      মাদরাসার সম্মানিত অভিভাবকগণ সন্তানের পরীক্ষার ফলাফল, ফি পরিশোধ, উপস্থিতি ও যোগাযোগ রক্ষা করতে তাদের নিবন্ধিত মোবাইল নম্বর অথবা ইমেইল দিয়ে প্রবেশ করুন।
                    </div>

                    {guardError && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span>{guardError}</span>
                      </div>
                    )}

                    <form
                      onSubmit={handleGuardianLogin}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          ইমেইল অথবা মোবাইল নম্বর *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            id="guard-identifier"
                            name="identifier"
                            required
                            value={guardIdentifier}
                            onChange={(e) => setGuardIdentifier(e.target.value)}
                            placeholder="যেমন: 018XXXXXXXX অথবা guardian@email.com"
                            className="w-full pl-10 pr-3.5 py-3 text-xs rounded-xl border border-slate-300 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/20 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-700">
                            পাসওয়ার্ড *
                          </label>
                          <button
                            type="button"
                            onClick={() => openForgotModal(guardIdentifier)}
                            className="text-xs text-[#0D5C3A] hover:underline font-bold cursor-pointer"
                          >
                            পাসওয়ার্ড মনে নেই?
                          </button>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            type={guardShowPassword ? "text" : "password"}
                            id="guard-password"
                            name="password"
                            required
                            value={guardPassword}
                            onChange={(e) => setGuardPassword(e.target.value)}
                            placeholder="আপনার অ্যাকাউন্টের পাসওয়ার্ড"
                            className="w-full pl-10 pr-10 py-3 text-xs rounded-xl border border-slate-300 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/20 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setGuardShowPassword(!guardShowPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            title={guardShowPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                          >
                            {guardShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        id="guard-submit-btn"
                        disabled={guardLoading}
                        className="w-full bg-[#0D5C3A] hover:bg-[#063321] text-white py-3.5 rounded-xl text-xs font-black transition shadow-lg shadow-emerald-950/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-98"
                      >
                        {guardLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>পোর্টাল সংযুক্ত হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4 text-amber-300" />
                            <span>পোর্টালে প্রবেশ করুন</span>
                          </>
                        )}
                      </button>
                    </form>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600">
                      কোনো অ্যাকাউন্ট নেই?{" "}
                      <button
                        type="button"
                        onClick={() => setGuardianMode("REGISTER")}
                        className="text-[#0D5C3A] font-bold hover:underline cursor-pointer"
                      >
                        নতুন অ্যাকাউন্ট খুলতে এখানে ক্লিক করুন
                      </button>
                    </div>

                    {/* Account Activation & Public Verification Helper */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setActivationHelpOpen(true)}
                        className="text-slate-600 hover:text-[#0D5C3A] flex items-center gap-1.5 font-bold transition cursor-pointer"
                      >
                        <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
                        <span>অ্যাকাউন্ট চালু বা সহায়তার নির্দেশিকা</span>
                      </button>

                      <Link
                        href="/results"
                        className="text-[#0D5C3A] hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>পাসওয়ার্ড ছাড়া ফলাফল খুঁজুন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* MODE B: GUARDIAN SELF-REGISTRATION */}
                {guardianMode === "REGISTER" && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 leading-relaxed">
                      <span className="font-bold block text-[#0D5C3A] mb-0.5">
                        অভিভাবক অ্যাকাউন্ট নিবন্ধন:
                      </span>
                      আপনার সঠিক মোবাইল নম্বর ও জিমেইল দিয়ে অ্যাকাউন্ট খুলুন। সফল নিবন্ধনের পর আপনি সন্তানের ভর্তির আবেদন, অগ্রগতি ও ফি সংক্রান্ত সেবা গ্রহণ করতে পারবেন।
                    </div>

                    {regError && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span>{regError}</span>
                      </div>
                    )}

                    {regSuccess && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{regSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleRegistrationSubmit} className="space-y-3.5">
                      {/* Institutional Role Notice */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#0D5C3A]" />
                          <span className="font-bold">অ্যাকাউন্টের ধরন:</span>
                        </div>
                        <span className="bg-emerald-100 text-[#0D5C3A] font-bold px-2.5 py-0.5 rounded-md text-[11px]">
                          অভিভাবক (Guardian)
                        </span>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          পূর্ণ নাম (বাংলা বা ইংরেজিতে) *
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="যেমন: মোহাম্মদ আব্দুল্লাহ"
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/20 transition"
                        />
                      </div>

                      {/* Phone & Email Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            সক্রিয় মোবাইল নম্বর *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Phone className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type="tel"
                              required
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value)}
                              placeholder="01XXXXXXXXX"
                              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/20 transition font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            ইমেইল (Gmail) ঠিকানা *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Mail className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type="email"
                              required
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="example@gmail.com"
                              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/20 transition"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Password & Confirm Password Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type={regShowPassword ? "text" : "password"}
                              required
                              minLength={6}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="পাসওয়ার্ড লিখুন"
                              className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-300 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/20 transition"
                            />
                            <button
                              type="button"
                              onClick={() => setRegShowPassword(!regShowPassword)}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {regShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            পাসওয়ার্ড নিশ্চিত করুন *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type={regShowPassword ? "text" : "password"}
                              required
                              minLength={6}
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/20 transition"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={regLoading}
                        className="w-full bg-[#0D5C3A] hover:bg-[#063321] text-white py-3.5 rounded-xl text-xs font-black transition shadow-lg shadow-emerald-950/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-98 mt-2"
                      >
                        {regLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 text-amber-300" />
                            <span>অ্যাকাউন্ট তৈরি ও সরাসরি প্রবেশ করুন</span>
                          </>
                        )}
                      </button>
                    </form>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600">
                      ইতিমধ্যে আপনার অ্যাকাউন্ট রয়েছে?{" "}
                      <button
                        type="button"
                        onClick={() => setGuardianMode("LOGIN")}
                        className="text-[#0D5C3A] font-bold hover:underline cursor-pointer"
                      >
                        লগইন করতে এখানে ক্লিক করুন
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Safety Note */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>নিরাপদ ও নির্ভরযোগ্য। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা তথ্য সেবা।</span>
            </div>
          </div>
        </div>
      </main>

      {/* GUARDIAN ACCOUNT ACTIVATION HELP MODAL */}
      {activationHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-[#083B25] font-bold text-sm">
                <Users className="w-5 h-5 text-[#C59B27]" />
                <span>অভিভাবক অ্যাকাউন্ট চালু করার নির্দেশিকা</span>
              </div>
              <button
                onClick={() => setActivationHelpOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-3 leading-relaxed">
              <p>
                ১. ভর্তির সময়ে মাদরাসা অফিসে নিবন্ধিত অভিভাবকের মোবাইল নম্বরই আপনার প্রাতিষ্ঠানিক ইউজারনেম।
              </p>
              <p>
                ২. প্রথমবার লগইন করতে অথবা পাসওয়ার্ড সেট করতে মাদরাসা প্রশাসনিক দপ্তর বা শ্রেণির উস্তাদের সাথে যোগাযোগ করুন।
              </p>
              <p>
                ৩. এক অভিভাবকের অধীনে একাধিক সন্তান অধ্যয়নরত থাকলে, পোর্টালে লগইন করার পর সন্তান পরিবর্তন (Child Switcher) অপশন থেকে সকলের তথ্য এক ক্লিকেই দেখতে পারবেন।
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[#083B25]">
                <span className="font-semibold block mb-1">অফিসিয়াল হেল্পলাইন:</span>
                <span className="font-mono font-bold text-xs">{INSTITUTION_INFO.primaryPhone}</span> | 
                <span className="font-mono text-xs ml-1">{INSTITUTION_INFO.email}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActivationHelpOpen(false)}
              className="w-full bg-[#0D5C3A] text-white py-2 rounded-lg text-xs font-semibold hover:bg-[#083B25] transition"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD / OTP RECOVERY MODAL */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-[#083B25] font-bold text-sm">
                <KeyRound className="w-4 h-4 text-[#C59B27]" />
                <span>পাসওয়ার্ড রিসেট ও পুনরুদ্ধার</span>
              </div>
              <button
                onClick={closeForgotModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Error & Success Badges */}
            {forgotError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}
            {forgotSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* Step 1: Send OTP */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-xs text-gray-500">
                  আপনার নিবন্ধিত ইমেইল অথবা মোবাইল নম্বর লিখুন। অ্যাকাউন্টের সাথে যুক্ত ইমেইল ঠিকানায় ৬-সংখ্যার সুরক্ষিত ওটিপি কোড পাঠানো হবে।
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    নিবন্ধিত ইমেইল অথবা মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="যেমন: 018XXXXXXXX অথবা email@example.com"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#0D5C3A] hover:bg-[#083B25] text-white py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  {forgotLoading ? "কোড পাঠানো হচ্ছে..." : "ওটিপি (OTP) পাঠান"}
                </button>
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-800">{forgotEmail}</span> ঠিকানায় পাঠানো ৬-সংখ্যার কোডটি লিখুন।
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    ৬-সংখ্যার ওটিপি কোড *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-center tracking-widest font-mono text-base font-bold outline-none focus:border-[#0D5C3A]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#0D5C3A] hover:bg-[#083B25] text-white py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  {forgotLoading ? "যাচাই করা হচ্ছে..." : "ওটিপি যাচাই করুন"}
                </button>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>মেয়াদ: {Math.floor(otpExpiryTimer / 60)}:{(otpExpiryTimer % 60).toString().padStart(2, "0")}</span>
                  {resendTimer > 0 ? (
                    <span>পুনরায় পাঠানো যাবে ({resendTimer}s)</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="text-[#0D5C3A] font-bold hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      আবার পাঠান
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-gray-500">
                  আপনার অ্যাকাউন্টের জন্য একটি শক্তিশালী নতুন পাসওয়ার্ড তৈরি করুন।
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    নতুন পাসওয়ার্ড *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="ন্যূনতম ৬ অক্ষর"
                      className="w-full p-2.5 pr-10 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    পাসওয়ার্ড নিশ্চিত করুন *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="হুবহু একই পাসওয়ার্ড লিখুন"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#0D5C3A] hover:bg-[#083B25] text-white py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  {forgotLoading ? "পরিবর্তন করা হচ্ছে..." : "নতুন পাসওয়ার্ড সংরক্ষণ করুন"}
                </button>
              </form>
            )}

            {/* Step 4: Success Confirmation */}
            {forgotStep === 4 && (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-[#083B25]">পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!</h4>
                <p className="text-xs text-gray-500">
                  এখন আপনার নতুন পাসওয়ার্ড ব্যবহার করে সরাসরি লগইন করুন।
                </p>
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="w-full bg-[#0D5C3A] text-white py-2.5 rounded-lg text-xs font-bold hover:bg-[#083B25] transition"
                >
                  লগইনে ফিরে যান
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
