"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface WorkflowOverviewData {
  workflows: {
    totalDefinitions: number;
    activeDefinitions: number;
    totalInstances: number;
    running: number;
    waitingApproval: number;
    completed: number;
    failed: number;
  };
  jobs: {
    totalJobs: number;
    queued: number;
    running: number;
    succeeded: number;
    retrying: number;
    deadLetter: number;
    cancelled: number;
  };
  approvals: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
  };
  totalRules: number;
  activeRules: number;
  totalEventsEmitted: number;
  recentEvents: any[];
  recentInstances: any[];
  timestamp: string;
}

export default function WorkflowAutomationPage() {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "RULES" | "APPROVALS" | "JOBS" | "EVENTS">("OVERVIEW");
  const [overview, setOverview] = useState<WorkflowOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rules state
  const [rules, setRules] = useState<any[]>([]);
  const [ruleConflicts, setRuleConflicts] = useState<any[]>([]);
  const [selectedRuleDomain, setSelectedRuleDomain] = useState<string>("");
  const [simulationRuleId, setSimulationRuleId] = useState<string>("");
  const [simulationPayloadText, setSimulationPayloadText] = useState<string>("{\n  \"status\": \"ACTIVE\",\n  \"consecutiveAbsences\": 3\n}");
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  // AI Draft Rule State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDraftResult, setAiDraftResult] = useState<any | null>(null);
  const [generatingAiDraft, setGeneratingAiDraft] = useState(false);

  // Approvals State
  const [approvals, setApprovals] = useState<any[]>([]);
  const [approvalFilterStatus, setApprovalFilterStatus] = useState<string>("PENDING");
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [resolvingApproval, setResolvingApproval] = useState(false);

  // Jobs State
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobFilterStatus, setJobFilterStatus] = useState<string>("");
  const [replayingJobId, setReplayingJobId] = useState<string | null>(null);

  // Events State
  const [events, setEvents] = useState<any[]>([]);
  const [eventSearchQuery, setEventSearchQuery] = useState("");

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === "RULES") fetchRules();
    if (activeTab === "APPROVALS") fetchApprovals(approvalFilterStatus);
    if (activeTab === "JOBS") fetchJobs(jobFilterStatus);
    if (activeTab === "EVENTS") fetchEvents();
  }, [activeTab, approvalFilterStatus, jobFilterStatus, selectedRuleDomain]);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/workflows/overview");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch overview");
      setOverview(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      const url = selectedRuleDomain
        ? `/api/admin/workflows/rules?domain=${selectedRuleDomain}`
        : "/api/admin/workflows/rules";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setRules(json.data.rules || []);
        setRuleConflicts(json.data.conflicts || []);
        if (json.data.rules?.length > 0 && !simulationRuleId) {
          setSimulationRuleId(json.data.rules[0].ruleId);
        }
      }
    } catch (err) {
      console.error("Rules fetch error:", err);
    }
  };

  const fetchApprovals = async (status: string) => {
    try {
      const url = status
        ? `/api/admin/workflows/approvals?status=${status}`
        : "/api/admin/workflows/approvals";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setApprovals(json.data.requests || []);
      }
    } catch (err) {
      console.error("Approvals fetch error:", err);
    }
  };

  const fetchJobs = async (status: string) => {
    try {
      const url = status
        ? `/api/admin/workflows/jobs?status=${status}`
        : "/api/admin/workflows/jobs";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setJobs(json.data.jobs || []);
      }
    } catch (err) {
      console.error("Jobs fetch error:", err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/admin/workflows/events");
      const json = await res.json();
      if (json.success) {
        setEvents(json.data.events || []);
      }
    } catch (err) {
      console.error("Events fetch error:", err);
    }
  };

  // Run Rule Dry-Run Simulation
  const handleRunSimulation = async () => {
    if (!simulationRuleId) return;
    setSimulating(true);
    setSimulationResult(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(simulationPayloadText);
      } catch (e) {
        alert("স্যাম্পল পেলোডটি সঠিক JSON ফরম্যাটে হতে হবে।");
        setSimulating(false);
        return;
      }

      const res = await fetch("/api/admin/workflows/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun: true,
          ruleId: simulationRuleId,
          samplePayload: parsed,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSimulationResult(json.simulation);
    } catch (err: any) {
      alert("সিমুলেশন ত্রুটি: " + err.message);
    } finally {
      setSimulating(false);
    }
  };

  // Generate AI Draft Rule
  const handleGenerateAiDraft = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingAiDraft(true);
    setAiDraftResult(null);
    try {
      const res = await fetch("/api/admin/workflows/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptBn: aiPrompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAiDraftResult(json.data);
    } catch (err: any) {
      alert("এআই ড্রাফট রুল ত্রুটি: " + err.message);
    } finally {
      setGeneratingAiDraft(false);
    }
  };

  // Handle Approval Decision
  const handleResolveApproval = async (decision: "APPROVED" | "REJECTED") => {
    if (!selectedApproval) return;
    if (!decisionReason || decisionReason.trim().length < 5) {
      alert("সিদ্ধান্তের কারণ সুনির্দিষ্টভাবে উল্লেখ করা বাধ্যতামূলক।");
      return;
    }
    setResolvingApproval(true);
    try {
      const res = await fetch("/api/admin/workflows/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedApproval.requestId,
          decision,
          decisionReason,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setActionMessage(json.message);
      setSelectedApproval(null);
      setDecisionReason("");
      fetchApprovals(approvalFilterStatus);
      fetchOverview();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert("অনুমোদন সিদ্ধান্ত গ্রহণে ত্রুটি: " + err.message);
    } finally {
      setResolvingApproval(false);
    }
  };

  // Replay Dead-Letter Job
  const handleReplayJob = async (jobId: string) => {
    setReplayingJobId(jobId);
    try {
      const res = await fetch("/api/admin/workflows/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REPLAY", jobId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setActionMessage(json.message);
      fetchJobs(jobFilterStatus);
      fetchOverview();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert("জব রিপ্লে ত্রুটি: " + err.message);
    } finally {
      setReplayingJobId(null);
    }
  };

  // Toggle Rule Status (ACTIVE / PAUSED)
  const handleToggleRuleStatus = async (ruleId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/workflows/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_STATUS", ruleId, newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setActionMessage(json.message);
      fetchRules();
      fetchOverview();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert("রুল স্ট্যাটাস পরিবর্তন ব্যর্থ: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚙️</span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                প্রাতিষ্ঠানিক ওয়ার্কফ্লো ও রুলস ইঞ্জিন
              </h1>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs px-2.5 py-1 rounded-full font-mono">
                PHASE-27
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Eliotganj Hazi Rohmatollah Jamiria Madrasha — ইভেন্ট চালিত প্রসেস অটোমেশন, মানবীয় অনুমোদন গেটওয়ে ও ফল্ট-টলারেন্ট অর্কেস্ট্রেশন
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/business-intelligence"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg transition"
            >
              📊 বিজনেস ইন্টেলিজেন্স
            </Link>
            <Link
              href="/admin"
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              ← মূল ড্যাশবোর্ড
            </Link>
          </div>
        </div>

        {/* Global Action Message Banner */}
        {actionMessage && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-700 rounded-lg text-emerald-200 text-sm flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-xs text-emerald-400 hover:underline">
              বন্ধ করুন
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto border-b border-slate-800 pb-2">
          {[
            { id: "OVERVIEW", label: "সিস্টেম ওভারভিউ", icon: "📈" },
            { id: "RULES", label: "নিয়মাবলী ও সিমুলেশন", icon: "⚖️" },
            { id: "APPROVALS", label: "মানবীয় অনুমোদন গেটওয়ে", icon: "🛡️" },
            { id: "JOBS", label: "জব কিউ ও ডেড-লেটার", icon: "🔄" },
            { id: "EVENTS", label: "ডোমেন ইভেন্ট অডিট", icon: "📜" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === "APPROVALS" && overview?.approvals?.pending ? (
                <span className="bg-amber-500 text-slate-950 text-xs px-1.5 py-0.2 rounded-full font-bold">
                  {overview.approvals.pending}
                </span>
              ) : null}
              {tab.id === "JOBS" && overview?.jobs?.deadLetter ? (
                <span className="bg-rose-500 text-white text-xs px-1.5 py-0.2 rounded-full font-bold">
                  {overview.jobs.deadLetter}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {loading && activeTab === "OVERVIEW" ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p>ওয়ার্কফ্লো ও অর্কেস্ট্রেশন ডাটা লোড হচ্ছে...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300">
            <h3 className="font-semibold text-lg mb-1">তথ্য প্রদর্শনে ত্রুটি</h3>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchOverview}
              className="mt-3 px-4 py-1.5 bg-rose-800 hover:bg-rose-700 text-white text-xs rounded-lg transition"
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        ) : null}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "OVERVIEW" && overview && (
          <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">সক্রিয় ওয়ার্কফ্লো</span>
                <div className="text-2xl font-bold text-white mt-1">
                  {overview.workflows.activeDefinitions} <span className="text-xs text-slate-500">/ {overview.workflows.totalDefinitions}</span>
                </div>
                <div className="text-xs text-emerald-400 mt-1">
                  মোট এক্সিকিউশন: {overview.workflows.totalInstances}
                </div>
              </div>

              <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">অপেক্ষমান মানবীয় অনুমোদন</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">
                  {overview.approvals.pending}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  অনুমোদিত: {overview.approvals.approved} | প্রত্যাখ্যাত: {overview.approvals.rejected}
                </div>
              </div>

              <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">জব কিউ অবস্থা</span>
                <div className="text-2xl font-bold text-sky-400 mt-1">
                  {overview.jobs.queued + overview.jobs.running} <span className="text-xs text-slate-500">চলমান</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  সফল: {overview.jobs.succeeded} | পুনঃচেষ্টা: {overview.jobs.retrying}
                </div>
              </div>

              <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">ডেড-লেটার কোয়ারেন্টাইন</span>
                <div className={`text-2xl font-bold mt-1 ${overview.jobs.deadLetter > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {overview.jobs.deadLetter}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {overview.jobs.deadLetter > 0 ? "জরুরি পুনঃনিরীক্ষণ আবশ্যক" : "সব স্বয়ংক্রিয় জব স্বাস্থ্যকর"}
                </div>
              </div>
            </div>

            {/* Invariant Banner */}
            <div className="p-4 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-800/60 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <h4 className="text-sm font-semibold text-indigo-200">
                    মাস্টার গভর্ন্যান্স ইনভ্যারিয়েন্ট: Automate Process, Not Authority
                  </h4>
                  <p className="text-xs text-indigo-300/80 mt-0.5">
                    উচ্চ-ঝুঁকিপূর্ণ কার্যক্রম (ভর্তি অনুমোদন, ফলাফল প্রকাশ, ফি মওকুফ, ক্রয়াদেশ) স্বয়ংক্রিয়ভাবে বাস্তবায়নযোগ্য নয়। সকল কার্যপ্রবাহ মানবীয় সাইন-অফের অপেক্ষায় সংরক্ষিত হয়।
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("APPROVALS")}
                className="whitespace-nowrap px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition"
              >
                অনুমোদন গেটওয়ে দেখুন →
              </button>
            </div>

            {/* Split Tables: Recent Instances & Recent Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Instances */}
              <div className="p-5 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <span>⚡</span> সাম্প্রতিক ওয়ার্কফ্লো এক্সিকিউশন
                  </h3>
                  <span className="text-xs text-slate-400">{overview.recentInstances?.length || 0}টি প্রদর্শিত</span>
                </div>

                <div className="space-y-3">
                  {overview.recentInstances?.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">কোন সাম্প্রতিক ওয়ার্কফ্লো এক্সিকিউশন নেই।</div>
                  ) : (
                    overview.recentInstances?.map((inst: any) => (
                      <div key={inst.instanceId} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400">{inst.instanceId}</span>
                            <span className="text-xs text-slate-300 font-medium">({inst.workflowCode})</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                            <span>ধাপ: {inst.currentStepIndex + 1}/{inst.stepsExecution?.length || 0}</span>
                            <span>ট্রিগার: {inst.triggerEventId}</span>
                          </div>
                        </div>

                        <div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            inst.status === "COMPLETED" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                            inst.status === "WAITING_APPROVAL" ? "bg-amber-950 text-amber-400 border border-amber-800 animate-pulse" :
                            inst.status === "FAILED" ? "bg-rose-950 text-rose-400 border border-rose-800" :
                            "bg-sky-950 text-sky-400 border border-sky-800"
                          }`}>
                            {inst.status === "WAITING_APPROVAL" ? "মানবীয় অনুমোদন আবশ্যক" : inst.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Events */}
              <div className="p-5 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <span>📡</span> সাম্প্রতিক ডোমেন ইভেন্ট স্ট্রিম
                  </h3>
                  <button
                    onClick={() => setActiveTab("EVENTS")}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    সকল ইভেন্ট অডিট →
                  </button>
                </div>

                <div className="space-y-3">
                  {overview.recentEvents?.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">কোন ইভেন্ট রেকর্ড পাওয়া যায়নি।</div>
                  ) : (
                    overview.recentEvents?.map((evt: any) => (
                      <div key={evt.eventId} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-amber-300">{evt.eventType}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{evt.sourceModule}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 font-mono">
                            Entity: {evt.entityType}:{evt.entityId} • {new Date(evt.occurredAt).toLocaleTimeString("bn-BD")}
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-500">
                          {evt.eventId}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RULES & SIMULATION */}
        {activeTab === "RULES" && (
          <div className="space-y-6">
            {/* Header & Conflict Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">ডিক্লারেটিভ বিজনেস রুলস রেজিস্ট্রি</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  নিরাপদ ডিএসএল ভিত্তিক নিয়মাবলী — কোনো ধরনের এক্সিকিউটেবল জাভাস্ক্রিপ্ট বা এসকিউএল ইনজেকশন মুক্ত।
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedRuleDomain}
                  onChange={(e) => setSelectedRuleDomain(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="">সকল ডোমেন</option>
                  <option value="ADMISSION">ADMISSION (ভর্তি)</option>
                  <option value="ATTENDANCE">ATTENDANCE (উপস্থিতি)</option>
                  <option value="FINANCE">FINANCE (অর্থায়ন)</option>
                  <option value="INVENTORY">INVENTORY (ইনভেনটরি)</option>
                  <option value="OPERATIONS">OPERATIONS (অপারেশনস)</option>
                </select>
              </div>
            </div>

            {/* Conflict Detector Alert */}
            {ruleConflicts.length > 0 && (
              <div className="p-4 bg-amber-950/60 border border-amber-800 rounded-xl text-amber-200">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <span>⚠️</span>
                  <span>পারস্পরিক বিপরীতমুখী রুল দ্বন্দ্ব চিহ্নিত হয়েছে ({ruleConflicts.length}টি)</span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-amber-300">
                  {ruleConflicts.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-mono">{c.ruleA} ↔ {c.ruleB}:</span>
                      <span>{c.reasonBn}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Split Screen: Rules List & Dry-Run Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Rules List (2 Columns) */}
              <div className="lg:col-span-2 space-y-4">
                {rules.map((rule) => (
                  <div key={rule.ruleId} className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-400">{rule.ruleId}</span>
                          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">v{rule.version}</span>
                          <span className="text-xs text-slate-400">[{rule.domain}]</span>
                        </div>
                        <h4 className="font-semibold text-white text-sm mt-1">{rule.nameBn}</h4>
                        <div className="text-xs text-slate-400">ট্রিগার ইভেন্ট: <span className="font-mono text-amber-300">{rule.triggerEvent}</span></div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleRuleStatus(rule.ruleId, rule.status)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
                            rule.status === "ACTIVE"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900"
                              : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                          }`}
                        >
                          {rule.status === "ACTIVE" ? "সক্রিয় (ACTIVE)" : "স্থগিত (PAUSED)"}
                        </button>
                      </div>
                    </div>

                    {/* Conditions Box */}
                    <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-1">
                      <div className="text-slate-400 font-semibold mb-1">শর্তাবলী (DSL):</div>
                      {rule.conditions?.map((cond: any, idx: number) => (
                        <div key={idx} className="font-mono text-sky-300 flex items-center gap-2">
                          <span>• {cond.field}</span>
                          <span className="text-amber-400 font-bold">{cond.operator}</span>
                          <span>{JSON.stringify(cond.value)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions Box */}
                    <div className="text-xs text-slate-400 flex flex-wrap gap-2">
                      <span className="font-semibold text-slate-300">পদক্ষেপ:</span>
                      {rule.actions?.map((act: any, idx: number) => (
                        <span key={idx} className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                          act.isHighRisk ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                        }`}>
                          {act.actionType} {act.isHighRisk && "⚠️ [অনুমোদন সাপেক্ষ]"}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dry-Run Simulator & AI Assistant (1 Column) */}
              <div className="space-y-6">
                {/* Dry Run Simulation Panel */}
                <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <span>🧪</span>
                    <span>ড্রাই-রান রুল সিমুলেটর (Dry-Run Mode)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    প্রোডাকশন ডেটা অক্ষুণ্ণ রেখে রুল ম্যাচিং ও অ্যাকশন প্রিভিউ যাচাই করুন।
                  </p>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-medium">পরীক্ষণীয় রুল:</label>
                    <select
                      value={simulationRuleId}
                      onChange={(e) => setSimulationRuleId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg p-2.5 text-slate-200"
                    >
                      {rules.map((r) => (
                        <option key={r.ruleId} value={r.ruleId}>
                          {r.ruleId} — {r.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-medium">স্যাম্পল পেলোড (JSON):</label>
                    <textarea
                      value={simulationPayloadText}
                      onChange={(e) => setSimulationPayloadText(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-700 text-xs font-mono rounded-lg p-2.5 text-emerald-400"
                    />
                  </div>

                  <button
                    onClick={handleRunSimulation}
                    disabled={simulating}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
                  >
                    {simulating ? "সিমুলেট হচ্ছে..." : "সিমুলেশন রান করুন"}
                  </button>

                  {/* Simulation Output */}
                  {simulationResult && (
                    <div className="p-3 bg-slate-900 border border-indigo-900/60 rounded-lg text-xs space-y-2 animate-fade-in">
                      <div className="text-amber-400 font-bold text-[11px]">
                        {simulationResult.simulationNotice}
                      </div>
                      <div className="flex items-center gap-2 font-semibold">
                        <span>ম্যাচ ফলাফল:</span>
                        <span className={simulationResult.result.matched ? "text-emerald-400" : "text-rose-400"}>
                          {simulationResult.result.matched ? "MATCHED (পূরণ হয়েছে)" : "NOT MATCHED (ম্যাচ করেনি)"}
                        </span>
                      </div>
                      <p className="text-slate-300">{simulationResult.result.explanationBn}</p>
                    </div>
                  )}
                </div>

                {/* AI Rule Draft Assistant */}
                <div className="p-5 bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-800/60 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                    <span>✨</span>
                    <span>এআই রুল ড্রাফটার (AI Decision Support)</span>
                  </div>
                  <p className="text-xs text-purple-200/80">
                    বাংলা ভাষায় নিয়ম বর্ণনা করুন। এআই খসড়া (DRAFT) ডিএসএল রুল প্রণয়ন করবে যা রিভিউ শেষে অ্যাক্টিভ করা যাবে।
                  </p>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="যেমন: টানা ৩ দিন অনুপস্থিত থাকলে অভিভাবককে সতর্ক করো"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full bg-slate-900 border border-indigo-800 text-xs rounded-lg p-2.5 text-slate-200"
                    />
                  </div>

                  <button
                    onClick={handleGenerateAiDraft}
                    disabled={generatingAiDraft || !aiPrompt.trim()}
                    className="w-full py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
                  >
                    {generatingAiDraft ? "ড্রাফট তৈরি হচ্ছে..." : "এআই খসড়া প্রণয়ন করুন"}
                  </button>

                  {aiDraftResult && (
                    <div className="p-3 bg-slate-900 border border-purple-900 rounded-lg text-xs space-y-2">
                      <div className="text-purple-300 font-semibold">{aiDraftResult.draftRule.nameBn}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Trigger: {aiDraftResult.draftRule.triggerEvent} | Status: {aiDraftResult.draftRule.status}
                      </div>
                      <div className="text-[11px] text-amber-300">
                        {aiDraftResult.noticeBn}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HUMAN APPROVAL GATEWAY */}
        {activeTab === "APPROVALS" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">মানবীয় অনুমোদন গেটওয়ে (Human Approval Gateway)</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  উচ্চ-ঝুঁকিপূর্ণ প্রাতিষ্ঠানিক কার্যক্রমের আনুষ্ঠানিক পর্যালোচনা ও সাইন-অফ গেটওয়ে।
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2">
                {["PENDING", "APPROVED", "REJECTED", "EXPIRED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setApprovalFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      approvalFilterStatus === st
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {st === "PENDING" ? "অপেক্ষমান" : st === "APPROVED" ? "অনুমোদিত" : st === "REJECTED" ? "প্রত্যাখ্যাত" : "মেয়াদোত্তীর্ণ"}
                  </button>
                ))}
              </div>
            </div>

            {/* Approval Requests Table */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3.5">রিকুয়েস্ট আইডি</th>
                      <th className="p-3.5">কার্যক্রম / বিষয়</th>
                      <th className="p-3.5">টার্গেট এন্টিটি</th>
                      <th className="p-3.5">প্রয়োজনীয় রোল</th>
                      <th className="p-3.5">মেয়াদ উত্তীর্ণ</th>
                      <th className="p-3.5">স্ট্যাটাস</th>
                      <th className="p-3.5 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {approvals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          এই ক্যাটাগরিতে কোনো অনুমোদন রিকুয়েস্ট নেই।
                        </td>
                      </tr>
                    ) : (
                      approvals.map((req) => (
                        <tr key={req.requestId} className="hover:bg-slate-800/30 transition">
                          <td className="p-3.5 font-mono font-bold text-indigo-400">{req.requestId}</td>
                          <td className="p-3.5">
                            <div className="font-semibold text-white">{req.titleBn}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{req.actionType}</div>
                          </td>
                          <td className="p-3.5 font-mono text-[11px]">
                            {req.entityType}:{req.entityId}
                          </td>
                          <td className="p-3.5 font-semibold text-amber-300">{req.requiredRole}</td>
                          <td className="p-3.5 text-slate-400">
                            {new Date(req.expiresAt).toLocaleDateString("bn-BD")}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
                              req.status === "PENDING" ? "bg-amber-950 text-amber-300 border border-amber-800 animate-pulse" :
                              req.status === "APPROVED" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                              req.status === "REJECTED" ? "bg-rose-950 text-rose-300 border border-rose-800" :
                              "bg-slate-800 text-slate-400"
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {req.status === "PENDING" ? (
                              <button
                                onClick={() => setSelectedApproval(req)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs transition"
                              >
                                পর্যালোচনা ও সাইন-অফ
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500">সম্পন্ন ({req.decidedBy || "N/A"})</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approval Decision Modal */}
            {selectedApproval && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 animate-scale-up">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🛡️</span>
                      <h3 className="font-bold text-white text-base">অনুমোদন পর্যালোচনা: {selectedApproval.requestId}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedApproval(null)}
                      className="text-slate-400 hover:text-white text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400">শিরোনাম:</span>
                      <div className="font-semibold text-white text-sm mt-0.5">{selectedApproval.titleBn}</div>
                    </div>

                    <div className="p-3 bg-slate-800/60 rounded-lg text-slate-300">
                      <span className="text-slate-400 font-semibold block mb-1">যৌক্তিকতা ও কারণ:</span>
                      {selectedApproval.reasonBn}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-slate-400 font-mono">
                      <div>Action: <span className="text-white">{selectedApproval.actionType}</span></div>
                      <div>Required Role: <span className="text-amber-300">{selectedApproval.requiredRole}</span></div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-slate-200 font-semibold block">
                        সিদ্ধান্তের কারণ / প্রাতিষ্ঠানিক মন্তব্য (বাধ্যতামূলক):
                      </label>
                      <textarea
                        rows={3}
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                        placeholder="অনুমোদন বা প্রত্যাখ্যানের সুনির্দিষ্ট কারণ লিখুন..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedApproval(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
                    >
                      বাতিল
                    </button>
                    <button
                      disabled={resolvingApproval}
                      onClick={() => handleResolveApproval("REJECTED")}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
                    >
                      প্রত্যাখ্যান করুন (REJECT)
                    </button>
                    <button
                      disabled={resolvingApproval}
                      onClick={() => handleResolveApproval("APPROVED")}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
                    >
                      অনুমোদন করুন (APPROVE)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: JOB QUEUE & DEAD-LETTER */}
        {activeTab === "JOBS" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">স্বয়ংক্রিয় ব্যাকগ্রাউন্ড জব কিউ ও ডেড-লেটার</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  ফল্ট-টলারেন্ট ব্যাকঅফ পুনঃচেষ্টা নীতি ও অসফল জবের কোয়ারেন্টাইন ব্যবস্থাপনা।
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                {["", "DEAD_LETTER", "QUEUED", "RUNNING", "SUCCEEDED", "RETRYING"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setJobFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      jobFilterStatus === st
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {st === "" ? "সকল জব" : st === "DEAD_LETTER" ? "ডেড-লেটার ⚠️" : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3.5">জব আইডি</th>
                      <th className="p-3.5">জব টাইপ</th>
                      <th className="p-3.5">প্রচেষ্টা (Attempts)</th>
                      <th className="p-3.5">তৈরি ও সমাপ্তি</th>
                      <th className="p-3.5">স্ট্যাটাস</th>
                      <th className="p-3.5">ত্রুটির বিবরণ</th>
                      <th className="p-3.5 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          কোনো জব রেকর্ড পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr key={job.jobId} className="hover:bg-slate-800/30 transition">
                          <td className="p-3.5 font-mono font-bold text-sky-400">{job.jobId}</td>
                          <td className="p-3.5 font-mono font-semibold text-white">{job.jobType}</td>
                          <td className="p-3.5 font-mono text-slate-400">{job.attempts} / {job.maxAttempts}</td>
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {new Date(job.createdAt).toLocaleTimeString("bn-BD")}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
                              job.status === "SUCCEEDED" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                              job.status === "DEAD_LETTER" ? "bg-rose-950 text-rose-300 border border-rose-800 font-bold" :
                              job.status === "RETRYING" ? "bg-amber-950 text-amber-300 border border-amber-800" :
                              "bg-sky-950 text-sky-300 border border-sky-800"
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="p-3.5 max-w-xs truncate text-[11px] text-slate-400" title={job.error}>
                            {job.error || "—"}
                          </td>
                          <td className="p-3.5 text-right">
                            {job.status === "DEAD_LETTER" || job.status === "FAILED" ? (
                              <button
                                disabled={replayingJobId === job.jobId}
                                onClick={() => handleReplayJob(job.jobId)}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-lg text-xs transition"
                              >
                                {replayingJobId === job.jobId ? "রিপ্লে হচ্ছে..." : "পুনরায় চালান (REPLAY)"}
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DOMAIN EVENT AUDIT */}
        {activeTab === "EVENTS" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">ডোমেন ইভেন্ট অডিট স্ট্রিম (Append-Only Event Store)</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  কোরিলেশন ও কজেশন চেইন সহ সম্পূর্ণ অপরিবর্তনশীল প্রাতিষ্ঠানিক ইভেন্ট হিস্ট্রি।
                </p>
              </div>

              <div className="w-full md:w-64">
                <input
                  type="text"
                  placeholder="ইভেন্ট বা কোরিলেশন আইডি খুঁজুন..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>

            {/* Events List */}
            <div className="space-y-3">
              {events
                .filter((e) =>
                  !eventSearchQuery ||
                  e.eventType.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                  e.eventId.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                  e.correlationId.toLowerCase().includes(eventSearchQuery.toLowerCase())
                )
                .map((e) => (
                  <div key={e.eventId} className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">{e.eventType}</span>
                        <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
                          {e.sourceModule}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                          v{e.schemaVersion}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
                        <span>Event ID: <span className="text-white">{e.eventId}</span></span>
                        <span>{new Date(e.occurredAt).toLocaleString("bn-BD")}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-400 font-mono">
                      <div>Actor: <span className="text-slate-200">{e.actorType} ({e.actorId})</span></div>
                      <div>Entity: <span className="text-slate-200">{e.entityType}:{e.entityId}</span></div>
                      <div>Correlation: <span className="text-slate-200">{e.correlationId}</span></div>
                    </div>

                    <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800/80 text-[11px] font-mono text-slate-300 overflow-x-auto">
                      {JSON.stringify(e.payload)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
