"use client";

import { use } from "react";
import Link from "next/link";
import { ShieldCheck, XCircle, Award, GraduationCap, Calendar, CheckCircle2, Building, Printer, ArrowLeft } from "lucide-react";
import { useVerifyCertificate } from "@/hooks/useCertificate";
import { AppButton } from "@/components/shared/AppButton";
import { AppBadge } from "@/components/shared/AppBadge";

export default function PublicVerifyCertificatePage({ params }: { params: Promise<{ certNo: string }> }) {
  const { certNo } = use(params);
  const { data: verification, isLoading } = useVerifyCertificate(certNo);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
        <p className="text-sm font-bold text-slate-300">সার্টিফিকেট সত্যতা যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  const isValid = verification?.isValid;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-12">
      {/* Top Brand Bar */}
      <div className="max-w-3xl mx-auto w-full flex justify-between items-center pb-8 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white text-lg">
            ই
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা</h2>
            <p className="text-[10px] text-slate-400 font-mono">অফিসিয়াল ডিজিটাল সার্টিফিকেট ভ্যালিডেশন ইঞ্জিন</p>
          </div>
        </div>
        <Link href="/">
          <AppButton variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            মূল ওয়েবসাইট
          </AppButton>
        </Link>
      </div>

      {/* Main Verification Result Card */}
      <div className="max-w-3xl mx-auto w-full my-8">
        {isValid ? (
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-10 w-10 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 block">
                    অফিসিয়াল সত্যতা প্রমাণিত
                  </span>
                  <h1 className="text-lg font-black text-white flex items-center gap-2">
                    {verification.status}
                  </h1>
                </div>
              </div>
              <AppBadge variant="success" className="text-xs px-3 py-1 font-bold">
                বৈধ ও আসল রেকর্ড
              </AppBadge>
            </div>

            {/* Certificate Meta Details Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-400" />
                সার্টিফিকেট ও শিক্ষার্থীর তথ্যসমূহ
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block">সার্টিফিকেট ট্র্যাকিং নম্বর:</span>
                  <strong className="text-emerald-400 font-mono text-sm block mt-0.5">{verification.certificateNumber}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block">সার্টিফিকেটের ধরন:</span>
                  <strong className="text-white text-sm block mt-0.5">{verification.type}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block">শিক্ষার্থীর নাম:</span>
                  <strong className="text-white text-sm block mt-0.5">{verification.studentName}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block">স্টুডেন্ট কোড (ID):</span>
                  <strong className="text-slate-200 font-mono text-sm block mt-0.5">{verification.studentId}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block">শ্রেণী ও সেশন:</span>
                  <strong className="text-slate-200 text-sm block mt-0.5">{verification.className} ({verification.sessionYear})</strong>
                </div>

                <div>
                  <span className="text-slate-400 block">অভিভাবকের নাম:</span>
                  <strong className="text-slate-200 text-sm block mt-0.5">{verification.fatherName}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block">ইস্যুর তারিখ:</span>
                  <strong className="text-slate-200 font-mono text-sm block mt-0.5">
                    {new Date(verification.issueDate).toLocaleDateString("bn-BD")}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block">ইস্যুকারী প্রতিষ্ঠান:</span>
                  <strong className="text-emerald-300 text-sm block mt-0.5">{verification.madrasha}</strong>
                </div>
              </div>
            </div>

            {/* Print & Download Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-800">
              <p className="text-[11px] text-slate-400">
                এই পাতাটি ইলেকট্রনিকভাবে ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা ডাটাবেস থেকে সতত্যা প্রমাণিত।
              </p>
              <AppButton variant="primary" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
                প্রিন্ট করুন
              </AppButton>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <XCircle className="h-16 w-16 text-rose-500 mx-auto" />
            <div>
              <h1 className="text-xl font-black text-white">অবৈধ বা ভুয়া সার্টিফিকেট নম্বর</h1>
              <p className="text-xs text-rose-300 mt-2 max-w-md mx-auto">
                {verification?.message || "প্রদত্ত সার্টিফিকেট নম্বরের কোনো অস্তিত্ব মাদ্রাসার অফিসিয়াল ডাটাবেসে পাওয়া যায়নি।"}
              </p>
            </div>
            <Link href="/">
              <AppButton variant="secondary" size="sm">
                হোমপেজে ফিরে যান
              </AppButton>
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto w-full text-center text-xs text-slate-500 pt-8 border-t border-slate-800">
        © 2026 EHRJ Madrasha. All rights reserved. | Powered by Public Verification Engine
      </div>
    </div>
  );
}
