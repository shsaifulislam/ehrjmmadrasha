"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  ArrowLeft,
  FileText,
  Layers,
  GitMerge,
  Scale,
  GitBranch,
  Upload,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  Eye,
  Info
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

interface DataQualityOverview {
  healthStatus: "HEALTHY" | "WARNING" | "ERROR" | "REVIEW_REQUIRED";
  summary: {
    totalIssues: number;
    openIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    resolvedCount: number;
    pendingDuplicates: number;
    reconciliationMismatches: number;
  };
  authoritativeDomains: Array<{
    domain: string;
    nameBn: string;
    authoritativeModel: string;
    authoritativeStore: string;
    descriptionBn: string;
    immutabilityRule: string;
  }>;
  activeRulesCount: number;
  latestReconciliation?: {
    id: string;
    timestamp: string;
    matchedCount: number;
    mismatchCount: number;
  };
}

interface IssueItem {
  id: string;
  domain: string;
  entityType: string;
  entityId: string;
  ruleCode: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  status: "OPEN" | "INVESTIGATING" | "ASSIGNED" | "CORRECTION_PROPOSED" | "RESOLVED" | "REJECTED" | "WAIVED";
  detectedAt: string;
  evidence: Record<string, any>;
  assignedTo?: string | null;
  proposedCorrection?: string | null;
  resolutionNotes?: string | null;
}

interface DuplicateCandidate {
  id: string;
  survivorId: string;
  duplicateId: string;
  survivorStudentId: string;
  duplicateStudentId: string;
  survivorNameBn: string;
  duplicateNameBn: string;
  survivorPhone: string;
  duplicatePhone: string;
  confidence: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  matchReason: string;
  detectedAt: string;
  status: string;
}

interface ReconciliationReport {
  id: string;
  timestamp: string;
  totalChecks: number;
  matchedCount: number;
  mismatchCount: number;
  reviewRequiredCount: number;
  domainSummaries: {
    finance: { total: number; matched: number; mismatches: number };
    library: { total: number; matched: number; mismatches: number };
    inventory: { total: number; matched: number; mismatches: number };
    payroll: { total: number; matched: number; mismatches: number };
  };
  items: Array<{
    id: string;
    domain: string;
    subsystemA: string;
    subsystemB: string;
    recordIdentifier: string;
    titleBn: string;
    status: string;
    difference?: number;
    notesBn: string;
  }>;
}

