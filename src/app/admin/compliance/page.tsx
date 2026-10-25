"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ComplianceNav from "./ComplianceNav";

interface DashboardData {
  summary: {
    totalRequirements: number;
    activeRequirements: number;
    totalObligations: number;
    compliantObligations: number;
    overdueObligations: number;
    pendingEvidence: number;
    activeExceptions: number;
    openRemediations: number;
    complianceRate: number;
  };
  statusCounts: Record<string, number>;
  earlyWarnings: Array<{
    type: string;
    severity: string;
    message: string;
    dueDate?: string;
    owner?: string;
    isForecast: boolean;
  }>;
  gaps: Array<{
    requirementId: string;
    requirementTitle: string;
    category: string;
    obligationTitle?: string;
    gapType: string;
  }>;
  recentAudits: Array<{
    id: string;
    action: string;
    entityId: string;
    actorName: string;
    timestamp: string;
  }>;
}

export default function ComplianceDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/compliance/dashboard");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "ড্যাশবোর্ড তথ্য লোড করতে ব্যর্থ হয়েছে।");
      }
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <ComplianceNav currentTab="dashboard" />

      {loading && (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          কমপ্লায়েন্স ককপিট ডেটা লোড হচ্ছে...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-sm">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">সক্রিয় বাধ্যবাধকতা</span>
              <div className="text-2xl md:text-3xl font-bold text-white mt-1">
                {data.summary.activeRequirements}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                মোট প্রয়োজনীয়তা: {data.summary.totalRequirements}
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">কমপ্লায়েন্স দায় ও অঙ্গীকার</span>
              <div className="text-2xl md:text-3xl font-bold text-emerald-400 mt-1">
                {data.summary.totalObligations}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                প্রতিপালিত: {data.summary.compliantObligations} টি
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">সময়োত্তীর্ণ সতর্কতা</span>
              <div className={`text-2xl md:text-3xl font-bold mt-1 ${data.summary.overdueObligations > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {data.summary.overdueObligations}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                অপেক্ষমান প্রমাণ: {data.summary.pendingEvidence}
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">প্রাতিষ্ঠানিক কমপ্লায়েন্স হার</span>
              <div className="text-2xl md:text-3xl font-bold text-teal-300 mt-1">
                {data.summary.complianceRate}%
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                খোলা প্রতিকার (CAPA): {data.summary.openRemediations}
              </span>
            </div>
          </div>

          {/* Early Warning Forecasts Banner (Section 36) */}
          {data.earlyWarnings.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
                <span>⚠️</span>
                <span>প্রাতিষ্ঠানিক আর্লি ওয়ার্নিং ও পূর্বাভাস (Early Warning Forecasts)</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 font-mono">
                  Forecast Only
                </span>
              </div>
              <div className="space-y-2 mt-2">
                {data.earlyWarnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between text-xs p-2.5 bg-slate-900/70 border border-amber-500/20 rounded-xl gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${w.severity === "CRITICAL" ? "bg-rose-500" : "bg-amber-500"}`}></span>
                      <span className="text-slate-200">{w.message}</span>
                    </div>
                    {w.dueDate && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        সময়সীমা: {w.dueDate}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Matrix Gap Analysis (Section 44) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-base">কমপ্লায়েন্স ম্যাট্রিক্স ও ঘাটতি বিশ্লেষণ</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Requirement ➔ Obligation ➔ Owner ➔ Evidence ➔ Control ➔ Risk ➔ Status
                  </p>
                </div>
                <Link
                  href="/admin/compliance/reports?type=COMPLIANCE_STATUS_REPORT"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  সম্পূর্ণ ম্যাট্রিক্স দেখুন →
                </Link>
              </div>

              {data.gaps.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  কোনো অ্যাসাইনমেন্ট বা প্রমাণের ঘাটতি পাওয়া যায়নি।
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {data.gaps.map((gap, idx) => (
                    <div key={idx} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-emerald-400">{gap.requirementId}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {gap.category}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-200 mt-1">{gap.requirementTitle}</p>
                        {gap.obligationTitle && (
                          <p className="text-xs text-slate-400 mt-0.5">দায়িত্ব: {gap.obligationTitle}</p>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                        gap.gapType === "ASSIGNMENT_GAP"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : gap.gapType === "EVIDENCE_GAP"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}>
                        {gap.gapType === "ASSIGNMENT_GAP" && "দায়িত্ব বণ্টনহীন"}
                        {gap.gapType === "EVIDENCE_GAP" && "প্রমাণপত্র অনুপস্থিত"}
                        {gap.gapType === "RENEWAL_GAP" && "নবায়ন আবশ্যক"}
                        {gap.gapType === "RISK_LINK_GAP" && "নিয়ন্ত্রণ সংযোগহীন"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Status Breakdown & Recent Audits */}
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-white text-base">অবস্থাভিত্তিক বিভাজন</h3>
                <div className="space-y-2 text-xs">
                  {Object.entries(data.statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400 font-mono">{status}</span>
                      <span className="font-semibold text-slate-200">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-white text-base">সাম্প্রতিক অডিট লগ</h3>
                <div className="space-y-2 text-xs">
                  {data.recentAudits.slice(0, 5).map((log) => (
                    <div key={log.id} className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-emerald-400">{log.action}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString("bn-BD")}</span>
                      </div>
                      <div className="text-slate-300 mt-1 font-mono text-[10px] truncate">
                        {log.entityId} — {log.actorName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
