"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  QrCode,
  Sparkles,
  ArrowRight,
  Award,
  Receipt,
  GraduationCap,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function UnifiedPublicVerificationPage() {
  const [activeTab, setActiveTab] = useState<"SMART" | "CERTIFICATE" | "RESULT" | "RECEIPT" | "EMPLOYEE">("SMART");
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [certResult, setCertResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputCode.trim().toUpperCase();
    if (!trimmed) return;

    setErrorMsg("");
    setCertResult(null);

    // 1. Smart routing check based on active tab or prefix detection
    if (activeTab === "RESULT" || (activeTab === "SMART" && trimmed.startsWith("EHRJ-RES-"))) {
      window.location.href = `/verify/result/${encodeURIComponent(trimmed)}`;
      return;
    }

    if (
      activeTab === "RECEIPT" ||
      (activeTab === "SMART" && (trimmed.startsWith("EHRJ-RCP-") || trimmed.startsWith("QR-") || trimmed.startsWith("REQ-")))
    ) {
      window.location.href = `/verify/receipt/${encodeURIComponent(trimmed)}`;
      return;
    }

    if (
      activeTab === "EMPLOYEE" ||
      (activeTab === "SMART" && (trimmed.startsWith("EHRJ-EMP-") || trimmed.startsWith("EHRJ-TCH-")))
    ) {
      window.location.href = `/verify/employee/${encodeURIComponent(trimmed)}`;
      return;
    }

    // 2. Otherwise verify certificate / document
    setLoading(true);
    try {
      const res = await fetch(`/api/verify/document/${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (res.ok && data.success && data.document) {
        setCertResult(data.document);
      } else {
        setErrorMsg(data.error || "প্রদত্ত কোড বা নম্বরে কোনো সনদপত্র পাওয়া যায়নি। কোডটি পুনরায় যাচাই করুন।");
      }
    } catch {
      setErrorMsg("যাচাইকরণ প্রক্রিয়া সম্পন্ন করতে সমস্যা হয়েছে। সংযোগ পরীক্ষা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="page-hero py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden print:hidden">
        <div className="absolute inset-0 page-hero-grid opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 bg-black/40 border border-[#D4AF37]/50 px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-amber-200 text-xs font-semibold">
              পাবলিক ডিজিটাল ভেরিফিকেশন গেটওয়ে
            </span>
          </div>

          <div className="font-arabic text-[#D4AF37] text-2xl sm:text-3xl tracking-widest drop-shadow-sm">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display text-white tracking-tight leading-tight">
            প্রাতিষ্ঠানিক রেকর্ড ও সনদপত্র{" "}
            <span className="gold-gradient-text inline-block">
              সত্যতা যাচাই
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-emerald-100/90 max-w-2xl mx-auto font-light leading-relaxed">
            মাদরাসা কর্তৃক ইস্যুকৃত সকল সনদ, প্রশংসাপত্র, মার্কশিট, পেমেন্ট রসিদ ও কর্মী পরিচয়পত্রের ডিজিটাল সত্যতা কিউআর কোড বা ট্র্যাকিং নম্বরে যাচাই করুন।
          </p>
        </div>
      </section>

      {/* 2. MAIN VERIFICATION SECTION */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8 flex-1 w-full">
        {/* Verification Mode Selector */}
        <div className="flex flex-wrap justify-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => {
              setActiveTab("SMART");
              setCertResult(null);
              setErrorMsg("");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              activeTab === "SMART"
                ? "bg-[#0D5C3A] text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>স্মার্ট স্বয়ংক্রিয় অনুসন্ধান</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("CERTIFICATE");
              setCertResult(null);
              setErrorMsg("");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              activeTab === "CERTIFICATE"
                ? "bg-[#0D5C3A] text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>সনদপত্র / প্রত্যয়ন</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("RESULT");
              setCertResult(null);
              setErrorMsg("");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              activeTab === "RESULT"
                ? "bg-[#0D5C3A] text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>ফলাফল / মার্কশিট</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("RECEIPT");
              setCertResult(null);
              setErrorMsg("");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              activeTab === "RECEIPT"
                ? "bg-[#0D5C3A] text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>পেমেন্ট রসিদ</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("EMPLOYEE");
              setCertResult(null);
              setErrorMsg("");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              activeTab === "EMPLOYEE"
                ? "bg-[#0D5C3A] text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>শিক্ষক ও কর্মী আইডি</span>
          </button>
        </div>

        {/* Verification Form Card */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm print:hidden space-y-5">
          <div>
            <span className="text-[11px] font-extrabold text-[#0D5C3A] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              {activeTab === "SMART"
                ? "সর্বজনীন সত্যতা যাচাই"
                : activeTab === "CERTIFICATE"
                ? "সনদ ও প্রত্যয়নপত্র যাচাই"
                : activeTab === "RESULT"
                ? "পরীক্ষার ফলাফল কোড যাচাই"
                : activeTab === "RECEIPT"
                ? "অফিশিয়াল রসিদ যাচাই"
                : "কর্মকর্তা পরিচয়পত্র যাচাই"}
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              {activeTab === "SMART"
                ? "যেকোনো সনদ, মার্কশিট বা রসিদ কোড লিখুন"
                : activeTab === "CERTIFICATE"
                ? "সনদপত্র নম্বর বা ভেরিফিকেশন কোড লিখুন"
                : activeTab === "RESULT"
                ? "মার্কশিট ভেরিফিকেশন কোড লিখুন (যেমন: EHRJ-RES-...)"
                : activeTab === "RECEIPT"
                ? "রসিদ ট্র্যাকিং কোড লিখুন (যেমন: EHRJ-RCP-...)"
                : "কর্মী বা শিক্ষক আইডি নম্বর লিখুন (যেমন: EHRJ-TCH-...)"}
            </h2>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <input
                type="text"
                required
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder={
                  activeTab === "RESULT"
                    ? "যেমন: EHRJ-RES-2026-AB739D16"
                    : activeTab === "RECEIPT"
                    ? "যেমন: EHRJ-RCP-1790452316556-9976KK"
                    : activeTab === "EMPLOYEE"
                    ? "যেমন: EHRJ-TCH-2026-0009"
                    : "যেমন: EHRJ-VER-2026-00046 অথবা EHRJ-RES-2026-AB739D16"
                }
                className="w-full px-4 py-3.5 border-2 border-emerald-200 rounded-2xl text-sm font-mono font-bold uppercase tracking-wider outline-none focus:border-[#0D5C3A] bg-slate-50/50"
              />
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-2.5">
                <span>দ্রুত যাচাই নমুনা:</span>
                <button
                  type="button"
                  onClick={() => setInputCode("EHRJ-VER-2026-00046")}
                  className="font-mono text-[#0D5C3A] font-bold underline hover:text-emerald-800"
                >
                  সনদ (EHRJ-VER-2026-00046)
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setInputCode("EHRJ-RES-2026-AB739D16")}
                  className="font-mono text-[#0D5C3A] font-bold underline hover:text-emerald-800"
                >
                  ফলাফল (EHRJ-RES-2026-AB739D16)
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setInputCode("EHRJ-RCP-1790452316556-9976KK")}
                  className="font-mono text-[#0D5C3A] font-bold underline hover:text-emerald-800"
                >
                  রসিদ (EHRJ-RCP-...)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? "যাচাই করা হচ্ছে..." : "ডিজিটাল সত্যতা যাচাই করুন"}</span>
            </button>
          </form>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Certificate Result Preview Card */}
        {certResult && (
          <div className="bg-white rounded-3xl border-2 border-[#D4AF37] p-6 sm:p-10 shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center justify-between pb-6 border-b border-slate-200">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    certResult.isRevoked ? "bg-red-100 text-red-800" : "bg-emerald-100 text-[#0D5C3A]"
                  }`}
                >
                  {certResult.isRevoked ? (
                    <AlertTriangle className="w-7 h-7 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-7 h-7 text-[#0D5C3A]" />
                  )}
                </div>
                <div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      certResult.isRevoked
                        ? "bg-red-100 text-red-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {certResult.isRevoked ? "বাতিলকৃত সনদ (REVOKED)" : "অফিসিয়ালি ভেরিফাইড (VERIFIED AUTHENTIC)"}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                    {certResult.titleBn || "বৈধ প্রাতিষ্ঠানিক সনদপত্র"}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="btn-emerald px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition print:hidden shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট</span>
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">সনদ নম্বর:</span>
                <span className="font-mono font-bold text-[#0D5C3A]">{certResult.certificateNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">সনদের বিষয় / টাইপ:</span>
                <span className="font-black text-slate-900">{certResult.documentType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">শিক্ষার্থীর নাম:</span>
                <span className="font-black text-slate-900">{certResult.studentName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">শিক্ষার্থী আইডি:</span>
                <span className="font-mono font-bold text-slate-800">{certResult.studentId}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">জামাত / শ্রেণি:</span>
                <span className="font-medium text-slate-800">{certResult.className || "মাদরাসা"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-semibold">ইস্যুর তারিখ:</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {certResult.issueDate
                    ? new Date(certResult.issueDate).toLocaleDateString("bn-BD", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
              <span>{certResult.institution?.nameBn || INSTITUTION_INFO.nameBn}</span>
              <a
                href={`/verify/document/${encodeURIComponent(certResult.verificationCode)}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#0D5C3A] font-bold hover:underline flex items-center gap-1"
              >
                পূর্ণাঙ্গ সনদ পেজ দেখুন <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
