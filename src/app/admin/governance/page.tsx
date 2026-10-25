"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardData {
  institutionHeader: {
    nameBn: string;
    nameEn: string;
    subtitleBn: string;
  };
  stats: {
    totalRisks: number;
    openRisks: number;
    criticalRisks: number;
    highRisks: number;
    mediumRisks: number;
    lowRisks: number;
    mitigatedRisks: number;
    acceptedRisks: number;
    totalControls: number;
    activeControls: number;
    effectiveControls: number;
    partiallyEffectiveControls: number;
    ineffectiveControls: number;
    untestedControls: number;
    controlHealthPercentage: number;
    totalFindings: number;
    openFindings: number;
    overdueFindings: number;
    pendingVerificationFindings: number;
    totalActions: number;
    completedActions: number;
    overdueActions: number;
    activeExceptionsCount: number;
    upcomingReviewsCount: number;
  };
  gapAnalysis: {
    uncontrolledRisks: string[];
    ineffectiveControls: string[];
    criticalRisksWithWeakControls: string[];
  };
  matrixDistribution: Record<string, { count: number; riskIds: string[] }>;
  crossModuleProbes: {
    moduleName: string;
    isCompliant: boolean;
    activeRiskLevel: string;
    findingsCount: number;
    healthSummaryBn: string;
    factualChecks: {
      checkNameBn: string;
      status: "PASS" | "WARN" | "FAIL";
      detailsBn: string;
    }[];
  }[];
  recentAudit: {
    id: string;
    timestamp: string;
    action: string;
    actorName: string;
    notes: string;
  }[];
}

