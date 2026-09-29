"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquareHeart,
  ClipboardCheck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Clock,
  Users,
  EyeOff,
  Building,
  CheckCircle,
} from "lucide-react";
import { Survey } from "@/lib/surveys/types";

export default function PublicSurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/surveys?isPublic=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSurveys(data.data || []);
        }
      })
      .catch((err) => console.error("Error loading surveys:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Hero Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
            <MessageSquareHeart className="w-4 h-4 text-emerald-700" />
            <span>জনমত ও প্রাতিষ্ঠানিক পরামর্শ কেন্দ্র • Voice of Community</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            আপনার মতামত আমাদের আমানত
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600">
            ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার দ্বীনি শিক্ষা, আবাসিক সেবা ও প্রশাসনিক মানোন্নয়নে আপনার সুচিন্তিত পরামর্শ একান্ত কাম্য।
          </p>
        </div>

        {/* Institutional Invariant Pledge */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0 text-white shadow-md shadow-emerald-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>গোপনীয়তা ও আমানতদারিতার নীতি</span>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">
                EHRJ-AI-2026-PHASE37
              </span>
            </h3>
            <p className="text-sm text-slate-600">
              বেনামী জরিপের ক্ষেত্রে কোনো ব্যক্তিগত তথ্য সংরক্ষণ করা হয় না। জরিপের মতামত দায়িত্বশীল কর্তৃপক্ষের নীতি নির্ধারণে সহায়তা করে; স্বয়ংক্রিয়ভাবে কোনো শিক্ষার্থীর ফলাফল বা প্রশাসনিক অবস্থানে প্রভাব ফেলে না।
            </p>
          </div>
          <div className="shrink-0 flex gap-2">
            <Link
              href="/portal/surveys"
              className="px-4 py-2.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold rounded-xl text-sm transition-colors border border-emerald-200 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Users className="w-4 h-4" />
              <span>অভিভাবক / শিক্ষক পোর্টাল</span>
            </Link>
          </div>
        </div>

        {/* Public Surveys Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              <span>উন্মুক্ত জনমত ও সন্তুষ্টি জরিপসমূহ</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              সক্রিয় জরিপ: {surveys.length} টি
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : surveys.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
              <ClipboardCheck className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">বর্তমানে কোনো উন্মুক্ত জরিপ চালু নেই</h3>
              <p className="text-sm text-slate-500">
                নতুন কোনো জনমত জরিপ চালু হলে তা এখানে প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {survey.surveyType}
                      </span>
                      <span className="text-xs flex items-center gap-1 text-slate-500 font-medium">
                        {survey.responseMode === "ANONYMOUS" ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-amber-700">সম্পূর্ণ বেনামী</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-blue-700">ছদ্মনামযুক্ত / সুরক্ষিত</span>
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {survey.titleBn}
                    </h3>

                    <p className="text-sm text-slate-600 line-clamp-3">
                      {survey.descriptionBn}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>প্রশ্নের সংখ্যা: {survey.questions.length} টি</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>অংশগ্রহণ: {survey.responseCount} জন</span>
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/surveys/${survey.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm shadow-emerald-600/20"
                  >
                    <span>মতামত দিন (অংশগ্রহণ করুন)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feedback to Action Workflow Overview */}
        <div className="bg-slate-900 rounded-2xl p-8 text-white space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>আপনার মতামতের ভিত্তিতে প্রাতিষ্ঠানিক উন্নয়ন প্রক্রিয়া</span>
            </h3>
            <p className="text-sm text-slate-300">
              কীভাবে আপনার প্রতিটি প্রতিক্রিয়া যত্নসহকারে প্রাতিষ্ঠানিক সংস্কারে রূপান্তরিত হয়:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                ১
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">সংগ্রহ ও সংবেদনশীলতা রক্ষা</h4>
              <p className="text-xs text-slate-400">
                তথ্য সম্পূর্ণ গোপনীয়তা ও সুরক্ষা বজায় রেখে সংগৃহীত হয়।
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                ২
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">দায়িত্বশীল বিশ্লেষণ</h4>
              <p className="text-xs text-slate-400">
                মুহতামিম ও শিক্ষা সচিবালয় সরাসরি অভিযোগ ও পরামর্শ পর্যালোচনা করেন।
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                ৩
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">উন্নয়ন পদক্ষেপ ও হেল্পডেস্ক</h4>
              <p className="text-xs text-slate-400">
                জরুরি সমস্যা সমাধান ও সংস্কারের জন্য প্রাতিষ্ঠানিক টিকিট কার্যকর হয়।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
