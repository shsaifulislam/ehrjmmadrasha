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

  // Tab 1: Staff / Admin Login state
  const [email, setEmail] = useState("adminehrjmadrasha@gmail.com");
  const [password, setPassword] = useState("AdminEhrj@2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 rounded-md font-bold text-sm transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
                >
                  {loginLoading ? "যাচাই করা হচ্ছে..." : "লগইন করুন (Login)"}
                  {!loginLoading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded text-xs text-emerald-950 space-y-1 mt-4">
                  <p className="font-semibold text-[#0D5C3A]">ডিফল্ট লগইন ক্রেডেনশিয়ালস:</p>
                  <p>• অ্যাডমিন: <span className="font-mono font-bold">adminehrjmadrasha@gmail.com</span> / <span className="font-mono">AdminEhrj@2026!</span></p>
                  <p>• উস্তাদ: <span className="font-mono font-bold">teacherehrjmadrasha@gmail.com</span> / <span className="font-mono">Teacher@2026!</span></p>
                </div>
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
      </main>

      <Footer />
    </div>
  );
}
