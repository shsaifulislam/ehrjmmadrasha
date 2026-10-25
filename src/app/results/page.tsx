"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeaderBanner from "@/components/PageHeaderBanner";
import {
  Search,
  Award,
  CheckCircle2,
  AlertCircle,
  Printer,
  QrCode,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
  Sparkles,
  User,
  Calendar,
  BookOpen,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function ResultsPage() {
  const [searchMode, setSearchMode] = useState<"ROLL" | "CODE">("ROLL");

  // Roll search state
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [studentResult, setStudentResult] = useState<any | null>(null);
  const [searchError, setSearchError] = useState("");

  // Code verify state
  const [verificationCodeInput, setVerificationCodeInput] = useState("");

  useEffect(() => {
    fetch("/api/academic/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.classes) {
          setClasses(data.classes);
          if (data.classes.length > 0) setSelectedClassId(data.classes[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setSearchError("");
    setStudentResult(null);

    try {
      const res = await fetch("/api/students/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          rollNumber: Number(rollNumber),
        }),
      });

      const data = await res.json();
      if (res.ok && data.student) {
        setStudentResult(data.student);
      } else {
        setSearchError(data.error || "প্রদত্ত জামাত ও রোল নম্বরে কোনো তথ্য পাওয়া যায়নি।");
      }
    } catch {
      setSearchError("ফলাফল অনুসন্ধানে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setSearching(false);
    }
  };

  const handleCodeVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCodeInput.trim()) return;
    window.location.href = `/verify/result/${encodeURIComponent(
      verificationCodeInput.trim().toUpperCase()
    )}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      {/* 1. OFFICIAL PAGE HEADER BANNER WITH BREADCRUMB */}
      <PageHeaderBanner
        title="শিক্ষার্থীর পরীক্ষার ফলাফল ও মার্কশিট"
        subtitle="কোনো পাসওয়ার্ডের প্রয়োজন নেই। কেবল জামাত ও রোল নম্বর অথবা মুদ্রিত রেজাল্ট কোড দিয়ে তাৎক্ষণিক ফলাফল ও ডিজিটাল মার্কশিট দেখুন"
        badge="পরীক্ষা নিয়ন্ত্রণ দফতর • শিক্ষাবর্ষ ২০২৬"
        breadcrumbs={[{ label: "ফলাফল ও মার্কশিট" }]}
      />

      {/* 2. SEARCH & RESULT WRAPPER */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1 w-full">
        {/* OFFICIAL EXAMS, ROUTINE & RESULTS BANNER */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-xl bg-emerald-950 group print:hidden">
          <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full">
            <Image
              src="/images/banners/exams-routine-results-banner.png"
              alt="পরীক্ষা, রুটিন ও ফলাফল | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
              fill
              className="object-cover group-hover:scale-[1.01] transition duration-500"
              priority
            />
          </div>
          <div className="p-4 bg-gradient-to-r from-[#041F14] via-[#063321] to-[#0A482D] text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-[#D4AF37]/40">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="font-bold text-amber-300 text-sm">
                পরীক্ষা, রুটিন ও ফলাফল • শিক্ষার্থীদের একাডেমিক অগ্রযাত্রার নির্ভরযোগ্য পোর্টাল
              </span>
              <p className="text-emerald-100/90 text-xs">
                সুশৃঙ্খল মূল্যায়ন, নিয়মিত পরীক্ষা ও অনলাইনে তাৎক্ষণিক ফলাফল এবং অফিসিয়াল মার্কশিট যাচাই
              </p>
            </div>
            <Link
              href="/calendar"
              className="btn-gold px-4 py-2 rounded-xl text-slate-950 font-bold text-xs flex-shrink-0 shadow hover:scale-105 transition"
            >
              পরীক্ষার রুটিন দেখুন
            </Link>
          </div>
        </div>

        {/* Toggle Mode */}
        <div className="flex justify-center print:hidden">
          <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold shadow-inner">
            <button
              onClick={() => setSearchMode("ROLL")}
              className={`px-5 py-2.5 rounded-xl transition flex items-center gap-2 ${
                searchMode === "ROLL"
                  ? "bg-white text-[#0D5C3A] shadow-md font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>জামাত ও রোল নম্বর দিয়ে অনুসন্ধান</span>
            </button>
            <button
              onClick={() => setSearchMode("CODE")}
              className={`px-5 py-2.5 rounded-xl transition flex items-center gap-2 ${
                searchMode === "CODE"
                  ? "bg-white text-[#0D5C3A] shadow-md font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>ভেরিফিকেশন কোড দিয়ে যাচাই</span>
            </button>
          </div>
        </div>

        {/* 1. ROLL SEARCH FORM */}
        {searchMode === "ROLL" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm print:hidden space-y-5">
            <div>
              <span className="text-[11px] font-extrabold text-[#0D5C3A] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                রোল অনুসন্ধান পোর্টাল
              </span>
              <h3 className="text-lg font-bold font-display text-slate-900 mt-1">
                শিক্ষার্থীর জামাত ও ক্লাস রোল নম্বর লিখুন
              </h3>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    জামাত / শ্রেণি নির্বাচন করুন *
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-white font-medium"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.nameBn} ({cls.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ক্লাস রোল নম্বর লিখুন *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="যেমন: ১ বা ১০"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={searching}
                className="btn-gold w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <Search className="w-4 h-4" />
                <span>{searching ? "ফলাফল অনুসন্ধান হচ্ছে..." : "ফলাফল অনুসন্ধান করুন"}</span>
              </button>
            </form>

            {searchError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="font-semibold">{searchError}</span>
              </div>
            )}
          </div>
        )}

        {/* 2. CODE VERIFICATION FORM */}
        {searchMode === "CODE" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 print:hidden">
            <div>
              <span className="text-[11px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                ডিজিটাল সত্যতা যাচাই
              </span>
              <h3 className="text-lg font-bold font-display text-slate-900 mt-1">
                মার্কশিট ভেরিফিকেশন কোড
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                মুদ্রিত মার্কশিট বা সনদের নিচে থাকা কোডটি লিখুন (যেমন: EHRJ-RES-2026-XXXX)
              </p>
            </div>

            <form onSubmit={handleCodeVerify} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="যেমন: EHRJ-RES-2026-AB12CD34"
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-emerald-300 rounded-2xl text-sm font-mono font-bold uppercase tracking-wider outline-none focus:border-[#0D5C3A]"
                />
              </div>

              <button
                type="submit"
                className="btn-emerald w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>সত্যতা ও ডিজিটাল মার্কশিট যাচাই করুন</span>
              </button>
            </form>
          </div>
        )}

        {/* Result & Marksheet Card */}
        {studentResult && (
          <div className="bg-white rounded-3xl border-2 border-[#D4AF37] p-6 sm:p-10 shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-3 py-0.5 rounded-full uppercase tracking-wider">
                  অফিসিয়াল প্রাতিষ্ঠানিক মার্কশিট
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">{studentResult.fullNameBn}</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono">
                  <span>আইডি: <strong>{studentResult.studentIdNumber}</strong></span>
                  <span>•</span>
                  <span>রোল: <strong>{studentResult.rollNumber ?? studentResult.enrollment?.rollNumber ?? "১"}</strong></span>
                  <span>•</span>
                  <span>জামাত: <strong>{studentResult.className ?? studentResult.enrollment?.className ?? "নূরানী ও নাযেরা বিভাগ"}</strong></span>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="btn-emerald px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto print:hidden shadow"
              >
                <Printer className="w-4 h-4 text-[#D4AF37]" />
                <span>মার্কশিট প্রিন্ট / PDF</span>
              </button>
            </div>

            {/* Attendance & Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">উপস্থিতির হার</span>
                <span className="font-bold text-base text-[#0D5C3A] font-mono">
                  {studentResult.attendanceStats?.percentage !== null && studentResult.attendanceStats?.percentage !== undefined
                    ? `${studentResult.attendanceStats.percentage}%`
                    : "অপেক্ষমাণ"}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">মোট কার্যদিবস</span>
                <span className="font-bold text-base text-slate-800 font-mono">
                  {studentResult.attendanceStats?.total !== undefined && studentResult.attendanceStats.total > 0
                    ? `${studentResult.attendanceStats.total} দিন`
                    : "—"}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">আবাসিক মর্যাদা</span>
                <span className="font-bold text-xs text-slate-800">
                  {studentResult.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">বর্তমান অবস্থা</span>
                <span className="font-bold text-xs text-emerald-700">নিয়মিত ছাত্র</span>
              </div>
            </div>

            {/* Exams list */}
            {(studentResult.exams?.length > 0 || studentResult.results?.length > 0) ? (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
                  অনুমোদিত পরীক্ষার ফলাফল বিবরণী
                </h3>
                <div className="space-y-3">
                  {(studentResult.exams || studentResult.results || []).map((ex: any, idx: number) => {
                    const isPassed = ex.isPassed !== undefined ? ex.isPassed : true;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-sm text-[#0D5C3A] block">
                            {ex.examTitle || ex.examName || "সাময়িক পরীক্ষা"}
                          </span>
                          <span className="text-xs text-slate-600">
                            প্রাপ্ত মোট নম্বর: <strong className="font-mono text-slate-900">{ex.totalMarks}</strong> | গ্রেড: <strong className="text-emerald-700">{ex.grade || "নির্ধারিত নয়"}</strong>
                            {ex.rankInClass && (
                              <span className="ml-2">| মেধা স্থান: <strong className="font-mono">{ex.rankInClass}</strong></span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${
                              isPassed
                                ? "text-emerald-800 bg-emerald-100"
                                : "text-red-800 bg-red-100"
                            }`}
                          >
                            {isPassed ? "উত্তীর্ণ (PASSED)" : "অকৃতকার্য (FAILED)"}
                          </span>
                          {ex.verificationCode && (
                            <Link
                              href={`/verify/result/${encodeURIComponent(ex.verificationCode)}`}
                              target="_blank"
                              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm print:hidden"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-[#0D5C3A]" />
                              যাচাই
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                চলতি সেশনের চূড়ান্ত পরীক্ষার ফলাফল প্রক্রিয়াকরণ চলছে।
              </div>
            )}

            {/* Official Institutional Watermark Footer */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-3">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{INSTITUTION_INFO.nameBn} পরীক্ষা নিয়ন্ত্রক দফতর</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                ডিজিটাল রেকর্ড স্ট্যাটাস: <strong className="text-emerald-700">যাচাইকৃত (ACTIVE)</strong>
              </span>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
