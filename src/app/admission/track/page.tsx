"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Clock, CheckCircle2, XCircle, ArrowLeft, Building, Phone, Printer } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

interface TrackedApplication {
  id: string;
  applicationNumber: string;
  studentNameBn: string;
  studentNameEn: string;
  guardianName: string;
  guardianPhone: string;
  status: string;
  remarks?: string;
  createdAt: string;
  classNameBn: string;
}

export default function AdmissionTrackingPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackedApplication | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const isPhone = /^01[0-9]{9}$/.test(query.trim());
      const paramKey = isPhone ? "phone" : "appId";
      const res = await fetch(`/api/admissions/track?${paramKey}=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (res.ok && data.application) {
        setResult(data.application);
      } else {
        setErrorMsg(data.error || "প্রদত্ত নম্বরে কোনো আবেদন খুঁজে পাওয়া যায়নি।");
      }
    } catch {
      setErrorMsg("সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <Link
            href="/admission"
            className="text-xs font-semibold text-[#0D5C3A] hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            অনলাইন ভর্তি পৃষ্ঠায় ফিরুন
          </Link>
          <span className="text-xs text-gray-500 font-medium">ভর্তি আবেদন ট্র্যাকিং সিস্টেম</span>
        </div>

        {/* Title Card */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-emerald-50 text-[#0D5C3A] mb-1">
            <Building className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1914]">ভর্তি আবেদনের বর্তমান অবস্থা যাচাই করুন</h1>
          <p className="text-xs text-gray-600 max-w-lg mx-auto">
            আপনার আবেদন জমা দেওয়ার পর প্রাপ্ত ট্র্যাকিং নম্বর (যেমন: EHRJ-ADM-2026-XXXX) অথবা আবেদনে ব্যবহৃত অভিভাবকের
            ১১ ডিজিটের মোবাইল নম্বর দিয়ে অনুসন্ধান করুন।
          </p>

          {/* Search Form */}
          <form onSubmit={handleTrack} className="max-w-md mx-auto pt-4 flex gap-2">
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ট্র্যাকিং নম্বর বা মোবাইল নম্বর..."
              className="flex-1 p-2.5 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A] bg-gray-50 font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-5 py-2.5 rounded text-xs font-semibold flex items-center gap-1.5 shadow transition"
            >
              <Search className="w-4 h-4" />
              {loading ? "খোঁজা হচ্ছে..." : "যাচাই করুন"}
            </button>
          </form>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-3">
              <div>
                <span className="text-[11px] text-gray-500 font-semibold uppercase block">আবেদন ট্র্যাকিং নম্বর</span>
                <span className="text-lg font-bold font-mono text-[#0D5C3A]">{result.applicationNumber}</span>
              </div>
              <div>
                {result.status === "APPROVED" ? (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    আবেদন অনুমোদিত (APPROVED)
                  </span>
                ) : result.status === "REJECTED" ? (
                  <span className="bg-red-100 text-red-800 border border-red-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-red-600" />
                    আবেদন বাতিল / বিবেচনাধীন নয়
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                    প্রশাসনিক পর্যালোচনায় অপেক্ষমাণ (PENDING)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <span className="text-gray-500 block mb-0.5">শিক্ষার্থীর নাম (বাংলা)</span>
                <span className="font-bold text-gray-900 text-sm">{result.studentNameBn}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <span className="text-gray-500 block mb-0.5">English Name</span>
                <span className="font-semibold text-gray-900 font-mono">{result.studentNameEn}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <span className="text-gray-500 block mb-0.5">আবেদিত জামাত / বিভাগ</span>
                <span className="font-bold text-[#0D5C3A]">{result.classNameBn}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <span className="text-gray-500 block mb-0.5">আবেদন জমা দেওয়ার সময়</span>
                <span className="font-mono text-gray-800">
                  {new Date(result.createdAt).toLocaleDateString("bn-BD", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <span className="text-gray-500 block mb-0.5">অভিভাবকের নাম</span>
                <span className="font-semibold text-gray-900">{result.guardianName}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <span className="text-gray-500 block mb-0.5">যোগাযোগের মোবাইল</span>
                <span className="font-mono text-gray-900 font-bold">{result.guardianPhone}</span>
              </div>
            </div>

            {/* Instruction Box */}
            <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
              <span className="font-bold block text-sm text-[#0D5C3A]">ভর্তি সংক্রান্ত পরবর্তী নির্দেশনা:</span>
              {result.status === "APPROVED" ? (
                <p>
                  আলহামদুলিল্লাহ! আপনার ভর্তি আবেদন অনুমোদিত হয়েছে। শিক্ষার্থীকে স্থায়ী রোল নম্বর ও শ্রেণি প্রদান করা
                  হয়েছে। অফিস চলাকালীন মাদরাসা কার্যালয়ে উপস্থিত হয়ে প্রয়োজনীয় মূল কাগজপত্র জমা দিয়ে ভর্তি চূড়ান্ত করার জন্য অনুরোধ করা যাচ্ছে।
                </p>
              ) : (
                <p>
                  আপনার আবেদনটি মাদরাসার নাযিমে দারুল ইকামাহ ও ভর্তি কমিটির নিকট বিবেচনাধীন রয়েছে। যেকোনো প্রয়োজনে মাদরাসা
                  অফিস হেল্পলাইনে যোগাযোগ করতে পারেন: <strong className="font-mono">01845-162664</strong>।
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => window.print()}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                ট্র্যাকিং স্লিপ প্রিন্ট করুন
              </button>
            </div>
          </div>
        )}

        {/* Contact Help */}
        <div className="p-4 rounded-lg border border-gray-200 bg-white text-center text-xs text-gray-600">
          ভর্তি সংক্রান্ত কোনো তথ্যের অসঙ্গতি থাকলে সরাসরি যোগাযোগ করুন:{" "}
          <span className="font-mono font-bold text-gray-900">{INSTITUTION_INFO.primaryPhone}</span> অথবা{" "}
          <span className="font-mono font-bold text-gray-900">{INSTITUTION_INFO.email}</span>
        </div>
      </main>

      <Footer />
    </div>
  );
}
