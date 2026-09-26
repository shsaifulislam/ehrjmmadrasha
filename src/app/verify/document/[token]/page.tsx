"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, AlertOctagon, ShieldCheck, Printer, ArrowLeft, FileText, QrCode } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function PublicDocumentVerificationPage() {
  const params = useParams();
  const rawToken = (params?.token as string) || "";
  const token = decodeURIComponent(rawToken);

  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/verify/document/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.document) {
          setDoc(data.document);
        } else {
          setError(data.error || "প্রদত্ত কোডে কোনো অফিশিয়াল প্রত্যয়নপত্র পাওয়া যায়নি।");
        }
      })
      .catch(() => {
        setError("ভেরিফিকেশন সম্পন্ন করতে সমস্যা হয়েছে। সংযোগ পরীক্ষা করুন।");
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-12 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/verify"
            className="text-xs text-[#0D5C3A] hover:underline flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            সাধারণ ভেরিফিকেশন পোর্টালে ফিরুন
          </Link>
          {doc && (
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
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-10 h-10 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-600">প্রত্যয়নপত্রের ডিজিটাল রেকর্ড যাচাই করা হচ্ছে...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-10 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-900 mb-1">অনিবন্ধিত বা অবৈধ প্রত্যয়নপত্র</h2>
              <p className="text-sm text-red-700 max-w-md mx-auto">{error}</p>
            </div>
            <p className="text-xs text-gray-500">
              অনুগ্রহ করে কিউআর কোড বা প্রত্যয়নপত্র নম্বরটি পুনরায় মিলিয়ে দেখুন।
            </p>
          </div>
        ) : doc ? (
          <div className="bg-white rounded-2xl border-2 border-emerald-900/10 shadow-lg overflow-hidden">
            {/* Header Banner */}
            <div
              className={`p-6 text-white text-center relative ${
                doc.isRevoked
                  ? "bg-gradient-to-r from-red-700 to-rose-900"
                  : "bg-gradient-to-r from-[#083B25] to-[#0D5C3A]"
              }`}
            >
              <div className="flex justify-center mb-3">
                <div className="bg-white/10 p-2.5 rounded-full border border-white/20">
                  {doc.isRevoked ? (
                    <AlertOctagon className="w-8 h-8 text-amber-300" />
                  ) : (
                    <ShieldCheck className="w-8 h-8 text-[#C59B27]" />
                  )}
                </div>
              </div>
              <span className="text-[11px] uppercase tracking-wider font-semibold bg-black/20 px-3 py-1 rounded-full inline-block mb-2">
                {doc.isRevoked ? "বাতিলকৃত প্রত্যয়নপত্র (REVOKED)" : "সরকারি ও প্রাতিষ্ঠানিক ডিজিটাল সত্যতা নিশ্চিত"}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-display">{doc.titleBn}</h1>
              <p className="text-xs text-emerald-100 mt-1">{doc.institution.nameBn}</p>
            </div>

            {/* Revocation Warning Alert */}
            {doc.isRevoked && (
              <div className="bg-red-50 border-b border-red-200 p-4 text-center">
                <p className="text-xs sm:text-sm font-bold text-red-800 flex items-center justify-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-600" />
                  {doc.revocationNotice}
                </p>
                <p className="text-[11px] text-red-600 mt-0.5">
                  এই প্রত্যয়নপত্রটি আর কোনো প্রাতিষ্ঠানিক বা আইনগত কাজে ব্যবহারের যোগ্য নয়।
                </p>
              </div>
            )}

            {/* Verification Content Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-100 text-xs">
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <span className="text-[11px] text-gray-500 block mb-0.5 font-medium">প্রত্যয়নপত্র নম্বর</span>
                  <span className="font-mono text-sm font-bold text-[#083B25]">{doc.certificateNumber}</span>
                  {doc.version > 1 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      ভার্সন {doc.version}
                    </span>
                  )}
                </div>
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <span className="text-[11px] text-gray-500 block mb-0.5 font-medium">ভেরিফিকেশন টোকেন</span>
                  <span className="font-mono text-xs font-semibold text-gray-700">{doc.verificationCode}</span>
                </div>
              </div>

              {/* Student Identity Information (Privacy Safe) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">শিক্ষার্থীর তথ্য</h3>
                <div className="bg-[#F9F8F3] p-4 rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-gray-500">শিক্ষার্থীর পূর্ণ নাম:</span>
                    <span className="font-bold text-gray-900 text-sm">{doc.studentName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-gray-500">মাদরাসা স্টুডেন্ট আইডি:</span>
                    <span className="font-mono font-bold text-[#083B25]">{doc.studentId}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-gray-500">নিবন্ধিত জামাত/শ্রেণি:</span>
                    <span className="font-semibold text-gray-800">{doc.className}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">শিক্ষাবর্ষ:</span>
                    <span className="font-semibold text-gray-800">{doc.sessionName}</span>
                  </div>
                </div>
              </div>

              {/* Document Status & Issue Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-gray-500 block">ইস্যুর তারিখ</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(doc.issueDate).toLocaleDateString("bn-BD")}
                    </span>
                  </div>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-gray-500 block">ডিজিটাল স্ট্যাটাস</span>
                    <span
                      className={`font-bold inline-flex items-center gap-1 ${
                        doc.isRevoked ? "text-red-700" : "text-emerald-700"
                      }`}
                    >
                      {doc.isRevoked ? (
                        <>
                          <AlertOctagon className="w-3.5 h-3.5" /> বাতিলকৃত (REVOKED)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> বৈধ ও কার্যকর (VALID)
                        </>
                      )}
                    </span>
                  </div>
                  <ShieldCheck className={`w-5 h-5 ${doc.isRevoked ? "text-red-400" : "text-emerald-500"}`} />
                </div>
              </div>

              {/* Privacy Safe Footer Notice */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed text-center">
                এই ডিজিটাল যাচাইকরণ পাতাটি ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সেন্ট্রাল ডাটাবেজের সাথে সরাসরি সংযুক্ত। শিক্ষার্থীদের ব্যক্তিগত গোপনীয়তা রক্ষার্থে কেবল নিরাপদ প্রাতিষ্ঠানিক তথ্য প্রদর্শিত হচ্ছে।
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
