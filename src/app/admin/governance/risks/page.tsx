"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import GovernanceNav from "../GovernanceNav";

interface RiskItem {
  id: string;
  titleBn: string;
  titleEn?: string;
  descriptionBn: string;
  riskCategory: string;
  sourceModule: string;
  ownerName: string;
  ownerRole: string;
  inherentLikelihood: number;
  inherentImpact: number;
  inherentScore: number;
  inherentLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  existingControlIds: string[];
  residualLikelihood: number;
  residualImpact: number;
  residualScore: number;
  residualLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  treatmentType: string;
  treatmentPlanBn?: string;
  status: string;
  nextReviewDate: string;
  createdAt: string;
}

export default function RiskRegisterPage() {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchRisks();
  }, [categoryFilter, levelFilter, statusFilter]);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append("category", categoryFilter);
      if (levelFilter) params.append("level", levelFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/governance/risks?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRisks(json.risks || []);
      } else {
        setError(json.error || "ঝুঁকি তালিকা লোড করা যায়নি।");
      }
    } catch (err: any) {
      setError(err.message || "নেটওয়ার্ক ত্রুটি।");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRisks();
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "HIGH":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "LOW":
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      case "MITIGATING":
      case "MONITORING":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      case "ACCEPTED":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "MITIGATED":
      case "CLOSED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  // Quick stats
  const total = risks.length;
  const critical = risks.filter((r) => r.residualLevel === "CRITICAL").length;
  const high = risks.filter((r) => r.residualLevel === "HIGH").length;
  const openCount = risks.filter((r) => ["OPEN", "UNDER_ASSESSMENT", "MITIGATING"].includes(r.status)).length;
  const acceptedCount = risks.filter((r) => r.status === "ACCEPTED").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <GovernanceNav currentTab="risks" />

      {/* KPI Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">মোট নথিভুক্ত ঝুঁকি</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
        </div>
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4">
          <p className="text-xs text-rose-300 font-medium">জরুরি (Critical)</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{critical}</p>
        </div>
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-xs text-amber-300 font-medium">উচ্চ ঝুঁকি (High)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{high}</p>
        </div>
        <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-4">
          <p className="text-xs text-sky-300 font-medium">সক্রিয় / ওপেন</p>
          <p className="text-2xl font-bold text-sky-400 mt-1">{openCount}</p>
        </div>
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4">
          <p className="text-xs text-purple-300 font-medium">গৃহীত (Accepted)</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{acceptedCount}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="ঝুঁকি কোড (EHRJ-RISK-...), শিরোনাম বা বর্ণনা দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            সার্চ করুন
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400">ফিল্টার:</span>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">সকল ক্যাটাগরি</option>
            <option value="FINANCIAL">আর্থিক (Financial)</option>
            <option value="ACADEMIC">একাডেমিক (Academic)</option>
            <option value="STUDENT">শিক্ষার্থী সংক্রান্ত (Student)</option>
            <option value="OPERATIONAL">পরিচালনগত (Operational)</option>
            <option value="SECURITY">নিরাপত্তা (Security)</option>
            <option value="TECHNOLOGY">প্রযুক্তি (Technology)</option>
            <option value="COMPLIANCE_GOVERNANCE">অনুপালন ও বিধিবিধান (Compliance)</option>
            <option value="VENDOR_PROCUREMENT">সরবরাহকারী ও ক্রয় (Procurement)</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">সকল ঝুঁকি মাত্রা (Level)</option>
            <option value="CRITICAL">জরুরি (Critical 15-25)</option>
            <option value="HIGH">উচ্চ (High 10-14)</option>
            <option value="MEDIUM">মাঝারি (Medium 5-9)</option>
            <option value="LOW">নিম্ন (Low 1-4)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">সকল স্ট্যাটাস</option>
            <option value="OPEN">ওপেন (OPEN)</option>
            <option value="UNDER_ASSESSMENT">মূল্যায়ন চলছে (UNDER_ASSESSMENT)</option>
            <option value="MITIGATING">প্রশমন সক্রিয় (MITIGATING)</option>
            <option value="MONITORING">পর্যবেক্ষণে (MONITORING)</option>
            <option value="ACCEPTED">অনুমোদিত গৃহীত (ACCEPTED)</option>
            <option value="MITIGATED">প্রশমিত (MITIGATED)</option>
            <option value="CLOSED">সমাপ্ত (CLOSED)</option>
          </select>

          {(categoryFilter || levelFilter || statusFilter || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter("");
                setLevelFilter("");
                setStatusFilter("");
                setSearchQuery("");
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline ml-2"
            >
              ফিল্টার রিসেট
            </button>
          )}
        </div>
      </div>

      {/* Risks Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">ঝুঁকি রেজিস্টার লোড হচ্ছে...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">{error}</div>
        ) : risks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-slate-400 text-sm">কোনো ঝুঁকি রেকর্ড পাওয়া যায়নি।</p>
            <Link
              href="/admin/governance/risks/new"
              className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
            >
              নতুন ঝুঁকি যোগ করুন
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">ঝুঁকি আইডি</th>
                  <th className="py-3.5 px-4">শিরোনাম ও বিবরণ</th>
                  <th className="py-3.5 px-4">ক্যাটাগরি / উৎস</th>
                  <th className="py-3.5 px-4 text-center">সহজাত (Inherent)</th>
                  <th className="py-3.5 px-4 text-center">নিয়ন্ত্রণ (Controls)</th>
                  <th className="py-3.5 px-4 text-center">অবশিষ্ট (Residual)</th>
                  <th className="py-3.5 px-4">প্রতিকার / দায়িত্ব</th>
                  <th className="py-3.5 px-4">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {risks.map((risk) => (
                  <tr key={risk.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-emerald-400 whitespace-nowrap">
                      <Link href={`/admin/governance/risks/${risk.id}`} className="hover:underline">
                        {risk.id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <Link href={`/admin/governance/risks/${risk.id}`} className="hover:text-white transition">
                        <p className="font-semibold text-slate-100">{risk.titleBn}</p>
                        {risk.titleEn && <p className="text-[11px] text-slate-400 font-sans">{risk.titleEn}</p>}
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{risk.descriptionBn}</p>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                        {risk.riskCategory}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">{risk.sourceModule}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getLevelBadge(
                          risk.inherentLevel
                        )}`}
                      >
                        {risk.inherentScore} ({risk.inherentLevel})
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        L:{risk.inherentLikelihood} × I:{risk.inherentImpact}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {risk.existingControlIds?.length || 0} টি নিয়ন্ত্রণ
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getLevelBadge(
                          risk.residualLevel
                        )}`}
                      >
                        {risk.residualScore} ({risk.residualLevel})
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        L:{risk.residualLikelihood} × I:{risk.residualImpact}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-200">{risk.ownerName}</p>
                      <p className="text-[10px] text-slate-500">{risk.treatmentType}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                          risk.status
                        )}`}
                      >
                        {risk.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/governance/risks/${risk.id}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
                      >
                        বিস্তারিত &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
