"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock } from "lucide-react";

export interface AuthenticationShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthenticationShell({ children, title, subtitle }: AuthenticationShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#041F14] via-[#083B25] to-slate-950 flex flex-col justify-between p-4 sm:p-6 font-sans selection:bg-[#D4AF37] selection:text-slate-950 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
        >
          <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
          <span>মূল ওয়েবসাইটে ফিরে যান</span>
        </Link>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>২৫৬-বিট সুরক্ষিত সেশন</span>
        </div>
      </div>

      {/* Center Auth Card */}
      <div className="max-w-md w-full mx-auto my-8 bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 z-10 space-y-6">
        {/* Madrasha Crest & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-white border-2 border-[#D4AF37] p-1 mx-auto shadow-md overflow-hidden flex items-center justify-center">
            <Image
              src="/images/logo.jpg"
              alt="EHRJ Crest"
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
            </h1>
            <p className="text-xs text-emerald-800 font-bold font-arabic mt-0.5">الجامعة الإسلامية رحمة الله জমিরীয়া</p>
          </div>
          <div className="pt-1">
            <span className="text-sm font-bold text-slate-800 font-display block">{title}</span>
            {subtitle && <p className="text-xs text-slate-500 font-sans mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Form Body */}
        {children}

        {/* Security Footer Note */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>ডিজিটাল ক্যাম্পাস ইআরপি • সুরক্ষিত কেন্দ্রীয় প্রমাণীকরণ</span>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="text-center text-xs text-slate-400 z-10 pb-2">
        &copy; {new Date().getFullYear()} ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা। সর্বস্বত্ব সংরক্ষিত।
      </div>
    </div>
  );
}

export default AuthenticationShell;