export default function GovernanceDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/governance/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || "ড্যাশবোর্ড ডেটা লোড করা যায়নি।");
      }
    } catch (err: any) {
      setError(err.message || "নেটওয়ার্ক সমস্যা।");
    } finally {
      setLoading(false);
    }
  };

  const getCellColor = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    if (score >= 15) return "bg-rose-500/30 text-rose-300 border-rose-500/50 hover:bg-rose-500/50";
    if (score >= 10) return "bg-amber-500/30 text-amber-300 border-amber-500/50 hover:bg-amber-500/50";
    if (score >= 5) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/40";
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/40";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">সুশাসন ও নিয়ন্ত্রণ ড্যাশবোর্ড প্রস্তুত হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md text-center space-y-4">
          <div className="text-rose-400 text-3xl">⚠️</div>
          <h2 className="text-lg font-bold text-white">ড্যাশবোর্ড লোড ত্রুটি</h2>
          <p className="text-slate-300 text-sm">{error || "ডেটা অনুপস্থিত।"}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  const { stats, gapAnalysis, matrixDistribution, crossModuleProbes, recentAudit } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Institution Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Phase 42 Assurance
            </span>
            <span className="text-slate-500 text-xs font-mono">EHRJ-AI-2026-PHASE42</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            {data.institutionHeader.nameBn}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {data.institutionHeader.subtitleBn}
          </p>
        </div>

        {/* Quick Nav Action Links */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/governance/risks"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-medium transition"
          >
            ঝুঁকি রেজিস্টার
          </Link>
          <Link
            href="/admin/governance/controls"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-medium transition"
          >
            অভ্যন্তরীণ নিয়ন্ত্রণ
          </Link>
          <Link
            href="/admin/governance/findings"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-medium transition"
          >
            পর্যবেক্ষণ (Findings)
          </Link>
          <Link
            href="/admin/governance/actions"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-medium transition"
          >
            CAPA বোর্ড
          </Link>
          <Link
            href="/admin/governance/risks/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/30 transition flex items-center gap-1.5"
          >
            <span>+</span> নতুন ঝুঁকি
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400">সক্রিয় ঝুঁকি</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.openRisks}</div>
          <div className="text-[11px] text-slate-500 mt-1">মোট: {stats.totalRisks} টি</div>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/30 p-4 rounded-2xl">
          <div className="text-xs text-rose-400">উচ্চ ও সংকটজনক</div>
          <div className="text-2xl font-bold text-rose-300 mt-1">
            {stats.criticalRisks + stats.highRisks}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1">
            ক্রিটিকাল {stats.criticalRisks} | উচ্চ {stats.highRisks}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl">
          <div className="text-xs text-emerald-400">নিয়ন্ত্রণ স্বাস্থ্য</div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">
            {stats.controlHealthPercentage}%
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            কার্যকর: {stats.effectiveControls} / {stats.activeControls}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 p-4 rounded-2xl">
          <div className="text-xs text-amber-400">অনিষ্পন্ন ফাইন্ডিংস</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{stats.openFindings}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            অপেক্ষমান: {stats.pendingVerificationFindings}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/30 p-4 rounded-2xl">
          <div className="text-xs text-rose-400">সময়োত্তীর্ণ ব্যবস্থা (CAPA)</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{stats.overdueActions}</div>
          <div className="text-[11px] text-slate-500 mt-1">মোট অ্যাকশন: {stats.totalActions}</div>
        </div>

        <div className="bg-slate-900/90 border border-indigo-500/30 p-4 rounded-2xl">
          <div className="text-xs text-indigo-400">ব্যতিক্রম ও পর্যালোচনা</div>
          <div className="text-2xl font-bold text-indigo-300 mt-1">
            {stats.activeExceptionsCount}
          </div>
          <div className="text-[11px] text-indigo-400/80 mt-1">
            আসন্ন সেশন: {stats.upcomingReviewsCount}
          </div>
        </div>
      </div>

      {/* Control Gap Warning Banner (if gaps exist) */}
      {(gapAnalysis.uncontrolledRisks.length > 0 || gapAnalysis.ineffectiveControls.length > 0) && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 text-2xl">⚠️</span>
            <div>
              <h3 className="text-sm font-semibold text-amber-200">
                অভ্যন্তরীণ নিয়ন্ত্রণ ব্যবস্থায় ঘাটতি চিহ্নিত
              </h3>
              <p className="text-xs text-amber-300/80">
                {gapAnalysis.uncontrolledRisks.length > 0 &&
                  `নিয়ন্ত্রণহীন ঝুঁকি: ${gapAnalysis.uncontrolledRisks.join(", ")}. `}
                {gapAnalysis.ineffectiveControls.length > 0 &&
                  `অকার্যকর নিয়ন্ত্রণ: ${gapAnalysis.ineffectiveControls.join(", ")}.`}
              </p>
            </div>
          </div>
          <Link
            href="/admin/governance/controls"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition"
          >
            নিয়ন্ত্রণ পরীক্ষা করুন
          </Link>
        </div>
      )}

      {/* Main Grid: 5x5 Heatmap Matrix + Cross-Module Probes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 5x5 Heatmap Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>📊</span> প্রাতিষ্ঠানিক ঝুঁকি ম্যাট্রিক্স (৫×৫ Heatmap)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                সম্ভাব্যতা (Likelihood) × প্রভাব (Impact) = অবশিষ্ট ঝুঁকি মাত্রা
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> কম
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-yellow-500"></span> মধ্যম
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> উচ্চ
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500"></span> সংকটজনক
              </span>
            </div>
          </div>

          {/* 5x5 Grid Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[450px]">
              <div className="grid grid-cols-6 gap-1.5 text-center text-xs">
                {/* Header row for Impact */}
                <div className="font-semibold text-slate-400 py-1">সম্ভাব্যতা \ প্রভাব</div>
                <div className="font-semibold text-slate-400 py-1">১ (সামান্য)</div>
                <div className="font-semibold text-slate-400 py-1">২ (ছোট)</div>
                <div className="font-semibold text-slate-400 py-1">৩ (মাঝারি)</div>
                <div className="font-semibold text-slate-400 py-1">৪ (গুরুতর)</div>
                <div className="font-semibold text-slate-400 py-1">৫ (চরম)</div>

                {/* Rows from Likelihood 5 down to 1 */}
                {[5, 4, 3, 2, 1].map((likelihood) => (
                  <React.Fragment key={`row-${likelihood}`}>
                    <div className="flex items-center justify-center font-semibold text-slate-400 bg-slate-800/40 rounded-lg p-1 text-[11px]">
                      {likelihood === 5
                        ? "৫ (নিশ্চিত)"
                        : likelihood === 4
                        ? "৪ (সম্ভাব্য)"
                        : likelihood === 3
                        ? "৩ (মাঝারি)"
                        : likelihood === 2
                        ? "২ (অসম্ভাব্য)"
                        : "১ (বিরল)"}
                    </div>
                    {[1, 2, 3, 4, 5].map((impact) => {
                      const key = `${likelihood}_${impact}`;
                      const cell = matrixDistribution[key] || { count: 0, riskIds: [] };
                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${getCellColor(
                            likelihood,
                            impact
                          )}`}
                          title={`স্কোর: ${likelihood * impact} | ঝুঁকি: ${cell.riskIds.join(", ") || "নেই"}`}
                        >
                          <span className="text-base font-bold">{cell.count}</span>
                          <span className="text-[10px] opacity-75">
                            {cell.count > 0 ? `${cell.count}টি ঝুঁকি` : "-"}
                          </span>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 italic text-right">
            * ম্যাট্রিক্সে প্রদর্শিত সংখ্যা সক্রিয় ঝুঁকিগুলোর অবশিষ্ট (Residual) মাত্রা নির্দেশ করে।
          </div>
        </div>

        {/* Cross-Module Assurance Probes (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>🛡️</span> আন্তঃমডিউল সুশাসন নিশ্চয়তা
            </h2>
            <span className="text-xs text-emerald-400 font-mono">NON-DESTRUCTIVE PROBE</span>
          </div>

          <div className="space-y-3">
            {crossModuleProbes.map((probe, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-white">{probe.moduleName}</div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      probe.isCompliant
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {probe.isCompliant ? "COMPLIANT" : "ATTENTION"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{probe.healthSummaryBn}</p>
                <div className="space-y-1 pt-1 border-t border-slate-800/60">
                  {probe.factualChecks.map((chk, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-1.5 text-[11px]">
                      <span
                        className={
                          chk.status === "PASS"
                            ? "text-emerald-400"
                            : chk.status === "WARN"
                            ? "text-amber-400"
                            : "text-rose-400"
                        }
                      >
                        {chk.status === "PASS" ? "✓" : "!"}
                      </span>
                      <span className="text-slate-300 font-medium">{chk.checkNameBn}:</span>
                      <span className="text-slate-400">{chk.detailsBn}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Audit Log & Navigation Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Governance Audit (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📜</span> সাম্প্রতিক শাসনকার্য ও অডিট লগ
            </h2>
            <span className="text-xs text-slate-500">Immutable Audit Trail</span>
          </div>

          <div className="space-y-2">
            {recentAudit.length === 0 ? (
              <p className="text-xs text-slate-500">কোনো সাম্প্রতিক অডিট এন্ট্রি নেই।</p>
            ) : (
              recentAudit.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-950/60 border border-slate-800/70 rounded-xl p-2.5 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-200">{log.notes}</div>
                    <div className="text-[11px] text-slate-500">
                      অ্যাকশন: <span className="font-mono text-emerald-400">{log.action}</span> | কর্মকর্তা: {log.actorName}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString("bn-BD", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Governance Quick Action Links & Reports (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>📑</span> প্রাতিষ্ঠানিক সুশাসন প্রতিবেদন
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <a
              href="/api/admin/governance/reports?type=RISK_REGISTER"
              target="_blank"
              className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition flex flex-col justify-between"
            >
              <span className="font-semibold text-slate-200">ঝুঁকি রেজিস্টার রিপোর্ট</span>
              <span className="text-[10px] text-emerald-400 mt-1">PDF / প্রিন্ট ↗</span>
            </a>
            <a
              href="/api/admin/governance/reports?type=CONTROL_EFFECTIVENESS"
              target="_blank"
              className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition flex flex-col justify-between"
            >
              <span className="font-semibold text-slate-200">নিয়ন্ত্রণ কার্যকারিতা</span>
              <span className="text-[10px] text-emerald-400 mt-1">PDF / প্রিন্ট ↗</span>
            </a>
            <a
              href="/api/admin/governance/reports?type=MANAGEMENT_ASSURANCE"
              target="_blank"
              className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition flex flex-col justify-between"
            >
              <span className="font-semibold text-slate-200">ব্যবস্থাপনা নিশ্চয়তা রিপোর্ট</span>
              <span className="text-[10px] text-emerald-400 mt-1">PDF / প্রিন্ট ↗</span>
            </a>
            <a
              href="/api/admin/governance/reports?type=OVERDUE_ACTIONS"
              target="_blank"
              className="p-3 bg-slate-950 border border-slate-800 hover:border-rose-500/50 rounded-xl transition flex flex-col justify-between"
            >
              <span className="font-semibold text-slate-200">বিলম্বিত ব্যবস্থা (Overdue)</span>
              <span className="text-[10px] text-rose-400 mt-1">PDF / প্রিন্ট ↗</span>
            </a>
          </div>

          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs space-y-1">
            <div className="font-semibold text-emerald-300">অটোমেট দ্য প্রসেস, নট দ্য অথরিটি</div>
            <p className="text-[11px] text-slate-400">
              এআই বিশ্লেষণ কেবল সহায়ক পরিসংখ্যান প্রদান করে; ঝুঁকি গ্রহণ, ফাইন্ডিংস নিষ্পত্তি বা কার্যাদেশ চূড়ান্ত অনুমোদনের সর্বময় ক্ষমতা কেবল অনুমোদিত মানবিক কর্তৃপক্ষের (মুহতামিম/অধ্যক্ষ)।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
