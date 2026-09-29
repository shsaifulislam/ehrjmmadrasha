"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  EyeOff,
  UserCheck,
  BookOpen,
} from "lucide-react";

export default function PortalSurveysPage() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");

  useEffect(() => {
    fetch("/api/portal/surveys")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSurveys(data.data || []);
        }
      })
      .catch((err) => console.error("Error fetching portal surveys:", err))
      .finally(() => setLoading(false));
  }, []);

  const pendingSurveys = surveys.filter((s) => !s.hasResponded);
  const completedSurveys = surveys.filter((s) => s.hasResponded);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit mb-2">
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>প্রাতিষ্ঠানিক মতামত ও মূল্যায়ন পোর্টাল</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              আপনার মতামত ও পর্যালোচনা
            </h1>
            <p className="text-sm text-slate-600">
              মাদরাসার শিক্ষা, হোস্টেল ও প্রশাসনিক সেবা সম্পর্কে আপনার সুচিন্তিত মতামত দিন।
            </p>
          </div>

          <Link
            href="/portal"
            className="self-start sm:self-center px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            মূল পোর্টালে ফিরুন
          </Link>
        </div>

        {/* Invariant & Privacy Card */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm text-slate-600">
            <p className="font-bold text-slate-900">
              গোপনীয়তা ও আমানতদারিতা সুরক্ষা (Privacy Assurance)
            </p>
            <p>
              জরিপে প্রদত্ত আপনার মতামত দায়িত্বশীল কর্তৃপক্ষের নীতি নির্ধারণ ও মানোন্নয়নে ব্যবহৃত হয়। স্বয়ংক্রিয়ভাবে কোনো শিক্ষার্থীর একাডেমিক ফলাফল, ফি বা অবস্থানে প্রভাব ফেলবে না।
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>অংশগ্রহণযোগ্য জরিপসমূহ</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
              {pendingSurveys.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "completed"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>সম্পন্ন মতামত</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
              {completedSurveys.length}
            </span>
          </button>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200"></div>
            ))}
          </div>
        ) : activeTab === "pending" ? (
          pendingSurveys.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                এই মুহূর্তে কোনো জরিপ বাকি নেই
              </h3>
              <p className="text-sm text-slate-500">
                সকল প্রয়োজনীয় জরিপ বা মূল্যায়নে আপনি ইতিমধ্যে অংশগ্রহণ করেছেন। নতুন কোনো মূল্যায়ন আসলে তা এখানে দৃশ্যমান হবে।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSurveys.map((survey) => (
                <div
                  key={survey.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {survey.surveyType}
                      </span>
                      {survey.responseMode === "ANONYMOUS" ? (
                        <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <EyeOff className="w-3 h-3" />
                          <span>বেনামী</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          <UserCheck className="w-3 h-3" />
                          <span>সুরক্ষিত পরিচয়</span>
                        </span>
                      )}
                      <span className="text-slate-400">সংস্করণ {survey.version}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {survey.titleBn}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {survey.descriptionBn}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>প্রশ্নের সংখ্যা: {survey.questions.length} টি</span>
                      <span>মেয়াদ শেষ: {new Date(survey.endDate).toLocaleDateString("bn-BD")}</span>
                    </div>
                  </div>

                  <Link
                    href={`/surveys/${survey.id}`}
                    className="shrink-0 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <span>মতামত দিন</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )
        ) : (
          completedSurveys.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">কোনো সম্পন্ন জরিপ পাওয়া যায়নি</h3>
              <p className="text-sm text-slate-500">
                আপনি এখনও কোনো জরিপ সম্পন্ন করেননি।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedSurveys.map((survey) => (
                <div
                  key={survey.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>দাখিল সম্পন্ন</span>
                      </span>
                      <span className="text-slate-400 font-mono text-xs">
                        রেফারেন্স: {survey.responseId}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {survey.titleBn}
                    </h3>
                    <p className="text-xs text-slate-500">
                      দাখিলের তারিখ: {survey.submittedAt ? new Date(survey.submittedAt).toLocaleDateString("bn-BD") : "নির্ধারিত"}
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    আমানতদারিতার সাথে সংরক্ষিত
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
