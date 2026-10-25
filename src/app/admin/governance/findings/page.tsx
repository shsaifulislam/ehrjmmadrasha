"use client";

import React, { useState, useEffect } from "react";
import GovernanceNav from "../GovernanceNav";

interface FindingItem {
  id: string;
  titleBn: string;
  titleEn?: string;
  descriptionBn: string;
  source: string;
  relatedRiskId?: string;
  relatedControlId?: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  ownerName: string;
  ownerRole: string;
  status: string;
  rootCauseCategory: string;
  rootCauseDetailsBn?: string;
  recommendationBn: string;
  dueDate: string;
  resolutionNotesBn?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export default function FindingsRegisterPage() {
  const [findings, setFindings] = useState<FindingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [rootCauseFilter, setRootCauseFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<FindingItem | null>(null);

  // New Finding State
  const [newTitleBn, setNewTitleBn] = useState("");
  const [newDescBn, setNewDescBn] = useState("");
  const [newSource, setNewSource] = useState("CONTROL_TEST");
  const [newSeverity, setNewSeverity] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [newRootCause, setNewRootCause] = useState("PROCESS");
  const [newOwner, setNewOwner] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newRecommendation, setNewRecommendation] = useState("");

  // Verification Form State
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [verificationEvidence, setVerificationEvidence] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFindings();
  }, [statusFilter, severityFilter, rootCauseFilter]);

  const fetchFindings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (severityFilter) params.append("severity", severityFilter);
      if (rootCauseFilter) params.append("rootCause", rootCauseFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/governance/findings?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setFindings(json.findings || []);
      } else {
        setError(json.error || "পর্যবেক্ষণ তালিকা পাওয়া যায়নি।");
      }
    } catch (e: any) {
      setError(e.message || "নেটওয়ার্ক ত্রুটি।");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFindings();
  };

  const handleCreateFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleBn.trim() || !newDescBn.trim() || !newOwner.trim() || !newRecommendation.trim() || !newDueDate) {
      alert("শিরোনাম, বর্ণনা, দায়িত্বপ্রাপ্ত কর্মকর্তা, সুপারিশ এবং তারিখ আবশ্যক।");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/governance/findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleBn: newTitleBn,
          descriptionBn: newDescBn,
          source: newSource,
          severity: newSeverity,
          rootCauseCategory: newRootCause,
          ownerName: newOwner,
          ownerRole: "OFFICER",
          recommendationBn: newRecommendation,
          dueDate: newDueDate,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMsg("নতুন পর্যবেক্ষণ সফলভাবে নথিভুক্ত হয়েছে!");
        setShowNewModal(false);
        setNewTitleBn("");
        setNewDescBn("");
        setNewRecommendation("");
        fetchFindings();
      } else {
        alert(json.error || "সংরক্ষণ ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyAndClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding || !resolutionNotes.trim()) {
      alert("যাচাইকরণ নোট আবশ্যক।");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/governance/findings/${selectedFinding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_AND_CLOSE",
          resolutionNotesBn: resolutionNotes,
          evidenceRef: verificationEvidence || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMsg("পর্যবেক্ষণটি সফলভাবে যাচাই ও সমাপ্ত (CLOSED) ঘোষণা করা হয়েছে!");
        setShowVerifyModal(false);
        fetchFindings();
      } else {
        alert(json.error || "যাচাইকরণ ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const openVerifyModal = (fnd: FindingItem) => {
    setSelectedFinding(fnd);
    setResolutionNotes("");
    setVerificationEvidence("");
    setShowVerifyModal(true);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "HIGH":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
      case "ACTION_REQUIRED":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "IN_PROGRESS":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "PENDING_VERIFICATION":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      case "RESOLVED":
      case "CLOSED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  // Stats
  const total = findings.length;
  const critical = findings.filter((f) => f.severity === "CRITICAL").length;
  const actionRequired = findings.filter((f) => ["OPEN", "ACTION_REQUIRED"].includes(f.status)).length;
  const pendingVerify = findings.filter((f) => f.status === "PENDING_VERIFICATION").length;
  const closedCount = findings.filter((f) => f.status === "CLOSED").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <GovernanceNav currentTab="findings" />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">মোট পর্যবেক্ষণ (Findings)</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
        </div>
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4">
          <p className="text-xs text-rose-300 font-medium">জরুরি (Critical)</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{critical}</p>
        </div>
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-xs text-amber-300 font-medium">পদক্ষেপ প্রয়োজন (Action Req)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{actionRequired}</p>
        </div>
        <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-4">
          <p className="text-xs text-sky-300 font-medium">যাচাইকরণ বাকি (Pending)</p>
          <p className="text-2xl font-bold text-sky-400 mt-1">{pendingVerify}</p>
        </div>
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4">
          <p className="text-xs text-emerald-300 font-medium">যাচাইকৃত সমাপ্ত (Closed)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{closedCount}</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <span>✓ {msg}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
            <input
              type="text"
              placeholder="পর্যবেক্ষণ কোড (EHRJ-FND-...), শিরোনাম বা কারণ দিয়ে অনুসন্ধান..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
            >
              সার্চ
            </button>
          </form>

          <button
            onClick={() => setShowNewModal(true)}
            className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-1.5"
          >
            <span>+</span> নতুন পর্যবেক্ষণ যোগ করুন
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400">ফিল্টার:</span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">সকল স্ট্যাটাস</option>
            <option value="OPEN">ওপেন (OPEN)</option>
            <option value="ACTION_REQUIRED">পদক্ষেপ প্রয়োজন (ACTION_REQUIRED)</option>
            <option value="IN_PROGRESS">প্রক্রিয়াধীন (IN_PROGRESS)</option>
            <option value="PENDING_VERIFICATION">যাচাই প্রতীক্ষমাণ (PENDING_VERIFICATION)</option>
            <option value="RESOLVED">নিষ্পন্ন (RESOLVED)</option>
            <option value="CLOSED">যাচাইকৃত সমাপ্ত (CLOSED)</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">সকল গুরুত্ব (Severity)</option>
            <option value="CRITICAL">জরুরি (CRITICAL)</option>
            <option value="HIGH">উচ্চ (HIGH)</option>
            <option value="MEDIUM">মাঝারি (MEDIUM)</option>
            <option value="LOW">নিম্ন (LOW)</option>
          </select>

          <select
            value={rootCauseFilter}
            onChange={(e) => setRootCauseFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">সকল মূল কারণ (Root Cause)</option>
            <option value="PROCESS">প্রক্রিয়াগত ত্রুটি (PROCESS)</option>
            <option value="PEOPLE">জনবল বা অবহেলা (PEOPLE)</option>
            <option value="TECHNOLOGY">কারিগরি বা সফটওয়্যার (TECHNOLOGY)</option>
            <option value="DATA">তথ্যগত অসংগতি (DATA)</option>
            <option value="TRAINING">প্রশিক্ষণের অভাব (TRAINING)</option>
            <option value="GOVERNANCE">নীতি বা অনুমোদনের ঘাটতি (GOVERNANCE)</option>
          </select>

          {(statusFilter || severityFilter || rootCauseFilter || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("");
                setSeverityFilter("");
                setRootCauseFilter("");
                setSearchQuery("");
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline ml-2"
            >
              ফিল্টার রিসেট
            </button>
          )}
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">পর্যবেক্ষণ তালিকা লোড হচ্ছে...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
        ) : findings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-slate-400 text-xs">কোনো পর্যবেক্ষণ রেকর্ড পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">আইডি</th>
                  <th className="py-3.5 px-4">শিরোনাম ও বিবরণ</th>
                  <th className="py-3.5 px-4">উৎস ও মূল কারণ</th>
                  <th className="py-3.5 px-4 text-center">তীব্রতা (Severity)</th>
                  <th className="py-3.5 px-4">দায়িত্ব ও মেয়াদ</th>
                  <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {findings.map((fnd) => (
                  <tr key={fnd.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-emerald-400 whitespace-nowrap">
                      {fnd.id}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-semibold text-white">{fnd.titleBn}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{fnd.descriptionBn}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">সুপারিশ: {fnd.recommendationBn}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                        {fnd.source}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">কারণ: {fnd.rootCauseCategory}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getSeverityBadge(
                          fnd.severity
                        )}`}
                      >
                        {fnd.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-200">{fnd.ownerName}</p>
                      <p className="text-[10px] text-slate-500">মেয়াদ: {fnd.dueDate}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                          fnd.status
                        )}`}
                      >
                        {fnd.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {fnd.status !== "CLOSED" ? (
                        <button
                          onClick={() => openVerifyModal(fnd)}
                          className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition flex items-center gap-1 ml-auto"
                        >
                          <span>🔍</span> যাচাই ও সমাপ্ত
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 justify-end">
                          <span>✓</span> সমাপ্তকৃত
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verify & Close Modal */}
      {showVerifyModal && selectedFinding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">পর্যবেক্ষণ যাচাই ও আনুষ্ঠানিক সমাপ্তি</h3>
                <p className="text-[11px] text-emerald-400 font-mono mt-0.5">{selectedFinding.id} — {selectedFinding.titleBn}</p>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p><span className="text-slate-200">সুপারিশ:</span> {selectedFinding.recommendationBn}</p>
              <p><span className="text-slate-200">মূল কারণ:</span> {selectedFinding.rootCauseCategory}</p>
            </div>

            <form onSubmit={handleVerifyAndClose} className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  নিষ্পত্তি ও নিরপেক্ষ যাচাইকরণ নোট (Verification Notes) *
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="বাস্তবে কী সংশোধনমূলক পদক্ষেপ গ্রহণ করা হয়েছে এবং কীভাবে তা নিশ্চিতভাবে যাচাই করা হয়েছে..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  যাচাই প্রমাণের রেফারেন্স (Evidence Ref / Document Token)
                </label>
                <input
                  type="text"
                  value={verificationEvidence}
                  onChange={(e) => setVerificationEvidence(e.target.value)}
                  placeholder="যেমন: AUDIT-DOC-2026-044 বা ভাউচার নম্বর"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold"
                >
                  {submitting ? "যাচাই হচ্ছে..." : "যাচাই নিশ্চিত ও ক্লোজ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Finding Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">নতুন সুশাসন পর্যবেক্ষণ (Finding) অন্তর্ভুক্তি</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFinding} className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">পর্যবেক্ষণের শিরোনাম *</label>
                <input
                  type="text"
                  value={newTitleBn}
                  onChange={(e) => setNewTitleBn(e.target.value)}
                  placeholder="যেমন: অনুদান রসিদের অনুলিপিতে অনুমোদনের ঘাটতি"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">বিস্তারিত বিবরণ ও বিচ্যুতি *</label>
                <textarea
                  rows={2}
                  value={newDescBn}
                  onChange={(e) => setNewDescBn(e.target.value)}
                  placeholder="কী ত্রুটি বা ব্যত্যয় পরিলক্ষিত হয়েছে..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">উৎস (Source)</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="CONTROL_TEST">কন্ট্রোল টেস্ট</option>
                    <option value="INTERNAL_AUDIT">অভ্যন্তরীণ অডিট</option>
                    <option value="SYSTEM_PROBE">স্বয়ংক্রিয় সিস্টেম অনুসন্ধান</option>
                    <option value="GOVERNANCE_REVIEW">গভর্ন্যান্স পর্যালোচনা</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">তীব্রতা (Severity)</label>
                  <select
                    value={newSeverity}
                    onChange={(e: any) => setNewSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="CRITICAL">জরুরি (CRITICAL)</option>
                    <option value="HIGH">উচ্চ (HIGH)</option>
                    <option value="MEDIUM">মাঝারি (MEDIUM)</option>
                    <option value="LOW">নিম্ন (LOW)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">মূল কারণ (Root Cause)</label>
                  <select
                    value={newRootCause}
                    onChange={(e) => setNewRootCause(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="PROCESS">প্রক্রিয়াগত ত্রুটি</option>
                    <option value="PEOPLE">জনবল বা অবহেলা</option>
                    <option value="TECHNOLOGY">কারিগরি বা সফটওয়্যার</option>
                    <option value="DATA">তথ্যগত অসংগতি</option>
                    <option value="TRAINING">প্রশিক্ষণের অভাব</option>
                    <option value="GOVERNANCE">নীতি বা অনুমোদনের ঘাটতি</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">দায়িত্বপ্রাপ্ত কর্মকর্তা *</label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="যেমন: সহকারী হিসাবরক্ষক"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">নিষ্পত্তির শেষ তারিখ *</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">প্রতিকারমূলক সুপারিশ (Recommendation) *</label>
                <textarea
                  rows={2}
                  value={newRecommendation}
                  onChange={(e) => setNewRecommendation(e.target.value)}
                  placeholder="ভবিষ্যতে পুনরাবৃত্তি রোধে কী করণীয়..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "পর্যবেক্ষণ সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
