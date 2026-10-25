"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  AlertTriangle,
  GraduationCap,
  Calendar,
  User,
  Building,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function StudentVerifyPage() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/verify/student/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("শিক্ষার্থীর ভেরিফিকেশন তথ্য পাওয়া যায়নি।");
        return res.json();
      })
      .then((json) => {
        if (json.verified) {
          setData(json);
        } else {
          setError(json.message || "ভেরিফিকেশন ব্যর্থ হয়েছে।");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-12 flex flex-col justify-center">
        {loading ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-lg border border-slate-200 space-y-4">
            <div className="w-12 h-12 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-700">ডিজিটাল স্টুডেন্ট আইডি ভেরিফাই হচ্ছে...</p>
          </div>
        ) : error || !data ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl border-2 border-red-200 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 font-serif-bn">অননুমোদিত বা অকার্যকর আইডি কার্ড</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              প্রদত্ত কিউআর কোডের বিপরীতে মাদরাসা কেন্দ্রীয় ডাটাবেজে কোনো সক্রিয় শিক্ষার্থীর রেকর্ড পাওয়া যায়নি।
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
              >
                মূল পাতায় ফিরুন
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#D4AF37]/50 overflow-hidden relative">
            <div className="h-2 bg-gradient-to-r from-[#0D5C3A] via-[#D4AF37] to-[#0D5C3A]" />

            {/* Verification Header */}
            <div className="bg-gradient-to-br from-[#063320] to-[#0D5C3A] text-white p-6 text-center space-y-2 relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>অফিসিয়াল ডিজিটাল আইডি ভেরিফাইড</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black font-serif-bn">
                {data.institution?.nameBn}
              </h1>
              <p className="text-[11px] text-emerald-100/80">
                স্থাপিত: ২০২১ ইং • ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা
              </p>
            </div>

            {/* Student Info Card */}
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
                <div className="w-16 h-16 rounded-2xl bg-[#0D5C3A] text-amber-300 flex items-center justify-center font-black text-2xl shadow-md border-2 border-[#D4AF37]">
                  {data.student?.fullNameBn?.charAt(0) || "তা"}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 font-serif-bn">
                    {data.student?.fullNameBn}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    আইডি: <strong className="text-slate-800">{data.student?.studentIdNumber}</strong>
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {data.student?.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">জামাত / শ্রেণি</span>
                  <span className="font-bold text-slate-800 font-serif-bn">{data.student?.className}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">শাখা ও রোল</span>
                  <span className="font-bold text-slate-800">
                    শাখা {data.student?.sectionName} • রোল {data.student?.rollNumber}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">আবাসিক অবস্থা</span>
                  <span className="font-bold text-slate-800">{data.student?.residentialStatus}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">রক্তের গ্রুপ</span>
                  <span className="font-bold text-red-600">{data.student?.bloodGroup}</span>
                </div>
              </div>

              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-700 block font-bold">কার্ডের মেয়াদকাল</span>
                  <span className="font-bold">{data.student?.validTill}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-700 block font-bold">শিক্ষাবর্ষ</span>
                  <span className="font-bold font-mono">{data.student?.sessionName}</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <p className="text-[10px] text-slate-400">
                  ডিজিটালভাবে সত্যায়িত • ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কেন্দ্রীয় ডাটাবেজ
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
