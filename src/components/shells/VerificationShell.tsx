"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export interface VerificationShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  token?: string;
  isVerified?: boolean;
}

export function VerificationShell({
  children,
  title,
  subtitle,
  token,
  isVerified = true,
}: VerificationShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-6">
        {/* Verification Status Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                isVerified ? "bg-emerald-50 text-[#0D5C3A] border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {isVerified ? <ShieldCheck className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isVerified ? "bg-emerald-100 text-[#0D5C3A]" : "bg-red-100 text-red-700"
                  }`}
                >
                  {isVerified ? "সরকারি ও প্রাতিষ্ঠানিক সনদ স্বীকৃত" : "যাচাইকরণ ব্যর্থ"}
                </span>
                {token && <span className="text-xs font-mono text-slate-500">#{token.slice(0, 10)}</span>}
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 font-display mt-0.5">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500 font-sans">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              <span>প্রিন্ট</span>
            </button>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>মূল সাইট</span>
            </Link>
          </div>
        </div>

        {/* Verification Body Content */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
          {/* Subtle Security Watermark */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
            <div className="w-96 h-96 rounded-full border-8 border-slate-900 flex items-center justify-center font-display font-black text-8xl rotate-[-25deg]">
              EHRJ
            </div>
          </div>

          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default VerificationShell;
