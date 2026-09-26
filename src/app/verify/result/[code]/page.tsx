"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, XCircle, ShieldCheck, Award, Printer, ArrowLeft } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function PublicResultVerificationPage() {
  const params = useParams();
  const code = (params?.code as string) || "";

  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    fetch(`/api/verify/result/${encodeURIComponent(code)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.verification) {
          setVerification(data.verification);
        } else {
          setError(data.error || "প্রদত্ত কোডের কোনো ফলাফল পাওয়া যায়নি।");
        }
      })
      .catch(() => {
        setError("ভেরিফিকেশন সম্পন্ন করতে সমস্যা হয়েছে। সংযোগ পরীক্ষা করুন।");
      })
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-12 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/results"
            className="text-xs text-[#0D5C3A] hover:underline flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            ফলাফল পোর্টালে ফিরুন
          </Link>
          {verification && (
            <button
              onClick={() => window.print()}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm print:hidden"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              প্রিন্ট ভেরিফিকেশন স্লিপ
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500">ডিজিটাল রেকর্ড যাচাই করা হচ্ছে...</p>
          </div>
        ) : error || !verification ? (
          <div className="bg-white rounded-2xl p-8 border-2 border-red-300 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-700">ফলাফল যাচাই ব্যর্থ হয়েছে</h2>
              <p className="text-xs text-gray-600 mt-1">{error}</p>
              <p className="text-[11px] text-gray-400 font-mono mt-2">কোড: {code}</p>
            </div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              দয়া করে নিশ্চিত করুন যে মার্কশিটে মুদ্রিত ভেরিফিকেশন কোডটি সঠিকভাবে লিখেছেন অথবা অফিস কর্তৃপক্ষের সাথে যোগাযোগ করুন।
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-[#0D5C3A] p-6 sm:p-8 shadow-md space-y-6 print:border-none print:shadow-none">
            {/* Header Authentic Seal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#C59B27] uppercase tracking-wider block">
                  পাবলিক ডিজিটাল ভেরিফিকেশন
                </span>
                <h1 className="text-xl sm:text-2xl font-bold font-display text-[#083B25]">
                  {INSTITUTION_INFO.nameBn}
                </h1>
                <p className="text-xs text-gray-500">{INSTITUTION_INFO.addressBn}</p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 px-3.5 py-2 rounded-xl self-start sm:self-auto">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold block leading-none">যাচাইকৃত বৈধ ফলাফল</span>
                  <span className="text-[10px] text-emerald-700 font-mono">Authentic Result</span>
                </div>
              </div>
            </div>

            {/* Candidate & Exam Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#F9F8F3] p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-500 block">শিক্ষার্থীর নাম</span>
                <span className="font-bold text-sm text-gray-900 block mt-0.5">
                  {verification.studentNameBn}
                </span>
                {verification.studentNameEn && (
                  <span className="text-[11px] text-gray-500">{verification.studentNameEn}</span>
                )}
              </div>

              <div className="bg-[#F9F8F3] p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-500 block">শিক্ষার্থী আইডি ও রোল</span>
                <span className="font-mono font-bold text-sm text-[#0D5C3A] block mt-0.5">
                  {verification.studentIdNumber}
                </span>
                <span className="text-[11px] text-gray-600">
                  ক্লাস রোল: {verification.rollNumber ?? "অনির্ধারিত"} | জামাত: {verification.classNameBn}
                </span>
              </div>

              <div className="bg-[#F9F8F3] p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-500 block">পরীক্ষার বিবরণ</span>
                <span className="font-semibold text-gray-900 block mt-0.5">
                  {verification.examNameBn}
                </span>
                <span className="text-[11px] text-gray-600">
                  শিক্ষাবর্ষ: {verification.sessionNameBn} ({verification.sessionYear})
                </span>
              </div>

              <div className="bg-[#F9F8F3] p-3.5 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-500 block">চূড়ান্ত ফলাফল ও গ্রেড</span>
                <span
                  className={`font-bold text-sm block mt-0.5 ${
                    verification.isPassed ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {verification.finalGradeBn}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  স্ট্যাটাস: {verification.isPassed ? "কৃতকার্য (PASSED)" : "অকৃতকার্য (FAILED)"}
                </span>
              </div>
            </div>

            {/* Subject Breakdown if present */}
            {verification.subjects && verification.subjects.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-[#083B25] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#C59B27]" />
                  বিষয়ভিত্তিক ফলাফল বিবরণী
                </h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F9F8F3] border-b border-gray-200 font-semibold text-gray-700">
                      <tr>
                        <th className="p-2.5">বিষয়</th>
                        <th className="p-2.5">পূর্ণমান</th>
                        <th className="p-2.5">প্রাপ্ত নম্বর</th>
                        <th className="p-2.5">গ্রেড</th>
                        <th className="p-2.5">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {verification.subjects.map((sub: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2.5 font-semibold text-gray-900">{sub.subjectNameBn}</td>
                          <td className="p-2.5 font-mono">{sub.fullMarks}</td>
                          <td className="p-2.5 font-mono font-bold text-[#0D5C3A]">
                            {sub.obtainedMarks !== null ? sub.obtainedMarks : "—"}
                          </td>
                          <td className="p-2.5">{sub.gradeBn}</td>
                          <td className="p-2.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                sub.isPassed
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {sub.isPassed ? "পাস" : "ফেল"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Verification Footer and Security Note */}
            <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
              <div>
                <p className="font-mono text-gray-700">
                  ভেরিফিকেশন কোড: <strong>{verification.verificationCode}</strong>
                </p>
                <p className="text-[10px] text-gray-400">
                  প্রকাশের তারিখ: {new Date(verification.publishedAt).toLocaleDateString("bn-BD")}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ডিজিটাল ক্যাম্পাস সিকিউরিটি দ্বারা সংরক্ষিত ও প্রমাণিত
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