export default function DataQualityDashboard() {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "ISSUES" | "DUPLICATES" | "RECONCILIATION" | "LINEAGE" | "IMPORT" | "CORRECTIONS">("OVERVIEW");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [overview, setOverview] = useState<DataQualityOverview | null>(null);
  
  // Issues state
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [issueFilterDomain, setIssueFilterDomain] = useState("");
  const [issueFilterSeverity, setIssueFilterSeverity] = useState("");
  const [issueFilterStatus, setIssueFilterStatus] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [updatingIssue, setUpdatingIssue] = useState(false);

  // Duplicates state
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [selectedMergeCandidate, setSelectedMergeCandidate] = useState<DuplicateCandidate | null>(null);
  const [mergePreview, setMergePreview] = useState<any>(null);
  const [mergeReason, setMergeReason] = useState("");
  const [mergePhrase, setMergePhrase] = useState("");
  const [merging, setMerging] = useState(false);

  // Reconciliation state
  const [reconciliation, setReconciliation] = useState<ReconciliationReport | null>(null);
  const [reconciling, setReconciling] = useState(false);

  // Lineage state
  const [lineageNodes, setLineageNodes] = useState<any[]>([]);

  // Import state
  const [importJson, setImportJson] = useState("");
  const [importValidation, setImportValidation] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  // Corrections state
  const [corrections, setCorrections] = useState<any[]>([]);

  const fetchOverview = async () => {
    try {
      const res = await fetch("/api/admin/data-quality/overview");
      const json = await res.json();
      if (json.success) {
        setOverview(json.data);
      }
    } catch (err) {
      console.error("Overview error:", err);
    }
  };

  const fetchIssues = async () => {
    try {
      let url = "/api/admin/data-quality/issues?";
      if (issueFilterDomain) url += `domain=${encodeURIComponent(issueFilterDomain)}&`;
      if (issueFilterSeverity) url += `severity=${encodeURIComponent(issueFilterSeverity)}&`;
      if (issueFilterStatus) url += `status=${encodeURIComponent(issueFilterStatus)}&`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setIssues(json.data.issues);
      }
    } catch (err) {
      console.error("Issues error:", err);
    }
  };

  const fetchDuplicates = async () => {
    try {
      const res = await fetch("/api/admin/data-quality/duplicates");
      const json = await res.json();
      if (json.success) {
        setDuplicates(json.data.candidates);
      }
    } catch (err) {
      console.error("Duplicates error:", err);
    }
  };

  const fetchReconciliation = async () => {
    try {
      const res = await fetch("/api/admin/data-quality/reconciliation");
      const json = await res.json();
      if (json.success) {
        setReconciliation(json.data);
      }
    } catch (err) {
      console.error("Reconciliation error:", err);
    }
  };

  const fetchLineage = async () => {
    try {
      const res = await fetch("/api/admin/data-quality/lineage");
      const json = await res.json();
      if (json.success) {
        setLineageNodes(json.data);
      }
    } catch (err) {
      console.error("Lineage error:", err);
    }
  };

  const fetchCorrections = async () => {
    try {
      const res = await fetch("/api/portal/data-correction");
      const json = await res.json();
      if (json.success) {
        setCorrections(json.data);
      }
    } catch (err) {
      console.error("Corrections error:", err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchOverview(),
      fetchIssues(),
      fetchDuplicates(),
      fetchReconciliation(),
      fetchLineage(),
      fetchCorrections()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleTriggerScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/admin/data-quality/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (json.success) {
        alert(json.messageBn);
        await loadAll();
      } else {
        alert(json.error || "স্ক্যান ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateIssueStatus = async (newStatus: string) => {
    if (!selectedIssue) return;
    setUpdatingIssue(true);
    try {
      const res = await fetch(`/api/admin/data-quality/issues/${selectedIssue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes: resolutionNotes
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(json.messageBn);
        setSelectedIssue(null);
        setResolutionNotes("");
        await fetchIssues();
        await fetchOverview();
      } else {
        alert(json.error || "আপডেট ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setUpdatingIssue(false);
    }
  };

  const handlePlanMerge = async (candidate: DuplicateCandidate) => {
    setSelectedMergeCandidate(candidate);
    try {
      const res = await fetch("/api/admin/data-quality/duplicates/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          survivorId: candidate.survivorId,
          duplicateId: candidate.duplicateId
        })
      });
      const json = await res.json();
      if (json.success) {
        setMergePreview(json.data);
      } else {
        alert(json.error || "মার্জ প্রিভিউ তৈরি ব্যর্থ।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    }
  };

  const handleExecuteMerge = async () => {
    if (!selectedMergeCandidate) return;
    if (mergePhrase !== "CONFIRM-STUDENT-MERGE") {
      alert("নিরাপত্তা বাক্য 'CONFIRM-STUDENT-MERGE' নির্ভুলভাবে লিখুন।");
      return;
    }
    setMerging(true);
    try {
      const res = await fetch("/api/admin/data-quality/duplicates/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          survivorId: selectedMergeCandidate.survivorId,
          duplicateId: selectedMergeCandidate.duplicateId,
          reason: mergeReason || "প্রশাসনিক ডুপ্লিকেট মার্জ ও শিক্ষার্থী প্রোফাইল একীভূতকরণ",
          confirmationPhrase: mergePhrase
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(json.messageBn);
        setSelectedMergeCandidate(null);
        setMergePreview(null);
        setMergePhrase("");
        setMergeReason("");
        await loadAll();
      } else {
        alert(json.error || "মার্জ ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setMerging(false);
    }
  };

  const handleRunReconciliation = async () => {
    setReconciling(true);
    try {
      const res = await fetch("/api/admin/data-quality/reconciliation", {
        method: "POST"
      });
      const json = await res.json();
      if (json.success) {
        setReconciliation(json.data);
        alert(json.messageBn);
        await fetchOverview();
      } else {
        alert(json.error || "রিকনসিলিয়েশন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setReconciling(false);
    }
  };

  const handleValidateImport = async () => {
    try {
      const rows = JSON.parse(importJson);
      const res = await fetch("/api/admin/data-quality/import/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows })
      });
      const json = await res.json();
      if (json.success) {
        setImportValidation(json.data);
      } else {
        alert(json.error || "ভ্যালিডেশনে ব্যর্থতা।");
      }
    } catch (e: any) {
      alert("সঠিক JSON ফরম্যাটে ডেটা প্রদান করুন: " + e.message);
    }
  };

  const handleCommitImport = async () => {
    if (!importValidation || !importValidation.isValid) return;
    setImporting(true);
    try {
      const rows = JSON.parse(importJson);
      const res = await fetch("/api/admin/data-quality/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows })
      });
      const json = await res.json();
      if (json.success) {
        alert(json.messageBn);
        setImportJson("");
        setImportValidation(null);
        await loadAll();
      } else {
        alert(json.error || "ইমপোর্ট ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setImporting(false);
    }
  };

  const handleReviewCorrection = async (requestId: string, decision: "APPROVED" | "REJECTED") => {
    const notes = prompt("পর্যালোচনা মন্তব্য লিখুন:") || "";
    try {
      const res = await fetch("/api/portal/data-correction", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, decision, notes })
      });
      const json = await res.json();
      if (json.success) {
        alert(json.messageBn);
        await fetchCorrections();
      } else {
        alert(json.error || "পর্যালোচনা সংরক্ষণ ব্যর্থ।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> ড্যাশবোর্ড
            </Link>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h1 className="text-base font-bold tracking-tight text-white">
                ডেটা গভর্ন্যান্স ও মাস্টার ডেটা কোয়ালিটি সেন্টার
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              EHRJ-AI-2026-PHASE25
            </span>
            <button
              onClick={handleTriggerScan}
              disabled={scanning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
              {scanning ? "স্ক্যান চলমান..." : "সম্পূর্ণ ডেটাবেজ স্ক্যান চালান"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 mb-6">
          {[
            { key: "OVERVIEW", label: "সারসংক্ষেপ ও গভর্ন্যান্স", icon: Layers, badge: overview?.healthStatus },
            { key: "ISSUES", label: "ডেটা অসঙ্গতি ও কিউ", icon: AlertTriangle, count: overview?.summary.openIssues },
            { key: "DUPLICATES", label: "ডুপ্লিকেট ও মার্জ হাব", icon: GitMerge, count: overview?.summary.pendingDuplicates },
            { key: "RECONCILIATION", label: "রিকনসিলিয়েশন", icon: Scale, count: overview?.summary.reconciliationMismatches },
            { key: "LINEAGE", label: "মেট্রিক লিনিয়েজ", icon: GitBranch },
            { key: "IMPORT", label: "ব্যাচ ইমপোর্ট", icon: Upload },
            { key: "CORRECTIONS", label: "অভিভাবক আবেদন", icon: UserCheck, count: corrections.filter(c => c.status === "SUBMITTED").length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white text-emerald-800" : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    tab.badge === "HEALTHY" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & MASTER DATA */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            {/* Health Status Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">ডেটাবেজ স্বাস্থ্য অবস্থা</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    overview?.healthStatus === "HEALTHY"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}>
                    {overview?.healthStatus || "CALCULATING"}
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {overview?.healthStatus === "HEALTHY" ? "নিরাপদ ও নির্ভরযোগ্য" : "পর্যালোচনা প্রয়োজন"}
                </div>
                <p className="text-xs text-slate-500 mt-1">সক্রিয় রুলস: {overview?.activeRulesCount || 14} টি পলিসি</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">উন্মুক্ত অসঙ্গতি (Open Issues)</span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {overview?.summary.openIssues ?? 0}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="text-rose-600 font-medium">ক্রিটিক্যাল: {overview?.summary.criticalCount ?? 0}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-amber-600 font-medium">উচ্চ ঝুঁকি: {overview?.summary.highCount ?? 0}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">ডুপ্লিকেট শিক্ষার্থী প্রার্থী</span>
                  <GitMerge className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {overview?.summary.pendingDuplicates ?? 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">মার্জের জন্য অপেক্ষায় থাকা সম্ভাব্য ডুপ্লিকেট রেকর্ড</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">রিকনসিলিয়েশন ব্যবধান</span>
                  <Scale className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {overview?.summary.reconciliationMismatches ?? 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">খতিয়ান ও রসিদ বা স্টক ব্যালেন্স ব্যবধান</p>
              </div>
            </div>

            {/* Authoritative Domain Inventory Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">প্রাতিষ্ঠানিক মাস্টার ডেটা ডোমেইন ও কর্তৃত্বের উৎস</h2>
                  <p className="text-xs text-slate-500">One Source of Truth — কোনো ডোমেইনে দ্বৈত মাস্টার ডেটা থাকতে পারবে না</p>
                </div>
                <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-medium">
                  {overview?.authoritativeDomains.length || 0} টি অনুমোদিত ডোমেইন
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">ডোমেইন কোড</th>
                      <th className="py-3 px-4">ডোমেইনের নাম</th>
                      <th className="py-3 px-4">অনুমোদিত মডেল (Authoritative Model)</th>
                      <th className="py-3 px-4">ডেটা স্টোর</th>
                      <th className="py-3 px-4">ঐতিহাসিক অপরিবর্তনীয়তা নীতি</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview?.authoritativeDomains.map((dom) => (
                      <tr key={dom.domain} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{dom.domain}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{dom.nameBn}</td>
                        <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">{dom.authoritativeModel}</td>
                        <td className="py-3 px-4 text-slate-600">{dom.authoritativeStore}</td>
                        <td className="py-3 px-4 text-slate-500 leading-relaxed">{dom.immutabilityRule}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ISSUES WORK QUEUE */}
        {activeTab === "ISSUES" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> ফিল্টার:
              </span>
              <select
                value={issueFilterSeverity}
                onChange={(e) => setIssueFilterSeverity(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
              >
                <option value="">সকল তীব্রতা (All Severity)</option>
                <option value="CRITICAL">CRITICAL (জরুরি)</option>
                <option value="HIGH">HIGH (উচ্চ)</option>
                <option value="MEDIUM">MEDIUM (মাঝারি)</option>
                <option value="LOW">LOW (নিম্ন)</option>
              </select>

              <select
                value={issueFilterStatus}
                onChange={(e) => setIssueFilterStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
              >
                <option value="">সকল অবস্থা (All Status)</option>
                <option value="OPEN">OPEN (উন্মুক্ত)</option>
                <option value="INVESTIGATING">INVESTIGATING (তদন্তাধীন)</option>
                <option value="RESOLVED">RESOLVED (সমাধানকৃত)</option>
                <option value="REJECTED">REJECTED (প্রত্যাখ্যাত)</option>
              </select>

              <button
                onClick={fetchIssues}
                className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
              >
                ফিল্টার প্রয়োগ করুন
              </button>
            </div>

            {/* Issues List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">শনাক্তকৃত ডেটা অসঙ্গতি তালিকা ({issues.length} টি)</h3>
                <span className="text-xs text-slate-500">প্রশাসনিক অডিট ও সংশোধন কিউ</span>
              </div>
              <div className="divide-y divide-slate-100">
                {issues.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    কোনো ডেটা অসঙ্গতি পাওয়া যায়নি। সিস্টেম স্বাস্থ্যবান।
                  </div>
                ) : (
                  issues.map((iss) => (
                    <div key={iss.id} className="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">{iss.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            iss.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : iss.severity === "HIGH"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {iss.severity}
                          </span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {iss.ruleCode}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            iss.status === "OPEN" ? "bg-red-50 text-red-700" :
                            iss.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                          }`}>
                            {iss.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{iss.titleBn}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{iss.descriptionBn}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setSelectedIssue(iss);
                            setResolutionNotes(iss.resolutionNotes || "");
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition"
                        >
                          বিস্তারিত ও সমাধান
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Issue Resolution Modal */}
            {selectedIssue && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-700">{selectedIssue.id}</span>
                      <h3 className="text-sm font-bold text-slate-900">{selectedIssue.titleBn}</h3>
                    </div>
                    <button onClick={() => setSelectedIssue(null)} className="text-slate-400 hover:text-slate-600">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-700">বিবরণ:</span>
                      <p className="text-slate-600 mt-0.5">{selectedIssue.descriptionBn}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-1">অসঙ্গতির প্রমাণ (Evidence Data):</span>
                      <pre className="font-mono text-[11px] text-slate-700 overflow-x-auto">
                        {JSON.stringify(selectedIssue.evidence, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">প্রশাসনিক সমাধানের নোট (Resolution Notes):</label>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="সমাধানের কারণ বা গৃহীত পদক্ষেপ লিখুন..."
                        rows={3}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t">
                    <button
                      onClick={() => handleUpdateIssueStatus("INVESTIGATING")}
                      disabled={updatingIssue}
                      className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition"
                    >
                      তদন্তাধীন হিসেবে চিহ্নিত
                    </button>
                    <button
                      onClick={() => handleUpdateIssueStatus("REJECTED")}
                      disabled={updatingIssue}
                      className="px-3 py-1.5 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-medium transition"
                    >
                      প্রত্যাখ্যান (False Positive)
                    </button>
                    <button
                      onClick={() => handleUpdateIssueStatus("RESOLVED")}
                      disabled={updatingIssue}
                      className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition"
                    >
                      সমাধান সম্পন্ন (Mark Resolved)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DUPLICATE & MERGE HUB */}
        {activeTab === "DUPLICATES" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">সম্ভাব্য ডুপ্লিকেট শিক্ষার্থী তালিকা ({duplicates.length} টি)</h3>
                  <p className="text-xs text-slate-500">অনন্য ফোন, জন্ম নিবন্ধন বা একই জন্ম তারিখ ও নামের সমন্বয়</p>
                </div>
                <button
                  onClick={fetchDuplicates}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  পুনরায় স্ক্যান
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {duplicates.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    কোনো ডুপ্লিকেট শিক্ষার্থী রেকর্ড পাওয়া যায়নি।
                  </div>
                ) : (
                  duplicates.map((cand) => (
                    <div key={cand.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cand.confidence === "CRITICAL"
                              ? "bg-rose-100 text-rose-800"
                              : cand.confidence === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {cand.confidence} CONFIDENCE
                          </span>
                          <span className="text-xs text-slate-500">{cand.matchReason}</span>
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">{cand.status}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-900 pt-1">
                          <span className="text-emerald-700 font-bold">মূল (Survivor): {cand.survivorStudentId} ({cand.survivorNameBn})</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-rose-700 font-bold">ডুপ্লিকেট: {cand.duplicateStudentId} ({cand.duplicateNameBn})</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePlanMerge(cand)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shrink-0"
                      >
                        মার্জ সিমুলেশন ও মার্জ করুন
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Merge Simulation Modal */}
            {selectedMergeCandidate && mergePreview && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-600">উচ্চ ঝুঁকিপূর্ণ প্রশাসনিক মার্জ (High-Risk Student Merge)</span>
                      <h3 className="text-sm font-bold text-slate-900">
                        {mergePreview.duplicate.studentIdNumber} কে {mergePreview.survivor.studentIdNumber} এর সাথে একীভূতকরণ
                      </h3>
                    </div>
                    <button onClick={() => { setSelectedMergeCandidate(null); setMergePreview(null); }} className="text-slate-400 hover:text-slate-600">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="font-bold text-emerald-800 block">মূল শিক্ষার্থী (Survivor Record):</span>
                        <p>{mergePreview.survivor.fullNameBn} ({mergePreview.survivor.studentIdNumber})</p>
                        <p className="text-slate-500">ফোন: {mergePreview.survivor.fatherPhone || "নাই"}</p>
                      </div>
                      <div>
                        <span className="font-bold text-rose-800 block">বিলুপ্ত হবে (Duplicate Record):</span>
                        <p>{mergePreview.duplicate.fullNameBn} ({mergePreview.duplicate.studentIdNumber})</p>
                        <p className="text-slate-500">ফোন: {mergePreview.duplicate.fatherPhone || "নাই"}</p>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                      <span className="font-bold text-amber-900 block mb-1">স্থানান্তরিত হতে যাওয়া রেকর্ডসমূহ (Impact Analysis):</span>
                      <div className="grid grid-cols-3 gap-2 text-slate-700 text-[11px]">
                        <span>ইনভয়েস: {mergePreview.impactSummary.invoicesCount} টি</span>
                        <span>রশিদ: {mergePreview.impactSummary.receiptsCount} টি</span>
                        <span>হাজিরা: {mergePreview.impactSummary.attendancesCount} টি</span>
                        <span>ফলাফল: {mergePreview.impactSummary.resultsCount} টি</span>
                        <span>সনদ: {mergePreview.impactSummary.certificatesCount} টি</span>
                        <span>ডকুমেন্ট: {mergePreview.impactSummary.documentsCount} টি</span>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">মার্জের কারণ:</label>
                      <input
                        type="text"
                        value={mergeReason}
                        onChange={(e) => setMergeReason(e.target.value)}
                        placeholder="ভুলবশত দ্বৈত ভর্তি ফর্ম পূরণ..."
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
                      <label className="font-bold text-rose-900 block mb-1">
                        স্টেপ-আপ কনফার্মেশন নিশ্চিত করুন (লিখুন: <span className="font-mono text-rose-700 select-all">CONFIRM-STUDENT-MERGE</span>):
                      </label>
                      <input
                        type="text"
                        value={mergePhrase}
                        onChange={(e) => setMergePhrase(e.target.value)}
                        placeholder="CONFIRM-STUDENT-MERGE"
                        className="w-full p-2 border border-rose-300 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t">
                    <button
                      onClick={() => { setSelectedMergeCandidate(null); setMergePreview(null); }}
                      className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                    >
                      বাতিল
                    </button>
                    <button
                      onClick={handleExecuteMerge}
                      disabled={merging || mergePhrase !== "CONFIRM-STUDENT-MERGE"}
                      className="px-4 py-2 text-xs bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-bold transition shadow-sm"
                    >
                      {merging ? "মার্জ প্রক্রিয়াকরণ চলছে..." : "নিশ্চিতভাবে মার্জ কার্যকর করুন"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RECONCILIATION */}
        {activeTab === "RECONCILIATION" && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">ক্রস-মডিউল ডেটা রিকনসিলিয়েশন ইঞ্জিন</h3>
                <p className="text-xs text-slate-500">অর্থনীতি, কিতাব সার্কুলেশন, ইনভেন্টরি স্টক ও বেতন খতিয়ানের মধ্যে গাণিতিক সমতা যাচাই</p>
              </div>
              <button
                onClick={handleRunReconciliation}
                disabled={reconciling}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reconciling ? "animate-spin" : ""}`} />
                {reconciling ? "রিকনসিলিয়েশন চলছে..." : "নতুন রিকনসিলিয়েশন চালান"}
              </button>
            </div>

            {/* Reconciliation Domain Summary Grid */}
            {reconciliation && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500">অর্থনীতি (Finance)</span>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {reconciliation.domainSummaries.finance.matched} / {reconciliation.domainSummaries.finance.total} মিলেছে
                  </div>
                  <span className="text-[11px] text-rose-600 font-medium">{reconciliation.domainSummaries.finance.mismatches} টি গরমিল</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500">লাইব্রেরি (Library)</span>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {reconciliation.domainSummaries.library.matched} / {reconciliation.domainSummaries.library.total} মিলেছে
                  </div>
                  <span className="text-[11px] text-rose-600 font-medium">{reconciliation.domainSummaries.library.mismatches} টি গরমিল</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500">ইনভেন্টরি (Inventory)</span>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {reconciliation.domainSummaries.inventory.matched} / {reconciliation.domainSummaries.inventory.total} মিলেছে
                  </div>
                  <span className="text-[11px] text-rose-600 font-medium">{reconciliation.domainSummaries.inventory.mismatches} টি গরমিল</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500">পেরোল (Payroll)</span>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {reconciliation.domainSummaries.payroll.matched} / {reconciliation.domainSummaries.payroll.total} মিলেছে
                  </div>
                  <span className="text-[11px] text-rose-600 font-medium">{reconciliation.domainSummaries.payroll.mismatches} টি গরমিল</span>
                </div>
              </div>
            )}

            {/* Reconciliation Items Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">রিকনসিলিয়েশন বিস্তারিত খতিয়ান</h4>
                <span className="text-xs text-slate-500">রিপোর্ট আইডি: {reconciliation?.id}</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {reconciliation?.items.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{item.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === "MATCHED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{item.domain}</span>
                      </div>
                      <h5 className="font-bold text-slate-900">{item.titleBn}</h5>
                      <p className="text-slate-600 leading-relaxed">{item.notesBn}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-slate-500 text-[11px] block">{item.subsystemA} ↔ {item.subsystemB}</span>
                      {item.difference !== undefined && item.difference !== 0 && (
                        <span className="font-mono font-bold text-rose-600 text-xs">
                          পার্থক্য: ৳{item.difference.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DATA LINEAGE */}
        {activeTab === "LINEAGE" && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">প্রাতিষ্ঠানিক মেট্রিক ডেটা লিনিয়েজ (Data Lineage & Traceability)</h3>
              <p className="text-xs text-slate-500">রিপোর্টের প্রতিটি সংখ্যা কোন উৎস ডেটা ও সূত্রের মাধ্যমে তৈরি হয়েছে তার স্বচ্ছ রূপরেখা</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lineageNodes.map((trace: any) => (
                <div key={trace.metric.metricKey} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <span className="font-mono text-[11px] font-bold text-emerald-700">{trace.metric.metricKey}</span>
                      <h4 className="text-xs font-bold text-slate-900">{trace.metric.nameBn}</h4>
                    </div>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                      {trace.metric.category}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div>
                      <span className="font-semibold text-slate-500">অনুমোদিত মূল উৎস:</span>{" "}
                      <span className="font-mono font-bold text-emerald-800">{trace.metric.authoritativeEntity}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">ফিল্ডসমূহ:</span>{" "}
                      <span className="font-mono text-[11px] text-slate-600">{trace.metric.sourceFields.join(", ")}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">গণনার সূত্র:</span>{" "}
                      <span className="font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded text-slate-800">{trace.metric.formulaBn}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">লিনিয়েজ প্রবাহ:</span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono text-[10px] text-slate-600">
                        {trace.metric.lineagePath.map((node: string, idx: number) => (
                          <React.Fragment key={idx}>
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{node}</span>
                            {idx < trace.metric.lineagePath.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">লাইভ ডেটাবেজ মান:</span>
                    <span className="text-sm font-bold font-mono text-emerald-800">
                      {typeof trace.calculatedValue === "number" ? `৳${trace.calculatedValue.toLocaleString()}` : trace.calculatedValue}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: IMPORT VALIDATOR */}
        {activeTab === "IMPORT" && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">শিক্ষার্থী ব্যাচ ইমপোর্ট ভ্যালিডেটর</h3>
              <p className="text-xs text-slate-500">
                ইমপোর্টের পূর্বে ফিল্ড ফরম্যাট, ফোন নম্বর, জন্ম নিবন্ধন ডুপ্লিকেট ও জামাত কোড যাচাই
              </p>

              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='[{"fullNameBn": "মুহাম্মদ আব্দুর রহমান", "dateOfBirth": "2015-05-10", "gender": "MALE", "fatherPhone": "01812345678", "classCode": "NAHBEMEER", "presentAddress": "ইলিয়টগঞ্জ"}]'
                rows={6}
                className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={handleValidateImport}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                >
                  প্রিভিউ ও যাচাই করুন
                </button>
                {importValidation && importValidation.isValid && (
                  <button
                    onClick={handleCommitImport}
                    disabled={importing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                  >
                    {importing ? "ইমপোর্ট কমিট চলছে..." : "নিরাপদ ট্রানজেকশনে কমিট করুন"}
                  </button>
                )}
              </div>
            </div>

            {/* Import Validation Report */}
            {importValidation && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="text-xs font-bold text-slate-900">ভ্যালিডেশন ফলাফল</h4>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    importValidation.isValid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {importValidation.isValid ? "সবকিছু সঠিক — কমিট যোগ্য" : `${importValidation.errors.length} টি ত্রুটি পাওয়া গেছে`}
                  </span>
                </div>

                {!importValidation.isValid && (
                  <div className="space-y-2">
                    {importValidation.errors.map((err: any, idx: number) => (
                      <div key={idx} className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-rose-900">সারি #{err.rowNumber} ({err.field}):</span>{" "}
                          <span className="text-rose-800">{err.errorBn}</span>
                          <span className="text-slate-500 block text-[11px] mt-0.5">পরামর্শ: {err.suggestedCorrectionBn}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: CORRECTION REQUESTS */}
        {activeTab === "CORRECTIONS" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">অভিভাবক প্রোফাইল সংশোধন আবেদন তালিকা ({corrections.length} টি)</h3>
                  <p className="text-xs text-slate-500">অভিভাবকের অনুরোধ সরাসরি মাস্টার ডেটাবেজে প্রযোজ্য হয় না; অ্যাডমিন পর্যালোচনার পর কার্যকর হয়</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {corrections.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">কোনো তথ্য সংশোধনের আবেদন অপেক্ষমাণ নেই।</div>
                ) : (
                  corrections.map((req) => (
                    <div key={req.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{req.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.status === "SUBMITTED" ? "bg-amber-100 text-amber-800" :
                            req.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {req.status}
                          </span>
                          <span className="text-slate-500 text-[11px]">শিক্ষার্থী আইডি: {req.studentIdNumber}</span>
                        </div>
                        <h4 className="font-bold text-slate-900">অভিভাবক: {req.guardianNameBn}</h4>
                        <p className="text-slate-600">কারণ: {req.reasonBn}</p>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1">
                          <span className="font-bold text-slate-700 block text-[11px]">অনুরোধকৃত পরিবর্তনসমূহ:</span>
                          <pre className="font-mono text-[10px] text-slate-600">
                            {JSON.stringify(req.requestedFields, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {req.status === "SUBMITTED" && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleReviewCorrection(req.id, "REJECTED")}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-medium transition"
                          >
                            প্রত্যাখ্যান
                          </button>
                          <button
                            onClick={() => handleReviewCorrection(req.id, "APPROVED")}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-sm"
                          >
                            অনুমোদন ও ডেটাবেজে প্রয়োগ
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
