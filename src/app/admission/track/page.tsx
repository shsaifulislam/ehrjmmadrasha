"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Building,
  Calendar,
  FileCheck,
  GraduationCap,
  Printer,
  HelpCircle,
} from "lucide-react";

interface TrackedApplication {
  trackingId: string;
  studentNameBn: string;
  desiredClass: string;
  status: string;
  applicationDate: string;
  nextActionInstruction: string;
  correctionRequired?: string | null;
  examScheduledAt?: string | null;
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialAppId = searchParams.get("appId") || searchParams.get("trackingId") || "";

  const [query, setQuery] = useState(initialAppId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackedApplication | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTracking = async (searchVal: string) => {
    if (!searchVal.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const isPhone = /^01[0-9]{9}$/.test(searchVal.trim());
      const paramKey = isPhone ? "phone" : "trackingId";
      const res = await fetch(`/api/admissions/track?${paramKey}=${encodeURIComponent(searchVal.trim())}`);
      const data = await res.json();

      if (res.ok && data.application) {
        setResult(data.application);
      } else {
        setErrorMsg(data.error || "প্রদত্ত তথ্যের সাথে কোনো ভর্তি আবেদন খুঁজে পাওয়া যায়নি।");
      }
    } catch {
      setErrorMsg("সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialAppId) {
      fetchTracking(initialAppId);
    }
  }, [initialAppId]);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(query);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return {
          label: "অনুমোদিত (Approved)",
          bg: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: CheckCircle2,
        };
      case "REJECTED":
        return {
          label: "অননুমোদিত / বাতিল (Rejected)",
          bg: "bg-rose-100 text-rose-800 border-rose-300",
          icon: XCircle,
        };
      case "CORRECTION_REQUESTED":
        return {
          label: "সংশোধন প্রয়োজন (Action Required)",
          bg: "bg-amber-100 text-amber-800 border-amber-300",
          icon: AlertTriangle,
        };
      case "EXAM_INTERVIEW":
        return {
          label: "পরীক্ষা / সাক্ষাতকার (Exam/Interview)",
          bg: "bg-purple-100 text-purple-800 border-purple-300",
          icon: GraduationCap,
        };
      case "VERIFICATION":
        return {
          label: "কাগজপত্র যাচাইকরণ (Verification)",
          bg: "bg-cyan-100 text-cyan-800 border-cyan-300",
          icon: FileCheck,
        };
      case "UNDER_REVIEW":
        return {
          label: "পর্যালোচনাধীন (Under Review)",
          bg: "bg-blue-100 text-blue-800 border-blue-300",
          icon: Clock,
        };
      default:
        return {
          label: "আবেদন গৃহীত (Submitted)",
          bg: "bg-stone-100 text-stone-800 border-stone-300",
          icon: Clock,
        };
    }
  };

  // Step indices for progression
  const getStepIndex = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return 1;
      case "UNDER_REVIEW":
        return 2;
      case "VERIFICATION":
        return 3;
      case "EXAM_INTERVIEW":
        return 4;
      case "APPROVED":
        return 5;
      case "REJECTED":
      case "CORRECTION_REQUESTED":
        return 3;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <Link
            href="/admission"
            className="text-xs font-semibold text-[#0D5C3A] hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            নতুন ভর্তি আবেদন পাতায় যান
          </Link>
          <span className="text-xs text-stone-500 font-medium">ভর্তি আবেদন ট্র্যাকিং পোর্টাল</span>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-emerald-50 text-[#0D5C3A] mb-1">
            <Building className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-display">
            ভর্তি আবেদনের বর্তমান অবস্থা জানুন
          </h1>
          <p className="text-xs text-stone-600 max-w-md mx-auto">
            আপনার আবেদন জমা দেওয়ার পর প্রাপ্ত ট্র্যাকিং নম্বর (যেমন: EHRJ-ADM-2026-0001) অথবা আবেদনে ব্যবহৃত অভিভাবকের
            ১১ ডিজিটের মোবাইল নম্বর দিয়ে অনুসন্ধান করুন।
          </p>

          <form onSubmit={handleTrack} className="max-w-md mx-auto pt-3 flex gap-2">
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ট্র্যাকিং আইডি (EHRJ-ADM-YYYY-XXXX) বা মোবাইল..."
              className="flex-1 p-2.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A] bg-stone-50 font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {loading ? "অনুসন্ধান..." : "যাচাই করুন"}
            </button>
          </form>

          {errorMsg && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* TRACKING RESULT DETAILS */}
        {result && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden animate-fadeIn">
            {/* Header Status Bar */}
            <div className="p-6 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold text-stone-500 uppercase block tracking-wider">
                  আবেদন ট্র্যাকিং নম্বর
                </span>
                <span className="font-mono text-xl font-bold text-[#0D5C3A]">
                  {result.trackingId}
                </span>
              </div>

              <div>
                {(() => {
                  const badge = getStatusBadge(result.status);
                  const Icon = badge.icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${badge.bg}`}
                    >
                      <Icon className="w-4 h-4" />
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Stepper Timeline Visualizer */}
            <div className="p-6 border-b border-stone-200 bg-white">
              <span className="text-xs font-bold text-stone-700 block mb-4">
                আবেদনের অগ্রগতি ক্রম (Application Progress Pipeline):
              </span>

              <div className="flex items-center justify-between text-center relative">
                {[
                  { step: 1, title: "দাখিল" },
                  { step: 2, title: "পর্যালোচনা" },
                  { step: 3, title: "যাচাইকরণ" },
                  { step: 4, title: "পরীক্ষা/সাক্ষাতকার" },
                  { step: 5, title: "চূড়ান্ত সিদ্ধান্ত" },
                ].map((item, idx) => {
                  const currentIdx = getStepIndex(result.status);
                  const isDone = currentIdx >= item.step;
                  const isCurrent = currentIdx === item.step;
                  return (
                    <div key={item.step} className="flex-1 flex flex-col items-center relative">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all ${
                          isDone
                            ? "bg-[#0D5C3A] text-white"
                            : "bg-stone-100 text-stone-400 border border-stone-300"
                        } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
                      >
                        {isDone ? "✓" : item.step}
                      </div>
                      <span className={`text-[11px] mt-1 font-medium ${isDone ? "text-stone-900 font-bold" : "text-stone-400"}`}>
                        {item.title}
                      </span>
                      {idx < 4 && (
                        <div
                          className={`absolute top-3.5 left-1/2 w-full h-0.5 -z-0 ${
                            currentIdx > item.step ? "bg-[#0D5C3A]" : "bg-stone-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instruction / Action Banner */}
            <div className="p-6 space-y-4">
              <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-[#0D5C3A] flex items-center gap-1.5 uppercase tracking-wide">
                  <HelpCircle className="w-4 h-4" />
                  পরবর্তী করণীয় ও মাদরাসার নির্দেশনা:
                </span>
                <p className="text-xs text-stone-800 leading-relaxed font-medium">
                  {result.nextActionInstruction}
                </p>

                {result.correctionRequired && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 font-semibold">
                    ⚠️ জরুরি সংশোধনের বিবরণ: {result.correctionRequired}
                  </div>
                )}

                {result.examScheduledAt && (
                  <div className="mt-2 p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-700" />
                    <span>
                      পরীক্ষা / সাক্ষাতকারের নির্ধারিত সময়:{" "}
                      <strong>{new Date(result.examScheduledAt).toLocaleString("bn-BD")}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Privacy-Safe Summary Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <tbody>
                    <tr className="border-b border-stone-100 bg-stone-50/50">
                      <td className="p-3 text-stone-500 font-medium w-1/3">শিক্ষার্থীর নাম:</td>
                      <td className="p-3 font-bold text-stone-900">{result.studentNameBn}</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="p-3 text-stone-500 font-medium">আবেদনকৃত জামাত / বিভাগ:</td>
                      <td className="p-3 font-semibold text-stone-900">{result.desiredClass}</td>
                    </tr>
                    <tr className="border-b border-stone-100 bg-stone-50/50">
                      <td className="p-3 text-stone-500 font-medium">আবেদন জমাদানের তারিখ:</td>
                      <td className="p-3 font-mono text-stone-800">{result.applicationDate}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-stone-500 font-medium">বর্তমান অবস্থা:</td>
                      <td className="p-3 font-bold text-[#0D5C3A]">{result.status}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Print / Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 transition shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  প্রিন্ট স্লিপ
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function AdmissionTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs text-stone-500">
          ট্র্যাকিং পোর্টাল লোড হচ্ছে...
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
