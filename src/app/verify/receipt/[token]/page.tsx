"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Printer,
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Building2,
  Receipt,
  FileCheck,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function PublicReceiptVerificationPage() {
  const params = useParams();
  const rawToken = (params?.token as string) || "";
  const token = decodeURIComponent(rawToken);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/verify/receipt/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json();
        if (res.ok && json.success) {
          setData(json);
        } else {
          setError(json.message || json.error || "প্রদত্ত টোকেনের কোনো রসিদ তথ্য পাওয়া যায়নি।");
        }
      })
      .catch(() => {
        setError("ভেরিফিকেশন প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি। সংযোগ পরীক্ষা করুন।");
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914] selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/verify"
            className="text-xs text-[#0D5C3A] hover:underline flex items-center gap-1.5 font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            পাবলিক ভেরিফিকেশন পোর্টালে ফিরুন
          </Link>

          {data && (
            <button
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm print:hidden"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              প্রিন্ট ভেরিফিকেশন স্লিপ
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
            <div className="w-10 h-10 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">পেমেন্ট রসিদের ডিজিটাল রেকর্ড যাচাই করা হচ্ছে...</p>
          </div>
        ) : error || !data ? (
          <div className="bg-white rounded-3xl border-2 border-red-300 p-8 sm:p-10 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-black text-red-700">রসিদ যাচাই ব্যর্থ হয়েছে</h2>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">{error}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-2">টোকেন: {token}</p>
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              দয়া করে নিশ্চিত করুন যে রসিদে মুদ্রিত কিউআর কোড বা রসিদ নম্বরটি সঠিকভাবে প্রদান করেছেন।
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-[#0D5C3A] p-6 sm:p-10 shadow-xl space-y-6 print:border-none print:shadow-none print:p-0">
            {/* Header Authentic Seal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
              <div>
                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-wider block">
                  পাবলিক ডিজিটাল ভেরিফিকেশন
                </span>
                <h1 className="text-xl sm:text-2xl font-black font-display text-[#083B25]">
                  {data.institution?.nameBn || INSTITUTION_INFO.nameBn}
                </h1>
                <p className="text-xs text-slate-500">{INSTITUTION_INFO.addressBn}</p>
              </div>

              <div
                className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border self-start sm:self-auto ${
                  data.verified
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : data.isPendingVerification
                    ? "bg-amber-50 border-amber-300 text-amber-900"
                    : "bg-red-50 border-red-300 text-red-900"
                }`}
              >
                {data.verified ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : data.isPendingVerification ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <div>
                  <span className="text-xs font-black block leading-tight">
                    {data.verified
                      ? "যাচাইকৃত বৈধ রসিদ"
                      : data.isPendingVerification
                      ? "যাচাই প্রক্রিয়াধীন (PENDING)"
                      : "বাতিল বা রিফান্ডকৃত রসিদ"}
                  </span>
                  <span className="text-[10px] opacity-75 font-mono">
                    {data.receipt?.paymentStatus || "AUTHENTIC RECEIPT"}
                  </span>
                </div>
              </div>
            </div>

            {/* Note banner if partial refund or pending */}
            {data.verificationNote && (
              <div
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                  data.verified
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-800"
                    : data.isPendingVerification
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#0D5C3A] flex-shrink-0 mt-0.5" />
                <span>{data.verificationNote}</span>
              </div>
            )}

            {/* Primary Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#F9F8F3] p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">
                  {data.isDonation ? "দানকারী / দাতার নাম" : "শিক্ষার্থীর নাম"}
                </span>
                <span className="font-bold text-sm text-slate-900 block">
                  {data.student?.fullNameBn}
                </span>
                {data.student?.fullNameEn && (
                  <span className="text-[11px] text-slate-500">{data.student?.fullNameEn}</span>
                )}
              </div>

              <div className="bg-[#F9F8F3] p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">
                  {data.isDonation ? "শনাক্তকরণ / ফোন নম্বর" : "আইডি ও শ্রেণি তথ্য"}
                </span>
                <span className="font-mono font-bold text-sm text-[#0D5C3A] block">
                  {data.student?.studentIdNumber}
                </span>
                <span className="text-[11px] text-slate-600">
                  {data.isDonation
                    ? `তহবিল: ${data.student?.sectionName || data.receipt?.invoiceTitle || "অনুদান"}`
                    : `জামাত: ${data.student?.className || "মাদরাসা"} | রোল: ${data.student?.rollNumber ?? "—"}`}
                </span>
              </div>

              <div className="bg-[#F9F8F3] p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">রসিদ ও ইনভয়েস বিবরণ</span>
                <span className="font-mono font-bold text-slate-900 block">
                  {data.receipt?.receiptNumber}
                </span>
                <span className="text-[11px] text-slate-600">
                  খাত: {data.receipt?.feeType || "প্রাতিষ্ঠানিক ফি"} | {data.receipt?.invoiceTitle || "ফি আদায়"}
                </span>
              </div>

              <div className="bg-[#F9F8F3] p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">পরিশোধের পরিমাণ ও মাধ্যম</span>
                <span className="font-mono font-black text-base text-[#0D5C3A] block">
                  ৳ {data.receipt?.paidAmount?.toLocaleString("bn-BD") || 0}
                </span>
                <span className="text-[11px] text-slate-600">
                  মাধ্যম: {data.receipt?.paymentMethod} | ট্রানজেকশন: {data.receipt?.transactionId || "—"}
                </span>
              </div>
            </div>

            {/* Additional details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block">পরিশোধের তারিখ ও সময়</span>
                <span className="font-medium text-slate-800">
                  {data.receipt?.receiptDate
                    ? new Date(data.receipt.receiptDate).toLocaleString("bn-BD")
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">ইনভয়েস নম্বর</span>
                <span className="font-mono font-bold text-slate-700">
                  {data.receipt?.invoiceNumber || "—"}
                </span>
              </div>
            </div>

            {/* Verification Footer and Security Note */}
            <div className="border-t border-slate-200 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
              <div>
                <p className="font-mono text-slate-700">
                  রসিদ ভেরিফিকেশন আইডি: <strong>{data.receipt?.receiptNumber}</strong>
                </p>
                <p className="text-[10px] text-slate-400">
                  হিসাব ও অর্থ দফতর কর্তৃক নিশ্চিতকৃত
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
