"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, Search, CheckCircle, AlertTriangle, Printer, QrCode } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function CertificateVerifyPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setResult(null);

    try {
      const res = await fetch("/api/certificates/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.success && data.certificate) {
        setResult(data.certificate);
      } else {
        setErrorMsg(data.error || "সনদপত্রটি খুঁজে পাওয়া যায়নি।");
      }
    } catch {
      setErrorMsg("যাচাইকরণ প্রক্রিয়া সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <Navbar />

      <section className="bg-gradient-to-b from-[#083B25] to-[#0D5C3A] text-white py-14 px-4 border-b-4 border-[#C59B27] text-center">
        <div className="max-w-6xl mx-auto">
          <span className="bg-[#C59B27]/20 text-amber-200 border border-[#C59B27]/40 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block mb-3">
            পাবলিক ভেরিফিকেশন পোর্টাল
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-white mb-3">
            প্রত্যয়নপত্র ও সনদপত্র সত্যতা যাচাই
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            মাদরাসা কর্তৃক ইস্যুকৃত সকল সনদ, প্রশংসাপত্র ও চারিত্রিক প্রত্যয়নের ডিজিটাল সত্যতা নিশ্চিত করুন।
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-8 flex-1 w-full">
        {/* Verification Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                সনদপত্র নম্বর বা কিউআর কোড ট্র্যাকিং আইডি লিখুন *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="যেমন: EHRJ-CERT-2026-0001"
                  className="w-full p-3 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A] font-mono"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                টিপ: ডেমো সনদের জন্য <span className="font-mono text-[#0D5C3A] font-bold cursor-pointer" onClick={() => setCode("EHRJ-CERT-2026-0001")}>EHRJ-CERT-2026-0001</span> লিখে টেস্ট করতে পারেন।
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 rounded-lg text-xs font-bold transition shadow flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
              {loading ? "যাচাই করা হচ্ছে..." : "সনদ যাচাই করুন"}
            </button>
          </form>

          {errorMsg && (
            <div className="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Certificate Card */}
        {result && (
          <div className="bg-white rounded-2xl border-2 border-emerald-600 p-6 sm:p-8 shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    অফিসিয়ালি ভেরিফাইড (Authentic)
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">
                    বৈধ প্রাতিষ্ঠানিক সনদপত্র
                  </h2>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition print:hidden"
              >
                <Printer className="w-3.5 h-3.5" />
                প্রিন্ট
              </button>
            </div>

            <div className="space-y-3 bg-[#F9F8F3] p-4 rounded-xl border border-gray-100 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">সনদ নম্বর:</span>
                <span className="font-mono font-bold text-[#0D5C3A]">{result.certificateNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">সনদের বিষয়:</span>
                <span className="font-bold text-gray-900">{result.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">শিক্ষার্থীর নাম:</span>
                <span className="font-bold text-gray-900">{result.studentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">স্থায়ী ছাত্র আইডি:</span>
                <span className="font-mono text-gray-800">{result.studentId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">জামাত / অনুষদ:</span>
                <span className="text-gray-800">{result.className}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">ইস্যুর তারিখ:</span>
                <span className="font-mono text-gray-700">
                  {new Date(result.issueDate).toLocaleDateString("bn-BD")}
                </span>
              </div>
            </div>

            <div className="pt-2 text-center text-[11px] text-gray-500">
              {INSTITUTION_INFO.nameBn} • অধ্যক্ষ: {INSTITUTION_INFO.principal}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
