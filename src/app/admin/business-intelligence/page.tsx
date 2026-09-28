"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface OverviewData {
  kpis: {
    activeStudents: number;
    todayAttendanceRate: number;
    overallPassRate: number;
    monthlyCollections: number;
    totalOutstanding: number;
    operatingExpenses: number;
    netOperatingBalance: number;
    fundsBalance: number;
    lowStockCount: number;
    openTicketsCount: number;
  };
  earlyWarnings: {
    totalActive: number;
    criticalCount: number;
    highCount: number;
    recentWarnings: any[];
  };
  anomalies: {
    detectedCount: number;
    recentAnomalies: any[];
  };
  dataQualityAdvisory: {
    hasOpenIssues: boolean;
    totalOpenIssues: number;
    criticalIssuesCount: number;
    advisoryBannerBn?: string;
  };
  generatedAt: string;
}

export default function BusinessIntelligencePage() {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "TRENDS" | "FORECAST" | "WARNINGS" | "SCENARIOS" | "DICTIONARY">("OVERVIEW");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Decision-Support State
  const [aiInsight, setAiInsight] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Trends Tab State
  const [selectedDomain, setSelectedDomain] = useState<"FINANCE" | "ATTENDANCE" | "STUDENTS">("FINANCE");
  const [trendData, setTrendData] = useState<any | null>(null);
  const [loadingTrends, setLoadingTrends] = useState(false);

  // Forecast Tab State
  const [forecastMetric, setForecastMetric] = useState("TOTAL_FEES_COLLECTED");
  const [forecastHorizon, setForecastHorizon] = useState(3);
  const [forecastResult, setForecastResult] = useState<any | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Warnings Tab State
  const [warnings, setWarnings] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loadingWarnings, setLoadingWarnings] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Scenarios Tab State
  const [scenarioType, setScenarioType] = useState<"BASE" | "CONSERVATIVE" | "STRESS" | "CUSTOM">("CONSERVATIVE");
  const [customCollectionDelta, setCustomCollectionDelta] = useState(-20);
  const [customExpenseDelta, setCustomExpenseDelta] = useState(10);
  const [scenarioResult, setScenarioResult] = useState<any | null>(null);
  const [loadingScenario, setLoadingScenario] = useState(false);

  // Metric Dictionary Tab State
  const [dictionaryMetrics, setDictionaryMetrics] = useState<any[]>([]);
  const [selectedDictDomain, setSelectedDictDomain] = useState<string>("ALL");

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bi/overview");
      const json = await res.json();
      if (json.success) {
        setOverview(json.data);
      } else {
        setError(json.error || "ওভারভিউ লোড করা যায়নি।");
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগে ত্রুটি।");
    } finally {
      setLoading(false);
    }
  };

  const fetchAiInsight = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/admin/bi/ai-insight");
      const json = await res.json();
      if (json.success) {
        setAiInsight(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const fetchTrends = async (domain: "FINANCE" | "ATTENDANCE" | "STUDENTS") => {
    setLoadingTrends(true);
    try {
      const res = await fetch(`/api/admin/bi/trends?domain=${domain}`);
      const json = await res.json();
      if (json.success) {
        setTrendData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrends(false);
    }
  };

  const runForecast = async () => {
    setLoadingForecast(true);
    try {
      const res = await fetch("/api/admin/bi/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metricKey: forecastMetric, horizon: forecastHorizon })
      });
      const json = await res.json();
      if (json.success) {
        setForecastResult(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingForecast(false);
    }
  };

  const fetchWarnings = async () => {
    setLoadingWarnings(true);
    try {
      const res = await fetch("/api/admin/bi/warnings");
      const json = await res.json();
      if (json.success) {
        setWarnings(json.data.warnings);
        setAnomalies(json.data.anomalies);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWarnings(false);
    }
  };

  const handleWarningStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/bi/warnings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes: "অ্যাডমিন প্যানেল থেকে হালনাগাদকৃত" })
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(`সতর্কতা #${id} সফলভাবে '${newStatus}' স্ট্যাটাসে পরিবর্তিত হয়েছে।`);
        fetchWarnings();
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runScenario = async () => {
    setLoadingScenario(true);
    try {
      const payload: any = { type: scenarioType, horizonMonths: 6 };
      if (scenarioType === "CUSTOM") {
        payload.collectionDeltaPct = customCollectionDelta;
        payload.expenseDeltaPct = customExpenseDelta;
      }
      const res = await fetch("/api/admin/bi/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setScenarioResult(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingScenario(false);
    }
  };

  const fetchDictionary = async () => {
    try {
      const res = await fetch("/api/admin/bi/metrics");
      const json = await res.json();
      if (json.success) {
        setDictionaryMetrics(json.data.metrics);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Switch tab triggers
  useEffect(() => {
    if (activeTab === "TRENDS" && !trendData) fetchTrends(selectedDomain);
    if (activeTab === "FORECAST" && !forecastResult) runForecast();
    if (activeTab === "WARNINGS") fetchWarnings();
    if (activeTab === "SCENARIOS" && !scenarioResult) runScenario();
    if (activeTab === "DICTIONARY" && dictionaryMetrics.length === 0) fetchDictionary();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-emerald-800 tracking-tight">
                  বিজনেস ইন্টেলিজেন্স ও ফোরকাস্টিং ইঞ্জিন
                </span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  PHASE 26
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা • সিদ্ধান্ত-সহায়তা, পূর্বাভাস ও পূর্বসতর্কতা
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/data-quality"
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
              >
                ডেটা কোয়ালিটি পোর্টাল
              </Link>
              <button
                onClick={fetchOverview}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-xs flex items-center gap-1.5"
              >
                <span>🔄</span> রিফ্রেশ
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto gap-2 mt-4 border-t border-slate-100 pt-2 no-scrollbar text-xs sm:text-sm font-medium">
            <button
              onClick={() => setActiveTab("OVERVIEW")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === "OVERVIEW"
                  ? "bg-emerald-800 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              📊 ওভারভিউ ও কেপিআই
            </button>
            <button
              onClick={() => setActiveTab("TRENDS")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === "TRENDS"
                  ? "bg-emerald-800 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              📈 ঐতিহাসিক ট্রেন্ড
            </button>
            <button
              onClick={() => setActiveTab("FORECAST")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === "FORECAST"
                  ? "bg-emerald-800 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              🔮 পরিসংখ্যানিক পূর্বাভাস
            </button>
            <button
              onClick={() => setActiveTab("WARNINGS")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === "WARNINGS"
                  ? "bg-emerald-800 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              ⚠️ পূর্বসতর্কতা ও অ্যানোমালি
            </button>
            <button
              onClick={() => setActiveTab("SCENARIOS")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === "SCENARIOS"
                  ? "bg-emerald-800 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              🎯 সিনারিও অ্যানালাইসিস (What-If)
            </button>
            <button
              onClick={() => setActiveTab("DICTIONARY")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === "DICTIONARY"
                  ? "bg-emerald-800 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              📖 মেট্রিক ডিকশনারি
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* DATA QUALITY ADVISORY BANNER (PHASE 25 INTEGRATION) */}
        {overview?.dataQualityAdvisory.hasOpenIssues && (
          <div className="mb-6 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 shadow-xs flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1 text-xs sm:text-sm">
              <div className="font-semibold text-amber-950">ডেটা কোয়ালিটি গভর্নেন্স সতর্কতা (Phase 25)</div>
              <p className="mt-0.5">
                {overview.dataQualityAdvisory.advisoryBannerBn ||
                  `নির্বাচিত ডেটাসেটে ${overview.dataQualityAdvisory.totalOpenIssues}টি অমীমাংসিত কোয়ালিটি ইস্যু রয়েছে।`}
              </p>
              <Link
                href="/admin/data-quality"
                className="inline-block mt-2 font-medium text-emerald-800 underline hover:text-emerald-950"
              >
                ডেটা কোয়ালিটি কিউতে বিস্তারিত দেখুন ও সংশোধন করুন →
              </Link>
            </div>
          </div>
        )}

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">মোট শিক্ষার্থী</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {overview ? overview.kpis.activeStudents.toLocaleString("bn-BD") : "..."} জন
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">সক্রিয় শিক্ষাবর্ষে নিবন্ধিত</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">আজকের উপস্থিতি</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {overview ? `${overview.kpis.todayAttendanceRate}%` : "..."}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">উপস্থিত ও বিলম্বিত শিক্ষার্থী</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">সার্বিক পাসের হার</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {overview ? `${overview.kpis.overallPassRate}%` : "..."}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">প্রকাশিত পরীক্ষা ফলাফল</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">মাসিক ফি আদায়</span>
                <div className="text-2xl font-bold text-emerald-700 mt-1">
                  ৳{overview ? overview.kpis.monthlyCollections.toLocaleString("bn-BD") : "..."}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">চলতি মাসে সংগৃহীত</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">অনাদায়ী বকেয়া</span>
                <div className="text-2xl font-bold text-rose-600 mt-1">
                  ৳{overview ? overview.kpis.totalOutstanding.toLocaleString("bn-BD") : "..."}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">মোট অনাদায়ী শিক্ষার্থী ফি</div>
              </div>
            </div>

            {/* AI Decision-Support Layer (Phase 21/22 Integration) */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-700/50 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold tracking-tight">
                      এআই প্রাতিষ্ঠানিক সিদ্ধান্ত-সহায়তা ও বিশ্লেষণ (Decision-Support)
                    </h2>
                    <p className="text-xs text-emerald-200">
                      Phase 21/22 সমন্বিত • তথ্যভিত্তিক বাস্তব পর্যবেক্ষণ (Hallucination-Protected)
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchAiInsight}
                  disabled={loadingAi}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-sm self-start sm:self-auto"
                >
                  {loadingAi ? "বিশ্লেষণ হচ্ছে..." : "✨ এআই সারসংক্ষেপ তৈরি করুন"}
                </button>
              </div>

              {aiInsight ? (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                    <div className="font-semibold text-emerald-300 mb-1">নির্বাহী পর্যবেক্ষণ (Executive Summary):</div>
                    <p className="leading-relaxed text-slate-100">{aiInsight.executiveInsightBn}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-950/40 rounded-xl p-4 border border-emerald-500/20">
                      <div className="font-semibold text-emerald-300 mb-2 flex items-center gap-1.5">
                        <span>✅</span> ইতিবাচক অগ্রগতি:
                      </div>
                      <ul className="space-y-1 text-slate-200 list-disc list-inside">
                        {aiInsight.positiveTrendsBn.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-rose-950/40 rounded-xl p-4 border border-rose-500/20">
                      <div className="font-semibold text-rose-300 mb-2 flex items-center gap-1.5">
                        <span>⚠️</span> নজরদারি ও ঝুঁকি ক্ষেত্র:
                      </div>
                      <ul className="space-y-1 text-slate-200 list-disc list-inside">
                        {aiInsight.concerningPatternsBn.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="font-semibold text-teal-300 mb-1">সুপারিশকৃত ব্যবস্থাপনা পদক্ষেপ:</div>
                    <ul className="space-y-1 text-slate-200 list-decimal list-inside">
                      {aiInsight.recommendedActionsBn.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Evidence Citations */}
                  <div className="text-[11px] text-slate-400 border-t border-white/10 pt-3">
                    <div className="font-semibold text-slate-300 mb-1">উৎস ও প্রমাণাদি (Evidence Citations):</div>
                    <div className="flex flex-wrap gap-2">
                      {aiInsight.evidenceCitations.map((c: any, i: number) => (
                        <span key={i} className="bg-black/30 px-2 py-1 rounded border border-white/5">
                          {c.metricNameBn}: <strong>{c.value}</strong> ({c.sourceEntity})
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-slate-400 italic">{aiInsight.ethicalNoticeBn}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-emerald-200/80 text-xs sm:text-sm">
                  মাদরাসার সর্বশেষ আর্থিক, শিক্ষার্থী, উপস্থিতি এবং অপারেশনাল তথ্যের সমন্বিত এআই সিদ্ধান্ত-সহায়তা দেখতে উপরের বাটনে ক্লিক করুন।
                </div>
              )}
            </div>

            {/* Quick Warning Ticker & Cash Runway Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>⚠️</span> সক্রিয় পূর্বসতর্কতা
                  </h3>
                  <span className="text-xs bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded-full">
                    {overview?.earlyWarnings.totalActive || 0}টি সক্রিয়
                  </span>
                </div>
                {overview?.earlyWarnings.recentWarnings.length ? (
                  <div className="space-y-2">
                    {overview.earlyWarnings.recentWarnings.map((w, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{w.titleBn}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            w.severity === "CRITICAL" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {w.severity}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{w.messageBn}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 py-4 text-center">কোনো সক্রিয় জরুরি পূর্বসতর্কতা নেই।</div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>🏦</span> তহবিল ও নগদ ব্যালেন্স স্থিতি
                  </h3>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    ৫টি অনুমোদিত ফান্ড
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium">মোট ক্যাশ ও ব্যাংক স্থিতি:</span>
                    <span className="font-bold text-emerald-800">
                      ৳{overview ? overview.kpis.fundsBalance.toLocaleString("bn-BD") : "..."}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium">মাসিক পরিচালন ব্যয় (OPEX):</span>
                    <span className="font-bold text-slate-900">
                      ৳{overview ? overview.kpis.operatingExpenses.toLocaleString("bn-BD") : "..."}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium">নিট অপারেটিং ব্যালেন্স:</span>
                    <span className={`font-bold ${
                      (overview?.kpis.netOperatingBalance || 0) >= 0 ? "text-emerald-700" : "text-rose-600"
                    }`}>
                      ৳{overview ? overview.kpis.netOperatingBalance.toLocaleString("bn-BD") : "..."}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    *শরিয়াহ নীতি অনুসারে সাধারণ, যাকাত ও লিল্লাহ ফান্ড পৃথক খতিয়ানে পরিচালিত হয়।
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HISTORICAL TRENDS */}
        {activeTab === "TRENDS" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">ঐতিহাসিক ট্রেন্ড বিশ্লেষণ (Trend Analytics)</h3>
                <p className="text-xs text-slate-500 mt-0.5">মাদরাসার বহু-মেয়াদী তথ্যভিত্তিক পরিবর্তন ও গতিধারা</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedDomain("FINANCE"); fetchTrends("FINANCE"); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    selectedDomain === "FINANCE" ? "bg-emerald-800 text-white border-emerald-800" : "border-slate-300 text-slate-700"
                  }`}
                >
                  আর্থিক আদায়
                </button>
                <button
                  onClick={() => { setSelectedDomain("ATTENDANCE"); fetchTrends("ATTENDANCE"); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    selectedDomain === "ATTENDANCE" ? "bg-emerald-800 text-white border-emerald-800" : "border-slate-300 text-slate-700"
                  }`}
                >
                  উপস্থিতি
                </button>
                <button
                  onClick={() => { setSelectedDomain("STUDENTS"); fetchTrends("STUDENTS"); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    selectedDomain === "STUDENTS" ? "bg-emerald-800 text-white border-emerald-800" : "border-slate-300 text-slate-700"
                  }`}
                >
                  শিক্ষার্থী ভর্তি
                </button>
              </div>
            </div>

            {loadingTrends ? (
              <div className="text-center py-12 text-slate-500 text-xs">ট্রেন্ড লোড হচ্ছে...</div>
            ) : trendData ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500">সূচক:</span>{" "}
                    <strong className="text-slate-900">{trendData.metricNameBn}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">গতিধারা:</span>{" "}
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      trendData.direction === "UP" ? "bg-emerald-100 text-emerald-800" :
                      trendData.direction === "DOWN" ? "bg-rose-100 text-rose-800" : "bg-slate-200 text-slate-800"
                    }`}>
                      {trendData.direction === "UP" ? "↑ ঊর্ধ্বমুখী (UP)" : trendData.direction === "DOWN" ? "↓ নিম্নমুখী (DOWN)" : "↔ স্থিতিশীল (STABLE)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">পরিবর্তন:</span>{" "}
                    <strong className="text-slate-900">{trendData.percentageChange}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ভলাটিলিটি:</span>{" "}
                    <strong className="text-slate-900">{trendData.volatility}</strong>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-3">সময়কাল (Period)</th>
                        <th className="p-3">পরিমাপকৃত মান ({trendData.unitBn})</th>
                        <th className="p-3">তুলনামূলক তথ্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trendData.series.map((pt: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-3 font-medium text-slate-800">{pt.periodLabel}</td>
                          <td className="p-3 font-bold text-slate-900">
                            {pt.metricValue.toLocaleString("bn-BD")} {trendData.unitBn}
                          </td>
                          <td className="p-3 text-slate-500">
                            {pt.secondaryValue ? `মোট নমুনা: ${pt.secondaryValue}` : "স্বাভাবিক পরিসর"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 3: STATISTICAL FORECAST LAB */}
        {activeTab === "FORECAST" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">পরিসংখ্যানিক পূর্বাভাস ল্যাব (Statistical Forecasting)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  মুভিং এভারেজ, এক্সপোনেনশিয়াল স্মুথিং ও লিনিয়ার রিগ্রেশন ভিত্তিক প্রক্ষেপণ
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={forecastMetric}
                  onChange={(e) => setForecastMetric(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="TOTAL_FEES_COLLECTED">মাসিক ফি আদায় (Collections)</option>
                  <option value="TOTAL_OPERATING_EXPENSES">মাসিক পরিচালন ব্যয় (OPEX)</option>
                  <option value="ACTIVE_STUDENTS_COUNT">শিক্ষার্থী ভর্তি ও ধারণ (Enrollment)</option>
                  <option value="INVENTORY_RUNWAY">ইনভেন্টরি স্টকআউট রানওয়ে (Inventory)</option>
                </select>

                <select
                  value={forecastHorizon}
                  onChange={(e) => setForecastHorizon(Number(e.target.value))}
                  className="text-xs border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value={1}>১টি সময়কাল (Horizon 1)</option>
                  <option value={3}>৩টি সময়কাল (Horizon 3)</option>
                  <option value={6}>৬টি সময়কাল (Horizon 6)</option>
                </select>

                <button
                  onClick={runForecast}
                  disabled={loadingForecast}
                  className="text-xs font-semibold px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg transition"
                >
                  {loadingForecast ? "গণনা হচ্ছে..." : "পূর্বাভাস তৈরি করুন"}
                </button>
              </div>
            </div>

            {loadingForecast ? (
              <div className="text-center py-12 text-slate-500 text-xs">পূর্বাভাস গণনা হচ্ছে...</div>
            ) : forecastResult ? (
              <div className="space-y-5">
                {/* RULE 5: Insufficient Data Guard Display */}
                {forecastResult.status === "INSUFFICIENT_DATA" ? (
                  <div className="p-5 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 text-xs sm:text-sm">
                    <div className="font-bold flex items-center gap-2 text-amber-900 mb-1">
                      <span>⚠️</span> তথ্যের স্বল্পতা সংক্রান্ত সতর্কর্তা (Rule 5: Insufficient Historical Data)
                    </div>
                    <p className="leading-relaxed">{forecastResult.disclaimerBn}</p>
                    <p className="mt-2 text-[11px] text-amber-800 font-mono italic">
                      {forecastResult.disclaimerEn}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 text-xs">
                      <div>
                        <span className="text-slate-500">মডেল মেথডোলজি:</span>{" "}
                        <strong className="text-slate-900">{forecastResult.methodology}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">কনফিডেন্স লেভেল:</span>{" "}
                        <strong className="text-emerald-800">৯৫% আত্মবিশ্বাস সীমা</strong>
                      </div>
                      {forecastResult.backtest && (
                        <div>
                          <span className="text-slate-500">ব্যাকটেস্টিং ত্রুটি হার (MAPE):</span>{" "}
                          <strong className="text-slate-900">{forecastResult.backtest.mape}%</strong>
                        </div>
                      )}
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="p-3">ভবিষ্যৎ সময়কাল</th>
                            <th className="p-3">প্রক্ষেপিত মান (Predicted)</th>
                            <th className="p-3">সর্বনিম্ন সীমা (Lower 95%)</th>
                            <th className="p-3">সর্বোচ্চ সীমা (Upper 95%)</th>
                            <th className="p-3">নির্ভরযোগ্যতা</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {forecastResult.forecastPoints.map((fp: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-800">{fp.periodLabel}</td>
                              <td className="p-3 font-bold text-emerald-800">
                                {fp.predictedValue.toLocaleString("bn-BD")}
                              </td>
                              <td className="p-3 text-slate-600 font-mono">
                                {fp.lowerBound.toLocaleString("bn-BD")}
                              </td>
                              <td className="p-3 text-slate-600 font-mono">
                                {fp.upperBound.toLocaleString("bn-BD")}
                              </td>
                              <td className="p-3">
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                                  {Math.round(fp.confidenceLevel * 100)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-[11px] text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {forecastResult.disclaimerBn}
                    </p>
                  </>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 4: EARLY WARNINGS & ANOMALIES */}
        {activeTab === "WARNINGS" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">প্রাতিষ্ঠানিক পূর্বসতর্কতা ও অ্যানোমালি সেন্টার</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  বহু-ডোমেইন সতর্কীকরণ রুলস ও পরিসংখ্যানিক অসংগতি পর্যবেক্ষণ
                </p>
              </div>
              <button
                onClick={fetchWarnings}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition self-start sm:self-auto"
              >
                🔄 স্ক্যান রান করুন
              </button>
            </div>

            {actionSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {actionSuccessMsg}
              </div>
            )}

            {/* Warnings Queue */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">সক্রিয় সতর্কবার্তাসমূহ</h4>
              {warnings.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center">কোনো সক্রিয় সতর্কতা নেই।</div>
              ) : (
                warnings.map((w, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition shadow-2xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          w.severity === "CRITICAL" ? "bg-rose-100 text-rose-800 border border-rose-300" :
                          w.severity === "HIGH" ? "bg-orange-100 text-orange-800 border border-orange-300" :
                          "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}>
                          {w.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{w.titleBn}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({w.ruleCode})</span>
                      </div>
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <span className="text-[11px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-medium">
                          {w.status}
                        </span>
                        {w.status === "DETECTED" && (
                          <button
                            onClick={() => handleWarningStatus(w.warningId, "ACKNOWLEDGED")}
                            className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition font-medium"
                          >
                            অবহিত (Acknowledge)
                          </button>
                        )}
                        {w.status === "ACKNOWLEDGED" && (
                          <button
                            onClick={() => handleWarningStatus(w.warningId, "INVESTIGATING")}
                            className="text-[11px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 hover:bg-purple-200 transition font-medium"
                          >
                            তদন্তাধীন (Investigate)
                          </button>
                        )}
                        {(w.status === "DETECTED" || w.status === "ACKNOWLEDGED" || w.status === "INVESTIGATING") && (
                          <button
                            onClick={() => handleWarningStatus(w.warningId, "RESOLVED")}
                            className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition font-medium"
                          >
                            মীমাংসিত (Resolve)
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700">{w.messageBn}</p>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-4 pt-1 border-t border-slate-200/60">
                      <span>পরিমাপকৃত মান: <strong>{String(w.observedValue)}</strong></span>
                      <span>থ্রেশহোল্ড: <strong>{String(w.thresholdValue)}</strong></span>
                      <span>সনাক্তের সময়: {new Date(w.detectedAt).toLocaleString("bn-BD")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Statistical Anomalies List */}
            {anomalies.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">পরিসংখ্যানিক অসংগতি (Z-Score & Baseline Anomalies)</h4>
                <div className="space-y-2">
                  {anomalies.map((anom, idx) => (
                    <div key={idx} className="p-3 bg-purple-50/50 rounded-lg border border-purple-200 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-purple-950">{anom.descriptionBn}</span>
                        <span className="text-[10px] bg-purple-200 text-purple-900 font-mono px-2 py-0.5 rounded font-bold">
                          Z-Score: {anom.zScore}
                        </span>
                      </div>
                      <div className="text-[11px] text-purple-800 mt-1 flex gap-4">
                        <span>সময়কাল: {anom.periodLabel}</span>
                        <span>বিচ্যুতি: {anom.deviationPercent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SCENARIO ANALYSIS (WHAT-IF SIMULATOR) */}
        {activeTab === "SCENARIOS" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">আর্থিক ও পরিচালন সিনারিও সিমুলেটর (What-If Analysis)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ভবিষ্যতের সম্ভাব্য আর্থিক চাপ ও নগদ তহবিল রানওয়ে প্রক্ষেপণ
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setScenarioType("BASE"); setTimeout(runScenario, 50); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    scenarioType === "BASE" ? "bg-emerald-800 text-white border-emerald-800" : "border-slate-300 text-slate-700"
                  }`}
                >
                  বেস ট্রেন্ড (Base)
                </button>
                <button
                  onClick={() => { setScenarioType("CONSERVATIVE"); setTimeout(runScenario, 50); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    scenarioType === "CONSERVATIVE" ? "bg-emerald-800 text-white border-emerald-800" : "border-slate-300 text-slate-700"
                  }`}
                >
                  রক্ষণশীল (Conservative)
                </button>
                <button
                  onClick={() => { setScenarioType("STRESS"); setTimeout(runScenario, 50); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    scenarioType === "STRESS" ? "bg-emerald-800 text-white border-emerald-800" : "border-slate-300 text-slate-700"
                  }`}
                >
                  চরম চাপ (Stress -30%)
                </button>
                <button
                  onClick={() => { setScenarioType("CUSTOM"); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    scenarioType === "CUSTOM" ? "bg-emerald-800 text-white border-emerald-800" : "border-slate-300 text-slate-700"
                  }`}
                >
                  কাস্টম স্লাইডার
                </button>
              </div>
            </div>

            {/* Custom Sliders if Custom is Selected */}
            {scenarioType === "CUSTOM" && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    ফি আদায় বৃদ্ধি বা হ্রাস: {customCollectionDelta}%
                  </label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={customCollectionDelta}
                    onChange={(e) => setCustomCollectionDelta(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    পরিচালন ব্যয় বৃদ্ধি বা হ্রাস: {customExpenseDelta}%
                  </label>
                  <input
                    type="range"
                    min="-30"
                    max="50"
                    value={customExpenseDelta}
                    onChange={(e) => setCustomExpenseDelta(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    onClick={runScenario}
                    className="text-xs font-semibold px-4 py-2 bg-emerald-800 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    কাস্টম সিমুলেশন চালান
                  </button>
                </div>
              </div>
            )}

            {/* Governed Hypothetical Watermark Banner */}
            <div className="p-3 bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-between">
              <span>⚠️ অনুমানভিত্তিক মডেল (Hypothetical Simulation) — এটি কোনো আসল লেজার বা বাজেট নয়।</span>
              <span className="bg-slate-300 text-slate-900 text-[10px] px-2 py-0.5 rounded font-mono">IS_HYPOTHETICAL: TRUE</span>
            </div>

            {loadingScenario ? (
              <div className="text-center py-12 text-slate-500 text-xs">সিনারিও হিসাব হচ্ছে...</div>
            ) : scenarioResult ? (
              <div className="space-y-5">
                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-semibold block">মাসিক প্রত্যাশিত আদায়</span>
                    <strong className="text-lg text-slate-900 mt-1 block">
                      ৳{scenarioResult.monthlyProjections[0]?.projectedCollections.toLocaleString("bn-BD")}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-semibold block">মাসিক প্রত্যাশিত ব্যয়</span>
                    <strong className="text-lg text-slate-900 mt-1 block">
                      ৳{scenarioResult.monthlyProjections[0]?.projectedExpenses.toLocaleString("bn-BD")}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-semibold block">ক্যাশ রানওয়ে (Runway)</span>
                    <strong className={`text-lg mt-1 block ${
                      scenarioResult.summary.cashRunwayMonths === "SUSTAINABLE" ? "text-emerald-700" : "text-rose-600"
                    }`}>
                      {scenarioResult.summary.cashRunwayMonths === "SUSTAINABLE" ? "স্থিতিশীল (Sustainable)" : `${scenarioResult.summary.cashRunwayMonths} মাস`}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-semibold block">ঝুঁকি মূল্যায়ন</span>
                    <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded ${
                      scenarioResult.summary.riskClassification === "HEALTHY" ? "bg-emerald-100 text-emerald-800" :
                      scenarioResult.summary.riskClassification === "MODERATE_RISK" ? "bg-amber-100 text-amber-800" :
                      "bg-rose-100 text-rose-800"
                    }`}>
                      {scenarioResult.summary.riskClassification}
                    </span>
                  </div>
                </div>

                {/* Risk and Recommendation */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="text-slate-800">
                    <span className="font-bold text-slate-900">প্রধান ঝুঁকি বিবেচনা:</span> {scenarioResult.summary.primaryRiskFactorBn}
                  </div>
                  <div className="text-emerald-900 font-medium">
                    <span className="font-bold">ব্যবস্থাপনা পরামর্শ:</span> {scenarioResult.summary.recommendationBn}
                  </div>
                </div>

                {/* Monthly Projections Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-3">মাস</th>
                        <th className="p-3">প্রক্ষেপিত আদায়</th>
                        <th className="p-3">প্রক্ষেপিত ব্যয়</th>
                        <th className="p-3">মাসিক নগদ উদ্বৃত্ত (Net)</th>
                        <th className="p-3">সমাপনী নগদ রিজার্ভ</th>
                        <th className="p-3">অবস্থা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scenarioResult.monthlyProjections.map((p: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-800">{p.periodLabel}</td>
                          <td className="p-3 text-emerald-800 font-medium">
                            ৳{p.projectedCollections.toLocaleString("bn-BD")}
                          </td>
                          <td className="p-3 text-slate-700">
                            ৳{p.projectedExpenses.toLocaleString("bn-BD")}
                          </td>
                          <td className={`p-3 font-bold ${p.netCashFlow >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                            ৳{p.netCashFlow.toLocaleString("bn-BD")}
                          </td>
                          <td className={`p-3 font-bold font-mono ${p.projectedClosingReserve >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                            ৳{p.projectedClosingReserve.toLocaleString("bn-BD")}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              !p.isDeficit ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}>
                              {!p.isDeficit ? "উদ্বৃত্ত" : "ঘাটতি"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 6: GOVERNED METRIC DICTIONARY */}
        {activeTab === "DICTIONARY" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">গভর্নড মেট্রিক ডিকশনারি ও ক্যাটালগ (Metric Governance)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  সকল প্রাতিষ্ঠানিক কেপিআই এর সংজ্ঞায়ন, গণনার সূত্র, দায়িত্বপ্রাপ্ত ও ভার্সন ইতিহাস
                </p>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedDictDomain}
                  onChange={(e) => setSelectedDictDomain(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="ALL">সকল ডোমেইন (All Domains)</option>
                  <option value="STUDENT">শিক্ষার্থী (Student)</option>
                  <option value="ATTENDANCE">উপস্থিতি (Attendance)</option>
                  <option value="ACADEMIC">পরীক্ষা ও ফলাফল (Academic)</option>
                  <option value="FINANCE">অর্থ ও রাজস্ব (Finance)</option>
                  <option value="FUND">শরিয়াহ ফান্ড (Fund)</option>
                  <option value="INVENTORY">ইনভেন্টরি (Inventory)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">কোড ও নাম</th>
                    <th className="p-3">ডোমেইন</th>
                    <th className="p-3">গণনার সূত্র (Formula)</th>
                    <th className="p-3">উৎস মডেল (Authoritative Source)</th>
                    <th className="p-3">ভার্সন ও মালিকানা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dictionaryMetrics
                    .filter((m) => selectedDictDomain === "ALL" || m.domain === selectedDictDomain)
                    .map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{m.nameBn}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{m.code}</div>
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                            {m.domain}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 font-mono text-[11px] max-w-xs break-words">
                          {m.versions[0]?.formulaBn}
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{m.authoritativeEntity}</td>
                        <td className="p-3">
                          <div className="font-semibold text-emerald-800">v{m.currentVersion}</div>
                          <div className="text-[10px] text-slate-500">মালিক: {m.ownerRole}</div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
