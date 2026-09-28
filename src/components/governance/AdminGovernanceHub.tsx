"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Activity,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Layers,
  Database,
  BookOpen,
  Wrench,
  Users,
  Search,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function AdminGovernanceHub() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"CHANGES" | "DATA_QUALITY" | "METRICS" | "TECH_DEBT" | "ACCESS">("CHANGES");
  const [selectedChange, setSelectedChange] = useState<any>(null);
  const [isNewChangeModalOpen, setIsNewChangeModalOpen] = useState(false);
  const [runningDataAudit, setRunningDataAudit] = useState(false);

  // New Change Request Form State
  const [formData, setFormData] = useState({
    title: "",
    objective: "",
    businessJustification: "",
    affectedModules: "STUDENTS, FINANCE",
    changeType: "ENHANCEMENT",
    priority: "MEDIUM",
    databaseImpact: false,
    rollbackPlan: "Git release rollback and pre-restore database snapshot.",
  });

  const fetchGovernanceData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/governance");
      const json = await res.json();
      if (json.success) {
        setData(json.summary);
      }
    } catch (err) {
      console.error("Failed to load governance data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGovernanceData();
  }, []);

  const handleRunDataAudit = async () => {
    try {
      setRunningDataAudit(true);
      const res = await fetch("/api/admin/governance/data-quality");
      const json = await res.json();
      if (json.success) {
        setData((prev: any) => ({
          ...prev,
          dataQualitySummary: {
            ...prev.dataQualitySummary,
            status: json.report.status,
            checksPassed: `${json.report.passedChecks}/${json.report.totalChecksConducted}`,
            anomaliesCount: json.report.totalAnomaliesCount,
            anomalies: json.report.anomalies,
            metrics: json.report.summary,
          },
        }));
      }
    } catch (err) {
      console.error("Data audit failed", err);
    } finally {
      setRunningDataAudit(false);
    }
  };

  const handleSubmitNewChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REGISTER_CHANGE",
          title: formData.title,
          objective: formData.objective,
          businessJustification: formData.businessJustification,
          affectedModules: formData.affectedModules.split(",").map((s) => s.trim()),
          changeType: formData.changeType,
          priority: formData.priority,
          databaseImpact: formData.databaseImpact,
          rollbackPlan: formData.rollbackPlan,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsNewChangeModalOpen(false);
        setFormData({
          title: "",
          objective: "",
          businessJustification: "",
          affectedModules: "STUDENTS, FINANCE",
          changeType: "ENHANCEMENT",
          priority: "MEDIUM",
          databaseImpact: false,
          rollbackPlan: "Git release rollback and pre-restore database snapshot.",
        });
        await fetchGovernanceData();
      }
    } catch (err) {
      console.error("Change submission failed", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-slate-600 font-medium">গভর্ন্যান্স ও চেঞ্জ ম্যানেজমেন্ট মেট্রিক্স লোড হচ্ছে...</p>
      </div>
    );
  }

  const changes = data?.changesSummary?.latestChanges || [];
  const metrics = data?.authoritativeMetrics || {};
  const dataQuality = data?.dataQualitySummary;
  const techDebt = data?.technicalDebtSummary?.items || [];
  const access = data?.accessReviewSummary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">প্রোডাক্ট গভর্ন্যান্স ও চেঞ্জ ম্যানেজমেন্ট</h1>
              <p className="text-sm text-slate-500">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা • দীর্ঘমেয়াদী সফটওয়্যার নির্ভরযোগ্যতা ও চেঞ্জ কন্ট্রোল ইঞ্জিন
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchGovernanceData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </button>
          <button
            onClick={() => setIsNewChangeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            নতুন চেঞ্জ রিকোয়েস্ট
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">চেঞ্জ রিকোয়েস্ট</div>
            <div className="text-2xl font-bold text-slate-900">{data?.changesSummary?.total || 0} টি</div>
            <div className="text-xs text-emerald-600 font-medium">
              {data?.changesSummary?.verified || 0} টি ভেরিফাইড রিলিজ
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              dataQuality?.status === "CLEAN"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ডেটা কোয়ালিটি</div>
            <div className="text-2xl font-bold text-slate-900">
              {dataQuality?.status === "CLEAN" ? "পরিশুদ্ধ" : `${dataQuality?.anomaliesCount} টি সতর্কবার্তা`}
            </div>
            <div className="text-xs text-slate-500 font-medium">চেক পাস: {dataQuality?.checksPassed}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">টেকনিক্যাল ডেট</div>
            <div className="text-2xl font-bold text-slate-900">{data?.technicalDebtSummary?.open || 0} টি উন্মুক্ত</div>
            <div className="text-xs text-slate-500 font-medium">রোডম্যাপে সংরক্ষিত</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">অ্যাক্সেস ও প্রিভিলেজ</div>
            <div className="text-2xl font-bold text-slate-900">
              {access?.privilegedAccountsCount || 0} জন অ্যাডমিন
            </div>
            <div className="text-xs text-emerald-600 font-medium">স্ট্যাটাস: {access?.healthAssessment}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveTab("CHANGES")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "CHANGES"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          চেঞ্জ রিকোয়েস্ট রেজিস্টার ({changes.length})
        </button>
        <button
          onClick={() => setActiveTab("DATA_QUALITY")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "DATA_QUALITY"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          ডেটা কোয়ালিটি ও লেজার অডিট
        </button>
        <button
          onClick={() => setActiveTab("METRICS")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "METRICS"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          অথরিটেটিভ মেট্রিক ডিকশনারি
        </button>
        <button
          onClick={() => setActiveTab("TECH_DEBT")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "TECH_DEBT"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          টেকনিক্যাল ডেট রেজিস্টার ({techDebt.length})
        </button>
      </div>

      {/* TAB 1: CHANGE MANAGEMENT */}
      {activeTab === "CHANGES" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-700">অনুমোদিত ও চলমান পরিবর্তন তালিকা</div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
              Invariants: Code Changed != Task Completed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                <tr>
                  <th className="p-4">চেঞ্জ আইডি</th>
                  <th className="p-4">শিরোনাম ও উদ্দেশ্য</th>
                  <th className="p-4">টাইপ</th>
                  <th className="p-4">ঝুঁকি (Risk)</th>
                  <th className="p-4">স্ট্যাটাস</th>
                  <th className="p-4">তারিখ</th>
                  <th className="p-4 text-right">বিবরণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {changes.map((c: any) => (
                  <tr key={c.changeId} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono font-bold text-slate-800">{c.changeId}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{c.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{c.objective}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {c.changeType}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          c.risk === "CRITICAL"
                            ? "bg-red-100 text-red-700"
                            : c.risk === "HIGH"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {c.risk}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          c.status === "VERIFIED"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.status === "APPROVED"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(c.requestDate).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedChange(c)}
                        className="text-emerald-600 hover:text-emerald-800 font-medium text-xs flex items-center justify-end gap-1 ml-auto"
                      >
                        ডিটেইলস <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DATA QUALITY AUDIT */}
      {activeTab === "DATA_QUALITY" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">রিয়েল-টাইম ডেটা কোয়ালিটি ও লেজার অডিট</h2>
              <p className="text-sm text-slate-500">
                শিক্ষার্থী দ্বিত্বতা, অভিভাবক লিংকেজ, ইনভয়েস গাণিতিক সমতা ও ৫-ফান্ড স্থিতি নিরীক্ষা।
              </p>
            </div>
            <button
              onClick={handleRunDataAudit}
              disabled={runningDataAudit}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm shadow-sm transition"
            >
              <RefreshCw className={`w-4 h-4 ${runningDataAudit ? "animate-spin" : ""}`} />
              {runningDataAudit ? "নিরীক্ষা চলছে..." : "নতুন অডিট পরিচালনা করুন"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold uppercase">নিরীক্ষিত শিক্ষার্থী</div>
              <div className="text-xl font-bold text-slate-900">{dataQuality?.metrics?.totalStudentsScanned} জন</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold uppercase">মোট ফি ইনভয়েস</div>
              <div className="text-xl font-bold text-slate-900">{dataQuality?.metrics?.totalInvoicesAudited} টি</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold uppercase">গাণিতিক অসামঞ্জস্য</div>
              <div className="text-xl font-bold text-emerald-600">{dataQuality?.metrics?.arithmeticDisparityCount || 0} টি</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold uppercase">ঋণাত্মক ফান্ড</div>
              <div className="text-xl font-bold text-emerald-600">{dataQuality?.metrics?.negativeFundCount || 0} টি</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">সনাক্তকৃত অসামঞ্জস্য ও সতর্কবার্তা ({dataQuality?.anomalies?.length || 0})</h3>
            {dataQuality?.anomalies?.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50 rounded-xl text-emerald-800">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
                <p className="font-bold">মাশাআল্লাহ! সিস্টেমে কোনো গাণিতিক বা ডেটা অসঙ্গতি পাওয়া যায়নি।</p>
                <p className="text-xs text-emerald-600 mt-1">সকল ইনভয়েস ও ফান্ড ব্যালেন্স ১০০% নিখুঁত।</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dataQuality?.anomalies?.map((a: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{a.title}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{a.details}</div>
                      <div className="text-xs text-emerald-700 font-medium mt-1">পরামর্শ: {a.suggestedAction}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: METRIC DICTIONARY */}
      {activeTab === "METRICS" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="text-sm font-bold text-slate-800">প্রাতিষ্ঠানিক কেপিআই ও একক সত্যের উৎস (Single Source of Truth)</div>
          </div>
          <div className="divide-y divide-slate-200">
            {Object.values(metrics).map((m: any) => (
              <div key={m.metricKey} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{m.nameBn}</span>
                    <span className="text-xs text-slate-400 font-mono">({m.metricKey})</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                      {m.ownerDomain}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{m.businessDefinition}</p>
                  <div className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded inline-block">
                    সূত্র: {m.formula}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-bold text-emerald-700">{m.currentValue}</div>
                  <div className="text-[11px] text-slate-400">মডেল: {m.sourceModel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TECHNICAL DEBT */}
      {activeTab === "TECH_DEBT" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">টেকনিক্যাল ডেট রেজিস্টার (Technical Debt Register)</h2>
              <p className="text-sm text-slate-500">
                সিস্টেমের কার্যকারিতা বজায় রেখে পরিকল্পিতভাবে পরবর্তী ফেজসমূহে সমাধানের জন্য চিহ্নিত বিষয়সমূহ।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {techDebt.map((d: any) => (
              <div key={d.debtId} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">{d.debtId}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">
                    {d.risk}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{d.title}</h3>
                <p className="text-xs text-slate-600">{d.impact}</p>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700">বর্তমান সমাধান:</span> {d.workaround}
                </div>
                <div className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                  <span>পরিকল্পিত বাস্তবায়ন: {d.plannedResolution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Change Request Details Modal */}
      {selectedChange && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-400">{selectedChange.changeId}</span>
                <h3 className="font-bold text-lg text-slate-900">{selectedChange.title}</h3>
              </div>
              <button onClick={() => setSelectedChange(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">রিকুয়েস্টার:</span>
                <div className="font-semibold text-slate-800">{selectedChange.requesterName} ({selectedChange.requesterRole})</div>
              </div>
              <div>
                <span className="text-slate-400">ঝুঁকি ও অগ্রাধিকার:</span>
                <div className="font-semibold text-slate-800">{selectedChange.risk} / {selectedChange.priority}</div>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-slate-400">ব্যবসায়িক উদ্দেশ্য ও যৌক্তিকতা:</span>
              <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border">{selectedChange.businessJustification}</p>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-slate-400">ইমপ্যাক্ট ও নির্ভরশীলতা (Impact & Dependencies):</span>
              <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border">{selectedChange.impactAnalysis?.summary}</p>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-slate-400">রোলব্যাক পরিকল্পনা:</span>
              <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border">{selectedChange.rollbackPlan}</p>
            </div>

            {selectedChange.verificationEvidence && (
              <div className="text-xs space-y-1">
                <span className="text-slate-400">ভেরিফিকেশন প্রমাণ (Evidence):</span>
                <p className="text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-medium">
                  {selectedChange.verificationEvidence}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedChange(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Change Request Modal */}
      {isNewChangeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">নতুন চেঞ্জ রিকোয়েস্ট দাখিল</h3>
              <button onClick={() => setIsNewChangeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewChange} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">চেঞ্জ শিরোনাম</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. অনলাইন ভর্তি ফর্মে নতুন মাদরাসা শাখা সংযোজন"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">উদ্দেশ্য (Objective)</label>
                <input
                  type="text"
                  required
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ব্যবসায়িক যৌক্তিকতা (Justification)</label>
                <textarea
                  rows={2}
                  required
                  value={formData.businessJustification}
                  onChange={(e) => setFormData({ ...formData, businessJustification: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">টাইপ</label>
                  <select
                    value={formData.changeType}
                    onChange={(e) => setFormData({ ...formData, changeType: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="ENHANCEMENT">ENHANCEMENT</option>
                    <option value="FEATURE">FEATURE</option>
                    <option value="BUG_FIX">BUG_FIX</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="DATA">DATA</option>
                    <option value="CONFIGURATION">CONFIGURATION</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">অগ্রাধিকার (Priority)</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="dbImpact"
                  checked={formData.databaseImpact}
                  onChange={(e) => setFormData({ ...formData, databaseImpact: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="dbImpact" className="text-slate-700 font-medium">
                  ডাটাবেজ স্কিমা অথবা হিস্টোরিক্যাল ডাটা পরিবর্তন হবে
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewChangeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  দাখিল করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
