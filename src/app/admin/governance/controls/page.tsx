"use client";

import React, { useState, useEffect } from "react";
import GovernanceNav from "../GovernanceNav";

interface ControlItem {
  id: string;
  nameBn: string;
  nameEn?: string;
  descriptionBn: string;
  controlObjectiveBn: string;
  category: string;
  ownerName: string;
  ownerRole: string;
  frequency: string;
  type: string;
  automationType: string;
  relatedRiskIds: string[];
  sourceModule: string;
  evidenceRequirementBn: string;
  testingMethodBn: string;
  status: string;
  lastTestedAt?: string;
  nextReviewDate: string;
  lastTestResult?: string;
  lastTestId?: string;
}

export default function ControlsRegisterPage() {
  const [controls, setControls] = useState<ControlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [effectivenessFilter, setEffectivenessFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedControl, setSelectedControl] = useState<ControlItem | null>(null);

  // New Control Form State
  const [newNameBn, setNewNameBn] = useState("");
  const [newNameEn, setNewNameEn] = useState("");
  const [newDescBn, setNewDescBn] = useState("");
  const [newObjectiveBn, setNewObjectiveBn] = useState("");
  const [newCategory, setNewCategory] = useState("FINANCIAL");
  const [newOwner, setNewOwner] = useState("");
  const [newOwnerRole, setNewOwnerRole] = useState("OFFICER");
  const [newFrequency, setNewFrequency] = useState("MONTHLY");
  const [newType, setNewType] = useState("PREVENTIVE");
  const [newAutomation, setNewAutomation] = useState("HYBRID");
  const [newSourceModule, setNewSourceModule] = useState("FINANCE_PHASE_6");
  const [newEvidenceReq, setNewEvidenceReq] = useState("");
  const [newTestingMethod, setNewTestingMethod] = useState("");

  // Test Control Form State
  const [testMethod, setTestMethod] = useState("SAMPLE_AUDIT");
  const [popDesc, setPopDesc] = useState("");
  const [sampleSize, setSampleSize] = useState(10);
  const [expectedRes, setExpectedRes] = useState("");
  const [actualRes, setActualRes] = useState("");
  const [testResult, setTestResult] = useState<"EFFECTIVE" | "PARTIALLY_EFFECTIVE" | "INEFFECTIVE">("EFFECTIVE");
  const [exceptionCount, setExceptionCount] = useState(0);
  const [evidenceRef, setEvidenceRef] = useState("");
  const [testNotes, setTestNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchControls();
  }, [categoryFilter, statusFilter, effectivenessFilter]);

  const fetchControls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append("category", categoryFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (effectivenessFilter) params.append("effectiveness", effectivenessFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/governance/controls?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setControls(json.controls || []);
      } else {
        setError(json.error || "নিয়ন্ত্রণ তালিকা লোড করা যায়নি।");
      }
    } catch (e: any) {
      setError(e.message || "নেটওয়ার্ক ত্রুটি।");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchControls();
  };

  const handleCreateControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameBn.trim() || !newObjectiveBn.trim() || !newOwner.trim() || !newEvidenceReq.trim()) {
      alert("নাম, উদ্দেশ্য, দায়িত্বপ্রাপ্ত ব্যক্তি এবং প্রমাণ আবশ্যক।");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/governance/controls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn: newNameBn,
          nameEn: newNameEn || undefined,
          descriptionBn: newDescBn,
          controlObjectiveBn: newObjectiveBn,
          category: newCategory,
          ownerName: newOwner,
          ownerRole: newOwnerRole,
          frequency: newFrequency,
          type: newType,
          automationType: newAutomation,
          sourceModule: newSourceModule,
          evidenceRequirementBn: newEvidenceReq,
          testingMethodBn: newTestingMethod || "নিয়মিত নমুনা অডিট ও লগ যাচাই",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg("নতুন নিয়ন্ত্রণ ব্যবস্থা সফলভাবে রেজিস্টারে অন্তর্ভুক্ত হয়েছে!");
        setShowNewModal(false);
        // Reset form
        setNewNameBn("");
        setNewObjectiveBn("");
        setNewDescBn("");
        fetchControls();
      } else {
        alert(json.error || "সংরক্ষণ ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedControl || !expectedRes.trim() || !actualRes.trim() || !evidenceRef.trim()) {
      alert("প্রত্যাশিত ফলাফল, বাস্তব ফলাফল ও প্রমাণ রেফারেন্স আবশ্যক।");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/governance/control-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          controlId: selectedControl.id,
          testMethod,
          populationDescription: popDesc || undefined,
          sampleSize: Number(sampleSize) || 1,
          expectedResultBn: expectedRes,
          actualResultBn: actualRes,
          result: testResult,
          exceptionCount: Number(exceptionCount) || 0,
          evidenceRef,
          notes: testNotes || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMsg(`নিয়ন্ত্রণ পরীক্ষা সম্পন্ন হয়েছে! ফলাফল: ${testResult}`);
        setShowTestModal(false);
        fetchControls();
      } else {
        alert(json.error || "পরীক্ষা সংরক্ষণ ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const openTestModal = (ctrl: ControlItem) => {
    setSelectedControl(ctrl);
    setExpectedRes(ctrl.controlObjectiveBn);
    setActualRes("");
    setEvidenceRef("");
    setTestResult("EFFECTIVE");
    setExceptionCount(0);
    setShowTestModal(true);
  };

  // Stats
  const total = controls.length;
  const effective = controls.filter((c) => c.lastTestResult === "EFFECTIVE").length;
  const partiallyEffective = controls.filter((c) => c.lastTestResult === "PARTIALLY_EFFECTIVE").length;
  const ineffective = controls.filter((c) => c.lastTestResult === "INEFFECTIVE").length;
  const untested = controls.filter((c) => !c.lastTestResult || c.lastTestResult === "NOT_TESTED").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <GovernanceNav currentTab="controls" />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">মোট নিয়ন্ত্রণ ব্যবস্থা</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
        </div>
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4">
          <p className="text-xs text-emerald-300 font-medium">কার্যকর (Effective)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{effective}</p>
        </div>
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-xs text-amber-300 font-medium">আংশিক কার্যকর</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{partiallyEffective}</p>
        </div>
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4">
          <p className="text-xs text-rose-300 font-medium">অকার্যকর (Ineffective)</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{ineffective}</p>
        </div>
        <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">পরীক্ষাহীন (Untested)</p>
          <p className="text-2xl font-bold text-slate-300 mt-1">{untested}</p>
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

      {/* Filter and Action Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
            <input
              type="text"
              placeholder="নিয়ন্ত্রণ কোড (EHRJ-CTRL-...), নাম বা উদ্দেশ্য দিয়ে অনুসন্ধান..."
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
            <span>+</span> নতুন নিয়ন্ত্রণ নথিভুক্ত করুন
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400">ফিল্টার:</span>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">সকল ক্যাটাগরি</option>
            <option value="FINANCIAL">আর্থিক (Financial)</option>
            <option value="ACADEMIC">একাডেমিক (Academic)</option>
            <option value="STUDENT">শিক্ষার্থী (Student)</option>
            <option value="OPERATIONAL">পরিচালন (Operational)</option>
            <option value="SECURITY">নিরাপত্তা (Security)</option>
            <option value="TECHNOLOGY">প্রযুক্তি (Technology)</option>
            <option value="COMPLIANCE_GOVERNANCE">অনুপালন (Compliance)</option>
            <option value="VENDOR_PROCUREMENT">ক্রয় (Procurement)</option>
          </select>

          <select
            value={effectivenessFilter}
            onChange={(e) => setEffectivenessFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">সকল কার্যকারিতা মাত্রা</option>
            <option value="EFFECTIVE">কার্যকর (EFFECTIVE)</option>
            <option value="PARTIALLY_EFFECTIVE">আংশিক কার্যকর (PARTIALLY_EFFECTIVE)</option>
            <option value="INEFFECTIVE">অকার্যকর (INEFFECTIVE)</option>
            <option value="NOT_TESTED">পরীক্ষাহীন (NOT_TESTED)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">সকল স্ট্যাটাস</option>
            <option value="ACTIVE">সক্রিয় (ACTIVE)</option>
            <option value="UNDER_TEST">পরীক্ষাধীন (UNDER_TEST)</option>
            <option value="SUSPENDED">স্থগিত (SUSPENDED)</option>
            <option value="DECOMMISSIONED">বাতিল (DECOMMISSIONED)</option>
          </select>

          {(categoryFilter || effectivenessFilter || statusFilter || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter("");
                setEffectivenessFilter("");
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

      {/* Controls Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">নিয়ন্ত্রণ রেজিস্টার লোড হচ্ছে...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
        ) : controls.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-slate-400 text-xs">কোনো অভ্যন্তরীণ নিয়ন্ত্রণ ব্যবস্থা পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">আইডি ও ধরণ</th>
                  <th className="py-3.5 px-4">নিয়ন্ত্রণের নাম ও উদ্দেশ্য</th>
                  <th className="py-3.5 px-4">ক্যাটাগরি / উৎস</th>
                  <th className="py-3.5 px-4">ফ্রিকোয়েন্সি / রূপ</th>
                  <th className="py-3.5 px-4">দায়িত্বপ্রাপ্ত কর্মকর্তা</th>
                  <th className="py-3.5 px-4 text-center">সর্বশেষ টেস্ট ফলাফল</th>
                  <th className="py-3.5 px-4 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {controls.map((ctrl) => (
                  <tr key={ctrl.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-mono font-medium text-emerald-400">{ctrl.id}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                        {ctrl.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-semibold text-white">{ctrl.nameBn}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        লক্ষ্য: {ctrl.controlObjectiveBn}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                        {ctrl.category}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">{ctrl.sourceModule}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-200">{ctrl.frequency}</p>
                      <p className="text-[10px] text-slate-500">{ctrl.automationType}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-200">{ctrl.ownerName}</p>
                      <p className="text-[10px] text-slate-500">{ctrl.ownerRole}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          ctrl.lastTestResult === "EFFECTIVE"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : ctrl.lastTestResult === "PARTIALLY_EFFECTIVE"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : ctrl.lastTestResult === "INEFFECTIVE"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {ctrl.lastTestResult || "পরীক্ষাহীন"}
                      </span>
                      {ctrl.lastTestedAt && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {ctrl.lastTestedAt.slice(0, 10)}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openTestModal(ctrl)}
                        className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium shadow transition flex items-center gap-1 ml-auto"
                      >
                        <span>🧪</span> টেস্ট করুন
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Test Modal */}
      {showTestModal && selectedControl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">নিয়ন্ত্রণ কার্যকারিতা পরীক্ষা (Control Test)</h3>
                <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                  {selectedControl.id} — {selectedControl.nameBn}
                </p>
              </div>
              <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordTest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">পরীক্ষা পদ্ধতি (Test Method)</label>
                  <select
                    value={testMethod}
                    onChange={(e) => setTestMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="SAMPLE_AUDIT">নমুনা নিরীক্ষা (Sample Audit)</option>
                    <option value="SYSTEM_QUERY">সিস্টেম কুয়েরি ও লগ যাচাই</option>
                    <option value="OBSERVATION">সরাসরি পর্যবেক্ষণ (Observation)</option>
                    <option value="REPERFORMANCE">পুনর্বাস্তবায়ন পরীক্ষা (Re-performance)</option>
                    <option value="INSPECTION">ডকুমেন্ট ও স্বাক্ষর পরীক্ষা</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">নমুনার আকার (Sample Size)</label>
                  <input
                    type="number"
                    min="1"
                    value={sampleSize}
                    onChange={(e) => setSampleSize(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">পরীক্ষিত জনসংখ্যা / রেকর্ডের পরিধি</label>
                <input
                  type="text"
                  value={popDesc}
                  onChange={(e) => setPopDesc(e.target.value)}
                  placeholder="যেমন: ২০২৬ সালের মার্চ মাসের সকল ব্যাংক লেনদেন ও ভাউচার"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">প্রত্যাশিত ফলাফল (Expected Result) *</label>
                <textarea
                  rows={2}
                  value={expectedRes}
                  onChange={(e) => setExpectedRes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">বাস্তব ফলাফল (Actual Result) *</label>
                <textarea
                  rows={2}
                  value={actualRes}
                  onChange={(e) => setActualRes(e.target.value)}
                  placeholder="অডিটে কী পাওয়া গেছে? কোনো গরমিল বা অনুপস্থিতি লক্ষ্য করা গেছে কি?"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">পরীক্ষার রায় (Test Result) *</label>
                  <select
                    value={testResult}
                    onChange={(e: any) => setTestResult(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="EFFECTIVE">কার্যকর (EFFECTIVE)</option>
                    <option value="PARTIALLY_EFFECTIVE">আংশিক কার্যকর (PARTIALLY_EFFECTIVE)</option>
                    <option value="INEFFECTIVE">অকার্যকর (INEFFECTIVE)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">ব্যত্যয় / বিচ্যুতি সংখ্যা (Exceptions)</label>
                  <input
                    type="number"
                    min="0"
                    value={exceptionCount}
                    onChange={(e) => setExceptionCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">প্রমাণ রেফারেন্স (Evidence Ref) *</label>
                <input
                  type="text"
                  value={evidenceRef}
                  onChange={(e) => setEvidenceRef(e.target.value)}
                  placeholder="যেমন: AUDIT-TEST-2026-031 বা ভাউচার বা লগ রেফারেন্স"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">নিরীক্ষকের অতিরিক্ত নোট</label>
                <input
                  type="text"
                  value={testNotes}
                  onChange={(e) => setTestNotes(e.target.value)}
                  placeholder="ভবিষ্যতে প্রতিকারমূলক ব্যবস্থার কোনো পরামর্শ..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "টেস্ট ফলাফল সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Control Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">নতুন অভ্যন্তরীণ নিয়ন্ত্রণ নথিভুক্তকরণ</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateControl} className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">নিয়ন্ত্রণের নাম (বাংলায়) *</label>
                <input
                  type="text"
                  value={newNameBn}
                  onChange={(e) => setNewNameBn(e.target.value)}
                  placeholder="যেমন: দুই স্তরের চেক অনুমোদন ও ব্যাংক রিকনসিলিয়েশন"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">নিয়ন্ত্রণের উদ্দেশ্য (Objective) *</label>
                <textarea
                  rows={2}
                  value={newObjectiveBn}
                  onChange={(e) => setNewObjectiveBn(e.target.value)}
                  placeholder="এই নিয়ন্ত্রণ দ্বারা প্রতিষ্ঠানে কী নিশ্চিত করা হচ্ছে..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">বিস্তারিত বিবরণ ও কার্যপ্রণালী</label>
                <textarea
                  rows={2}
                  value={newDescBn}
                  onChange={(e) => setNewDescBn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">ক্যাটাগরি</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="FINANCIAL">আর্থিক (Financial)</option>
                    <option value="ACADEMIC">একাডেমিক (Academic)</option>
                    <option value="STUDENT">শিক্ষার্থী (Student)</option>
                    <option value="OPERATIONAL">পরিচালন (Operational)</option>
                    <option value="SECURITY">নিরাপত্তা (Security)</option>
                    <option value="TECHNOLOGY">প্রযুক্তি (Technology)</option>
                    <option value="COMPLIANCE_GOVERNANCE">অনুপালন (Compliance)</option>
                    <option value="VENDOR_PROCUREMENT">ক্রয় (Procurement)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">উৎস মডিউল</label>
                  <select
                    value={newSourceModule}
                    onChange={(e) => setNewSourceModule(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="FINANCE_PHASE_6">Phase 6 - অর্থ ও হিসাব</option>
                    <option value="ACADEMIC_PHASE_4">Phase 4 - পরীক্ষা ও ফলাফল</option>
                    <option value="SECURITY_PHASE_17_24">Phase 17/24 - নিরাপত্তা</option>
                    <option value="OPERATIONS_PHASE_16">Phase 16 - ব্যাকআপ ও পরিচালনা</option>
                    <option value="VENDOR_PHASE_40">Phase 40 - ক্রয় ও ভেন্ডর</option>
                    <option value="GENERAL">সাধারণ প্রাতিষ্ঠানিক</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">নিয়ন্ত্রণের ধরণ</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="PREVENTIVE">নিবারক (Preventive)</option>
                    <option value="DETECTIVE">শনাক্তকারী (Detective)</option>
                    <option value="CORRECTIVE">সংশোধনকারী (Corrective)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">অটোমেশন মাত্রা</label>
                  <select
                    value={newAutomation}
                    onChange={(e) => setNewAutomation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="AUTOMATED">সম্পূর্ণ অটোমেটেড</option>
                    <option value="MANUAL">ম্যানুয়াল / মানবিক</option>
                    <option value="HYBRID">হাইব্রিড (সিস্টেম+মানুষ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">ফ্রিকোয়েন্সি</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="REAL_TIME">রিয়েল-টাইম</option>
                    <option value="DAILY">দৈনিক</option>
                    <option value="WEEKLY">সাপ্তাহিক</option>
                    <option value="MONTHLY">মাসিক</option>
                    <option value="QUARTERLY">ত্রৈমাসিক</option>
                    <option value="ANNUAL">বার্ষিক</option>
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
                    placeholder="যেমন: প্রধান হিসাবরক্ষক"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">পদবী</label>
                  <input
                    type="text"
                    value={newOwnerRole}
                    onChange={(e) => setNewOwnerRole(e.target.value)}
                    placeholder="যেমন: ACCOUNTANT"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">প্রমাণ আবশ্যকতার বিবরণ (Evidence Requirement) *</label>
                <input
                  type="text"
                  value={newEvidenceReq}
                  onChange={(e) => setNewEvidenceReq(e.target.value)}
                  placeholder="যেমন: ব্যাংকের মাসিক হিসাব বিবরণী এবং উভয় কর্মকর্তার স্বাক্ষরযুক্ত বিবরণী"
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
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "নিয়ন্ত্রণ নথিভুক্ত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
