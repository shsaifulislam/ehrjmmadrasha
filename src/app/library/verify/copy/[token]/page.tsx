import React from "react";
import Link from "next/link";
import { BookOpen, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { INSTITUTION_INFO } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function CopyVerificationPage({ params }: { params: { token: string } }) {
  const { token } = params;

  const copy = await prisma.libraryBookCopy.findUnique({
    where: { qrToken: token },
    include: {
      book: {
        include: {
          category: true,
          author: true,
          publisher: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col text-[#0B1914]">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full flex items-center justify-center">
        {copy ? (
          <div className="bg-white rounded-2xl border-2 border-emerald-500/30 p-6 sm:p-8 shadow-xl space-y-6 w-full relative overflow-hidden">
            {/* Authenticity Watermark/Banner */}
            <div className="absolute -right-12 -top-12 w-36 h-36 bg-emerald-50 rounded-full flex items-end justify-start p-6 pointer-events-none">
              <ShieldCheck className="w-16 h-16 text-emerald-200" />
            </div>

            {/* Institution Header */}
            <div className="text-center space-y-1 border-b border-gray-100 pb-5">
              <span className="text-[10px] font-bold tracking-widest text-[#0D5C3A] uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                অফিসিয়াল লাইব্রেরি কিউআর যাচাইকরণ (Official QR Verified)
              </span>
              <h2 className="text-lg font-bold text-gray-900 pt-1 font-display">
                {INSTITUTION_INFO.nameBn}
              </h2>
              <p className="text-xs text-gray-500 font-mono">
                কেন্দ্রীয় দারুল কুতুব ও কিতাব সংরক্ষণাগার
              </p>
            </div>

            {/* Verified Badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-emerald-900">বৈধ প্রাতিষ্ঠানিক কিতাব কপি</h4>
                <p className="text-xs text-emerald-700">
                  এই কিতাবটি মাদরাসার লাইব্রেরি ডাটাবেজে যথাযথভাবে নিবন্ধিত ও সত্যায়িত।
                </p>
              </div>
            </div>

            {/* Book Details */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">কিতাবের নাম:</span>
                <span className="font-bold text-gray-900 text-right">{copy.book.titleBn}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">ইংরেজি নাম:</span>
                <span className="font-medium text-gray-700 text-right">{copy.book.titleEn}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">লেখক:</span>
                <span className="font-bold text-emerald-800 text-right">{copy.book.author.nameBn}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">ক্যাটাগরি:</span>
                <span className="font-medium text-gray-700">{copy.book.category.nameBn}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">একসেশন নম্বর:</span>
                <span className="font-mono font-bold text-gray-900">{copy.accessionNo}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">বারকোড:</span>
                <span className="font-mono text-gray-700">{copy.barcode}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">সংরক্ষণ তাক:</span>
                <span className="font-semibold text-gray-800">
                  {copy.shelfLocation || copy.book.shelfLocation || "নির্ধারিত তাকে সংরক্ষিত"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">বর্তমান অবস্থা:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    copy.status === "AVAILABLE"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {copy.status === "AVAILABLE" ? "লাইব্রেরিতে সংরক্ষিত (Available)" : "ইস্যুকৃত (Circulated)"}
                </span>
              </div>
            </div>

            {/* Privacy Shield */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-[11px] text-gray-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                নিরাপত্তা নীতিমালা অনুযায়ী কোনো ব্যক্তিগত গ্রহীতা বা শিক্ষার্থীর বিবরণ প্রকাশ করা হয় না।
              </span>
            </div>

            {/* Back Button */}
            <div className="pt-2 text-center">
              <Link
                href="/library"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D5C3A] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> সাধারণ ক্যাটালগে ফিরে যান
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-xl text-center space-y-4 max-w-md w-full">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
            <h3 className="font-bold text-base text-gray-900">অকার্যকর কিউআর কোড</h3>
            <p className="text-xs text-gray-500">
              প্রদত্ত কিউআর টোকেনটি সঠিক নয় অথবা ডাটাবেজে এর কোনো কিতাব কপি রেকর্ড বিদ্যমান নেই।
            </p>
            <Link
              href="/library"
              className="inline-block px-4 py-2 bg-[#0D5C3A] text-white text-xs font-bold rounded-lg hover:bg-emerald-800 transition"
            >
              লাইব্রেরি ক্যাটালগ দেখুন
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
