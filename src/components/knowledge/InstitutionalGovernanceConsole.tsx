"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  Eye,
  Send,
  ShieldAlert,
  Archive,
  Layers,
  Sparkles,
  HelpCircle,
  ThumbsUp,
  Tag,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  History,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck,
  GitCompare,
  Search,
  Filter,
} from "lucide-react";
import {
  KnowledgeDocument,
  GovernanceDashboardStats,
  PolicyConflict,
  PolicyException,
  PolicyAuditEntry,
  PolicyApprovalRecord,
  PolicyAcknowledgement,
} from "@/lib/policies/types";

export default function InstitutionalGovernanceConsole() {
  const [activeTab, setActiveTab] = useState<
    "DOCUMENTS" | "REVIEWS" | "ACKS" | "CONFLICTS" | "SYNC_AUDIT"
  >("DOCUMENTS");

  const [stats, setStats] = useState<GovernanceDashboardStats | null>(null);
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [conflicts, setConflicts] = useState<PolicyConflict[]>([]);
  const [exceptions, setExceptions] = useState<PolicyException[]>([]);
  const [acks, setAcks] = useState<PolicyAcknowledgement[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);

  // Form states
  const [newDocForm, setNewDocForm] = useState({
    titleBn: "",
    titleEn: "",
    category: "INSTITUTIONAL_POLICY",
    documentType: "POLICY",
    ownerDepartment: "ADMINISTRATION",
    confidentiality: "INTERNAL",
    description: "",
    contentMarkdown: "",
    requiresAcknowledgement: false,
  });

  const [versionForm, setVersionForm] = useState({
    isMajor: false,
    versionNotes: "",
    newContent: "",
  });

  const [approvalForm, setApprovalForm] = useState({
    decision: "APPROVED" as "APPROVED" | "REVISION_REQUIRED" | "REJECTED",
    notes: "",
  });

  const [holdForm, setHoldForm] = useState({
    reason: "বোর্ড অব ট্রাস্টিজ ও আইনি পরামর্শকের স্থগিতাদেশ",
  });

  const [exceptionForm, setExceptionForm] = useState({
    subject: "",
    reason: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    scope: "বিশেষ বিবেচনা",
    conditions: "নজরদারির সাথে অনুমোদিত",
  });

  // Diff comparison modal state
  const [diffData, setDiffData] = useState<any>(null);
  const [showDiffModal, setShowDiffModal] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, docsRes, confRes, excRes, acksRes] = await Promise.all([
        fetch("/api/governance/stats"),
        fetch("/api/governance/documents"),
        fetch("/api/governance/conflicts"),
        fetch("/api/governance/exceptions"),
        fetch("/api/governance/acknowledgements"),
      ]);

      const [sData, dData, cData, eData, aData] = await Promise.all([
        statsRes.json(),
        docsRes.json(),
        confRes.json(),
        excRes.json(),
        acksRes.json(),
      ]);

      if (sData.stats) setStats(sData.stats);
      if (dData.documents) setDocs(dData.documents);
      if (cData.conflicts) setConflicts(cData.conflicts);
      if (eData.exceptions) setExceptions(eData.exceptions);
      if (aData.acknowledgements) setAcks(aData.acknowledgements);
    } catch (err) {
      console.error("Failed to load governance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Actions
  const handleCreateDocument = async () => {
    try {
      const res = await fetch("/api/governance/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDocForm),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || "খসড়া তৈরি হয়েছে।");
        setShowCreateModal(false);
        setNewDocForm({
          titleBn: "",
          titleEn: "",
          category: "INSTITUTIONAL_POLICY",
          documentType: "POLICY",
          ownerDepartment: "ADMINISTRATION",
          confidentiality: "INTERNAL",
          description: "",
          contentMarkdown: "",
          requiresAcknowledgement: false,
        });
        await loadAllData();
      } else {
        alert(data.error || "ব্যর্থ হয়েছে");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleStatusTransition = async (docId: string, action: string, notes?: string) => {
    try {
      const res = await fetch(`/api/governance/documents/${docId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message);
        await loadAllData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedDoc) return;
    try {
      const res = await fetch(`/api/governance/documents/${selectedDoc.id}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isMajor: versionForm.isMajor,
          versionNotes: versionForm.versionNotes,
          newContentMarkdown: versionForm.newContent || selectedDoc.contentMarkdown,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message);
        setShowVersionModal(false);
        await loadAllData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleProcessApproval = async () => {
    if (!selectedDoc) return;
    try {
      const res = await fetch(`/api/governance/documents/${selectedDoc.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approvalForm),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message);
        setShowApprovalModal(false);
        await loadAllData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleHold = async () => {
    if (!selectedDoc) return;
    const newHoldStatus = !selectedDoc.isLegalHoldActive;
    try {
      const res = await fetch(`/api/governance/documents/${selectedDoc.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_HOLD",
          isHoldActive: newHoldStatus,
          reason: holdForm.reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message);
        setShowHoldModal(false);
        await loadAllData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateException = async () => {
    if (!selectedDoc) return;
    try {
      const res = await fetch("/api/governance/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDoc.id,
          ...exceptionForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message);
        setShowExceptionModal(false);
        await loadAllData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSyncToPhase22RAG = async () => {
    try {
      const res = await fetch("/api/governance/sync-rag", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message);
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Filtered documents list
  const filteredDocs = docs.filter((d) => {
    if (categoryFilter !== "ALL" && d.category !== categoryFilter) return false;
    if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.titleBn.toLowerCase().includes(q) ||
        d.documentCode.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const underReviewDocs = docs.filter((d) => d.status === "UNDER_REVIEW");

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-emerald-900 text-white rounded-2xl shadow-2xl border border-emerald-700 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          {toastMsg}
        </div>
      )}

      {/* Top Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Phase 38 • সুশাসন ও নলেজ ইঞ্জিন
            </span>
            <span className="text-xs text-stone-400 font-mono">EHRJ-AI-2026-PHASE38</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">
            প্রাতিষ্ঠানিক পলিসি, এসওপি, হ্যান্ডবুক ও গভর্ন্যান্স কন্ট্রোল ককপিট
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 font-light leading-relaxed">
            একক প্রামাণ্য নীতিমালা, কঠোর সংস্করণ নিয়ন্ত্রণ, প্রিন্সিপাল অনুমোদন ও ফেজ ২২ আরএজি সমন্বিত কর্তৃত্ব ব্যবস্থাপনা।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow"
          >
            <Plus className="w-4 h-4" /> নতুন নীতিমালা খসড়া
          </button>
          <button
            onClick={handleSyncToPhase22RAG}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow"
          >
            <RefreshCw className="w-4 h-4" /> ফেজ ২২ RAG সিঙ্ক
          </button>
        </div>
      </div>

      {/* Stats Overview Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-1">
            <span className="text-xs font-medium text-stone-500 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" /> মোট নথি
            </span>
            <div className="text-2xl font-bold text-stone-900">{stats.totalDocuments}</div>
            <span className="text-[10px] text-stone-400">সকল সংরক্ষিত রেকর্ড</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-1">
            <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> কার্যকর (Active)
            </span>
            <div className="text-2xl font-bold text-emerald-900">{stats.effectiveDocuments}</div>
            <span className="text-[10px] text-emerald-600">বর্তমানে কার্যকর</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-1">
            <span className="text-xs font-medium text-amber-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> পর্যালোচনায়
            </span>
            <div className="text-2xl font-bold text-amber-900">{stats.underReviewDocuments}</div>
            <span className="text-[10px] text-amber-600">অনুমোদন অপেক্ষমাণ</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-1">
            <span className="text-xs font-medium text-rose-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> মেয়াদোত্তীর্ণ রিভিউ
            </span>
            <div className="text-2xl font-bold text-rose-900">{stats.reviewOverdueCount}</div>
            <span className="text-[10px] text-rose-600">রিভিউ প্রয়োজন</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-1">
            <span className="text-xs font-medium text-teal-700 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-600" /> মোট স্বীকৃতি
            </span>
            <div className="text-2xl font-bold text-teal-900">{stats.totalAcknowledgementsRecorded}</div>
            <span className="text-[10px] text-teal-600">স্টাফ/শিক্ষক স্বাক্ষর</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-1">
            <span className="text-xs font-medium text-purple-700 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> লিগ্যাল হোল্ড
            </span>
            <div className="text-2xl font-bold text-purple-900">{stats.legalHoldsCount}</div>
            <span className="text-[10px] text-purple-600">স্থগিতাদেশ বহাল</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-stone-200 p-1.5 flex flex-wrap gap-1 shadow-sm text-xs font-semibold">
        {[
          { id: "DOCUMENTS", label: "নথিপত্র ও মাস্টার পলিসি", icon: BookOpen },
          { id: "REVIEWS", label: `অনুমোদন কিউ (${underReviewDocs.length})`, icon: Clock },
          { id: "ACKS", label: "স্বীকৃতি ও কমপ্লায়েন্স", icon: FileCheck },
          { id: "CONFLICTS", label: `দ্বন্দ্ব স্ক্যানার (${conflicts.filter((c) => c.status === "OPEN").length})`, icon: AlertTriangle },
          { id: "SYNC_AUDIT", label: "RAG সমন্বয় ও অডিট লগ", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
                isActive
                  ? "bg-emerald-900 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DOCUMENTS MASTER */}
      {activeTab === "DOCUMENTS" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="কোড বা শিরোনাম দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none"
              >
                <option value="ALL">সকল ক্যাটাগরি</option>
                <option value="ADMISSION_POLICY">ভর্তি নীতিমালা</option>
                <option value="SOP">এসওপি (SOP)</option>
                <option value="HANDBOOK">হ্যান্ডবুক</option>
                <option value="SECURITY_POLICY">সিকিউরিটি ও আইটি</option>
                <option value="TEACHER_GUIDELINE">শিক্ষক গাইডলাইন</option>
                <option value="FINANCE_POLICY">অর্থনীতি ও যাকাত</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none"
              >
                <option value="ALL">সকল স্ট্যাটাস</option>
                <option value="EFFECTIVE">EFFECTIVE (কার্যকর)</option>
                <option value="DRAFT">DRAFT (খসড়া)</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW (পর্যালোচনায়)</option>
                <option value="APPROVED">APPROVED (অনুমোদিত)</option>
                <option value="SUPERSEDED">SUPERSEDED (স্থলাভিষিক্ত)</option>
              </select>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
                  <th className="p-4">ডকুমেন্ট ও কোড</th>
                  <th className="p-4">ক্যাটাগরি ও বিভাগ</th>
                  <th className="p-4">সংস্করণ ও স্ট্যাটাস</th>
                  <th className="p-4">কার্যকর ও রিভিউ ডেট</th>
                  <th className="p-4">গোপনীয়তা</th>
                  <th className="p-4 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-stone-50/50 transition">
                    <td className="p-4 space-y-1 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-stone-800 px-2 py-0.5 bg-stone-100 rounded text-[11px]">
                          {doc.documentCode}
                        </span>
                        {doc.isLegalHoldActive && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px] flex items-center gap-0.5">
                            <Lock className="w-3 h-3" /> হোল্ড
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-stone-900 line-clamp-1">{doc.titleBn}</div>
                      <div className="text-[10px] text-stone-500 line-clamp-1">{doc.titleEn}</div>
                    </td>

                    <td className="p-4 space-y-0.5">
                      <span className="font-medium text-emerald-800">{doc.category}</span>
                      <span className="block text-[10px] text-stone-500">{doc.ownerDepartment}</span>
                    </td>

                    <td className="p-4 space-y-1">
                      <span className="font-mono font-bold text-stone-900">{doc.currentVersion}</span>
                      <span
                        className={`block w-fit px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.status === "EFFECTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : doc.status === "UNDER_REVIEW"
                            ? "bg-amber-100 text-amber-800"
                            : doc.status === "DRAFT"
                            ? "bg-stone-200 text-stone-700"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>

                    <td className="p-4 space-y-0.5 text-stone-600">
                      <div>কার্যকর: {doc.effectiveFrom || "N/A"}</div>
                      <div className="text-[10px] text-stone-400">রিভিউ: {doc.reviewDate}</div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          doc.confidentiality === "PUBLIC"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : doc.confidentiality === "INTERNAL"
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {doc.confidentiality}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {doc.status === "DRAFT" && (
                          <button
                            onClick={() =>
                              handleStatusTransition(doc.id, "SUBMIT_FOR_REVIEW", "এডমিন কর্তৃক পর্যালোচনায় পেশ")
                            }
                            title="পর্যালোচনায় জমা দিন"
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {doc.status === "APPROVED" && (
                          <button
                            onClick={() => handleStatusTransition(doc.id, "PUBLISH", "প্রকাশ সম্পন্ন")}
                            title="প্রকাশ করুন"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {doc.status === "PUBLISHED" && (
                          <button
                            onClick={() => handleStatusTransition(doc.id, "MARK_EFFECTIVE", "কার্যকর করা হলো")}
                            title="কার্যকর ঘোষণা করুন"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedDoc(doc);
                            setVersionForm({
                              isMajor: false,
                              versionNotes: "",
                              newContent: doc.contentMarkdown,
                            });
                            setShowVersionModal(true);
                          }}
                          title="নতুন সংস্করণ খসড়া তৈরি করুন"
                          className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedDoc(doc);
                            setShowHoldModal(true);
                          }}
                          title="লিগ্যাল হোল্ড টগল"
                          className={`p-1.5 rounded-lg transition ${
                            doc.isLegalHoldActive
                              ? "bg-purple-600 text-white"
                              : "bg-stone-100 text-stone-700 hover:bg-purple-100"
                          }`}
                        >
                          {doc.isLegalHoldActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REVIEW & APPROVAL QUEUE */}
      {activeTab === "REVIEWS" && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold">প্রিন্সিপাল ও প্রশাসনিক অনুমোদন কিউ: </span>
              এখানে জমাকৃত সকল খসড়া নীতিমালা পরীক্ষা করে অনুমোদন (Approve), সংশোধন নির্দেশ (Revision Required), অথবা
              বাতিল (Reject) করা যায়।
            </div>
          </div>

          {underReviewDocs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 text-stone-500">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-stone-800 text-sm">কোনো পর্যালোচনার আবেদন অমীমাংসিত নেই</h3>
              <p className="text-xs text-stone-400">সকল জমাকৃত খসড়া যাচাই সম্পন্ন হয়েছে।</p>
            </div>
          ) : (
            <div className="space-y-4">
              {underReviewDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-800 px-2 py-0.5 bg-stone-100 rounded text-xs">
                          {doc.documentCode}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                          ভার্সন {doc.currentVersion} • পর্যালোচনায়
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mt-1">{doc.titleBn}</h3>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDoc(doc);
                        setShowApprovalModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow self-start sm:self-auto"
                    >
                      <CheckCircle2 className="w-4 h-4" /> পর্যালোচনা ও সিদ্ধান্ত
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">{doc.description}</p>

                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs font-serif leading-relaxed line-clamp-4">
                    {doc.contentMarkdown || doc.contentText}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACKNOWLEDGEMENTS & COMPLIANCE */}
      {activeTab === "ACKS" && (
        <div className="space-y-4">
          <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-teal-700 shrink-0" />
              <div>
                <span className="font-bold">ডিজিটাল স্বীকৃতি ও কমপ্লায়েন্স হিসাব: </span>
                অত্র প্রতিষ্ঠানে মোট {acks.length}টি ব্যক্তিগত সম্মতি ও স্বীকৃতি সফলভাবে সংরক্ষিত হয়েছে।
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
                  <th className="p-4">স্বীকৃতি আইডি</th>
                  <th className="p-4">নীতিমালা ও ভার্সন</th>
                  <th className="p-4">স্বীকৃতি প্রদানকারী</th>
                  <th className="p-4">পদ/ভূমিকা</th>
                  <th className="p-4">তারিখ ও সময়</th>
                  <th className="p-4 text-right">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {acks.map((ack) => (
                  <tr key={ack.id} className="hover:bg-stone-50/50">
                    <td className="p-4 font-mono font-bold text-stone-700">{ack.id}</td>
                    <td className="p-4 font-medium text-stone-900">
                      {ack.documentCode} ({ack.version})
                    </td>
                    <td className="p-4 font-bold text-emerald-900">{ack.userName}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-stone-100 rounded text-stone-600 font-semibold text-[11px]">
                        {ack.userRole}
                      </span>
                    </td>
                    <td className="p-4 text-stone-500">{new Date(ack.acknowledgedAt).toLocaleString("bn-BD")}</td>
                    <td className="p-4 text-right">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> গৃহীত
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CONFLICTS & EXCEPTIONS */}
      {activeTab === "CONFLICTS" && (
        <div className="space-y-6">
          {/* Conflicts Scanner */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                শনাক্তকৃত নীতিমালা অসঙ্গতি ও দ্বন্দ্ব ({conflicts.length})
              </h3>
              <button
                onClick={async () => {
                  const res = await fetch("/api/governance/conflicts");
                  const d = await res.json();
                  if (d.conflicts) {
                    setConflicts(d.conflicts);
                    triggerToast("দ্বন্দ্ব স্ক্যানার সফলভাবে সম্পন্ন হয়েছে।");
                  }
                }}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> পুনরায় স্ক্যান করুন
              </button>
            </div>

            {conflicts.length === 0 ? (
              <div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-center text-xs text-emerald-800 font-medium">
                কোনো দ্বৈত নীতিমালা বা সাংঘর্ষিক মেয়াদের অসঙ্গতি পাওয়া যায়নি।
              </div>
            ) : (
              <div className="space-y-3">
                {conflicts.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold font-mono text-[10px]">
                          {c.severity} • {c.conflictType}
                        </span>
                        <span className="font-semibold text-stone-800">
                          {c.documentCodeA} বনাম {c.documentCodeB}
                        </span>
                      </div>
                      <p className="text-stone-600 leading-relaxed">{c.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.status === "OPEN" ? (
                        <button
                          onClick={async () => {
                            const res = await fetch("/api/governance/conflicts", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ conflictId: c.id, resolution: "RESOLVED" }),
                            });
                            const d = await res.json();
                            if (d.success) {
                              triggerToast("দ্বন্দ্ব সমাধান হিসেবে চিহ্নিত করা হয়েছে।");
                              await loadAllData();
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg font-bold"
                        >
                          সমাধান করুন
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full font-semibold text-[11px]">
                          {c.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exceptions Management */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                অনুমোদিত প্রাতিষ্ঠানিক ব্যতিক্রমসমূহ ({exceptions.length})
              </h3>
              <button
                onClick={() => {
                  if (docs.length > 0) setSelectedDoc(docs[0]);
                  setShowExceptionModal(true);
                }}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" /> নতুন ব্যতিক্রম অনুমোদন
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
                    <th className="p-4">ব্যতিক্রম আইডি</th>
                    <th className="p-4">নীতিমালা</th>
                    <th className="p-4">বিষয় ও কারণ</th>
                    <th className="p-4">অনুমোদনকারী</th>
                    <th className="p-4">মেয়াদ</th>
                    <th className="p-4 text-right">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {exceptions.map((exc) => (
                    <tr key={exc.id} className="hover:bg-stone-50/50">
                      <td className="p-4 font-mono font-bold text-stone-800">{exc.id}</td>
                      <td className="p-4 font-mono font-medium text-emerald-800">{exc.documentCode}</td>
                      <td className="p-4 max-w-xs space-y-0.5">
                        <div className="font-bold text-stone-900">{exc.subject}</div>
                        <div className="text-[10px] text-stone-500 line-clamp-1">{exc.reason}</div>
                      </td>
                      <td className="p-4 font-medium text-stone-700">{exc.approvedBy}</td>
                      <td className="p-4 text-stone-500">
                        {exc.startDate} থেকে {exc.endDate}
                      </td>
                      <td className="p-4 text-right">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                          {exc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SYNC & AUDIT LOG */}
      {activeTab === "SYNC_AUDIT" && (
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-base">ফেজ ২২ নলেজ রিট্রিভাল ও আরএজি (RAG) সমন্বয়</h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl">
                ফেজ ৩৮ হলো নথির কর্তৃত্ব ও নীতিমালার মালিক। যখন কোনো নীতিমালা APPROVED বা EFFECTIVE হয়, তা স্বয়ংক্রিয়ভাবে
                ফেজ ২২ নলেজ ইনডেক্সে সিঙ্ক হয়ে এআই সার্চে কার্যকর হয়।
              </p>
            </div>
            <button
              onClick={handleSyncToPhase22RAG}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs rounded-xl transition shadow"
            >
              এখনই RAG সিঙ্ক সম্পন্ন করুন
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <History className="w-4 h-4 text-stone-600" /> অপরিবর্তনীয় অডিট ট্রেইল (Immutable Governance Audit Log)
            </h3>
            <p className="text-xs text-stone-500">
              সকল নীতিমালার খসড়া তৈরি, সংস্করণ হালনাগাদ, প্রিন্সিপাল অনুমোদন, ব্যতিক্রম এবং লিগ্যাল হোল্ডের টাইমস্ট্যাম্পযুক্ত
              প্রমাণ।
            </p>
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 font-mono text-[11px] text-stone-700 max-h-60 overflow-y-auto space-y-1">
              <div>[2026-09-29T12:00:00Z] AUD-INIT-001 | EHRJ-POL-2026-ADM001 (v2.1) | MARK_EFFECTIVE | Actor: admin-01</div>
              <div>[2026-09-29T12:05:00Z] AUD-DEC-001 | EHRJ-POL-2026-ADM001 (v2.1) | APPROVED | Actor: principal-01</div>
              <div>[2026-09-29T12:10:00Z] AUD-ACK-001 | EHRJ-POL-2026-TCH001 (v1.1) | ACKNOWLEDGE | Actor: teacher-hafiz-01</div>
              <div>[2026-09-29T12:15:00Z] AUD-EXC-001 | EHRJ-POL-2026-ADM001 (v2.1) | GRANT_EXCEPTION | Actor: principal-01</div>
              <div>[2026-09-29T12:30:00Z] AUD-SYNC-P22 | SYSTEM-RAG-SYNC | SYNC_TO_RAG | Synced 7 authoritative policies</div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE DRAFT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
            <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">নতুন প্রাতিষ্ঠানিক নীতিমালা / এসওপি খসড়া তৈরি</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">শিরোনাম (বাংলা)*</label>
                  <input
                    type="text"
                    value={newDocForm.titleBn}
                    onChange={(e) => setNewDocForm({ ...newDocForm, titleBn: e.target.value })}
                    placeholder="যেমন: কওমি কিতাব বিভাগ পাঠ্যসূচি নীতিমালা"
                    className="w-full p-2.5 bg-stone-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-bold mb-1">শিরোনাম (ইংরেজি)</label>
                  <input
                    type="text"
                    value={newDocForm.titleEn}
                    onChange={(e) => setNewDocForm({ ...newDocForm, titleEn: e.target.value })}
                    placeholder="e.g. Kitab Section Curriculum Policy"
                    className="w-full p-2.5 bg-stone-50 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">ডকুমেন্ট টাইপ*</label>
                  <select
                    value={newDocForm.documentType}
                    onChange={(e) => setNewDocForm({ ...newDocForm, documentType: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border rounded-xl"
                  >
                    <option value="POLICY">POLICY (নীতিমালা)</option>
                    <option value="SOP">SOP (কার্যপদ্ধতি)</option>
                    <option value="HANDBOOK">HANDBOOK (হ্যান্ডবুক)</option>
                    <option value="GUIDELINE">GUIDELINE (নির্দেশিকা)</option>
                    <option value="FAQ">FAQ (সাধারণ প্রশ্নোত্তর)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 font-bold mb-1">ক্যাটাগরি*</label>
                  <select
                    value={newDocForm.category}
                    onChange={(e) => setNewDocForm({ ...newDocForm, category: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border rounded-xl"
                  >
                    <option value="INSTITUTIONAL_POLICY">প্রাতিষ্ঠানিক পলিসি</option>
                    <option value="ACADEMIC_POLICY">একাডেমিক পলিসি</option>
                    <option value="ADMISSION_POLICY">ভর্তি পলিসি</option>
                    <option value="SOP">এসওপি (SOP)</option>
                    <option value="HANDBOOK">হ্যান্ডবুক</option>
                    <option value="SECURITY_POLICY">নিরাপত্তা ও আইটি</option>
                    <option value="FINANCE_POLICY">অর্থ ও যাকাত ফান্ড</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 font-bold mb-1">মালিকানা বিভাগ</label>
                  <select
                    value={newDocForm.ownerDepartment}
                    onChange={(e) => setNewDocForm({ ...newDocForm, ownerDepartment: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border rounded-xl"
                  >
                    <option value="ADMINISTRATION">ADMINISTRATION</option>
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="RESIDENTIAL">RESIDENTIAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">সংক্ষিপ্ত বিবরণ</label>
                <textarea
                  rows={2}
                  value={newDocForm.description}
                  onChange={(e) => setNewDocForm({ ...newDocForm, description: e.target.value })}
                  placeholder="নীতিমালার উদ্দেশ্য ও সারসংক্ষেপ..."
                  className="w-full p-2.5 bg-stone-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">মূল বিষয়বস্তু ও ধারা (Markdown Text)</label>
                <textarea
                  rows={5}
                  value={newDocForm.contentMarkdown}
                  onChange={(e) => setNewDocForm({ ...newDocForm, contentMarkdown: e.target.value })}
                  placeholder="# শিরোনাম&#10;## ১. শর্তাবলী&#10;বিস্তারিত বর্ণনা..."
                  className="w-full p-2.5 bg-stone-50 border rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="requiresAck"
                  checked={newDocForm.requiresAcknowledgement}
                  onChange={(e) => setNewDocForm({ ...newDocForm, requiresAcknowledgement: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-800"
                />
                <label htmlFor="requiresAck" className="font-semibold text-stone-800 cursor-pointer">
                  স্টাফ/শিক্ষকদের জন্য ডিজিটাল স্বীকৃতি (Acknowledgement) আবশ্যক
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-stone-200 rounded-xl font-medium"
              >
                বাতিল
              </button>
              <button
                onClick={handleCreateDocument}
                disabled={!newDocForm.titleBn}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold transition disabled:opacity-50"
              >
                খসড়া সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW VERSION MODAL */}
      {showVersionModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-amber-300">
                  {selectedDoc.documentCode} (বর্তমান: {selectedDoc.currentVersion})
                </span>
                <h3 className="font-bold text-sm sm:text-base">নতুন সংস্করণ (Revision) খসড়া তৈরি</h3>
              </div>
              <button onClick={() => setShowVersionModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <span className="font-bold">নীতিমালা অমরত্ব নীতি: </span>
                পূর্ববর্তী কার্যকর সংস্করণ অক্ষত থাকবে। নতুন সংস্করণ DRAFT হিসেবে তৈরি হবে এবং অনুমোদনের পর কার্যকর হবে।
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="versionType"
                    checked={!versionForm.isMajor}
                    onChange={() => setVersionForm({ ...versionForm, isMajor: false })}
                    className="text-emerald-800"
                  />
                  <span className="font-bold text-stone-800">
                    মাইনর রিভিশন (Minor: {selectedDoc.currentVersion} → v
                    {parseFloat(selectedDoc.currentVersion.replace("v", "")) + 0.1})
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="versionType"
                    checked={versionForm.isMajor}
                    onChange={() => setVersionForm({ ...versionForm, isMajor: true })}
                    className="text-emerald-800"
                  />
                  <span className="font-bold text-stone-800">
                    মেজর ওভারহল (Major: {selectedDoc.currentVersion} → v
                    {Math.floor(parseFloat(selectedDoc.currentVersion.replace("v", ""))) + 1}.0)
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">সংশোধনীর কারণ ও বিবরণ*</label>
                <textarea
                  rows={2}
                  value={versionForm.versionNotes}
                  onChange={(e) => setVersionForm({ ...versionForm, versionNotes: e.target.value })}
                  placeholder="যেমন: ভর্তি কোটায় নতুন মারহালা সংযোজন..."
                  className="w-full p-2.5 bg-stone-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">হালনাগাদকৃত পাঠ্য</label>
                <textarea
                  rows={6}
                  value={versionForm.newContent}
                  onChange={(e) => setVersionForm({ ...versionForm, newContent: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border rounded-xl font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowVersionModal(false)}
                className="px-4 py-2 bg-stone-200 rounded-xl font-medium"
              >
                বাতিল
              </button>
              <button
                onClick={handleCreateVersion}
                disabled={!versionForm.versionNotes}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold transition disabled:opacity-50"
              >
                নতুন সংস্করণ ড্রাফট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL DECISION MODAL */}
      {showApprovalModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-amber-300">
                  {selectedDoc.documentCode} • {selectedDoc.currentVersion}
                </span>
                <h3 className="font-bold text-sm sm:text-base">প্রশাসনিক অনুমোদন ও পর্যালোচনা সিদ্ধান্ত</h3>
              </div>
              <button onClick={() => setShowApprovalModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-stone-600 font-bold mb-2">সিদ্ধান্ত নির্বাচন করুন*</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "APPROVED", label: "অনুমোদন (Approve)", color: "emerald" },
                    { id: "REVISION_REQUIRED", label: "সংশোধন (Revise)", color: "amber" },
                    { id: "REJECTED", label: "বাতিল (Reject)", color: "rose" },
                  ].map((dec) => (
                    <button
                      key={dec.id}
                      type="button"
                      onClick={() => setApprovalForm({ ...approvalForm, decision: dec.id as any })}
                      className={`p-3 rounded-xl border text-center font-bold transition ${
                        approvalForm.decision === dec.id
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 bg-stone-50 text-stone-700"
                      }`}
                    >
                      {dec.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">মন্তব্য বা দিকনির্দেশনা*</label>
                <textarea
                  rows={3}
                  value={approvalForm.notes}
                  onChange={(e) => setApprovalForm({ ...approvalForm, notes: e.target.value })}
                  placeholder="প্রিন্সিপাল বা এডমিন মন্তব্য..."
                  className="w-full p-2.5 bg-stone-50 border rounded-xl"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 bg-stone-200 rounded-xl font-medium"
              >
                বাতিল
              </button>
              <button
                onClick={handleProcessApproval}
                disabled={!approvalForm.notes}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold transition disabled:opacity-50"
              >
                সিদ্ধান্ত কার্যকর করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEGAL HOLD MODAL */}
      {showHoldModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
            <div className="px-6 py-4 bg-purple-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                লিগ্যাল হোল্ড {selectedDoc.isLegalHoldActive ? "উত্তোলন" : "সক্রিয়করণ"}
              </h3>
              <button onClick={() => setShowHoldModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-stone-600">
                ডকুমেন্ট: <span className="font-bold">{selectedDoc.documentCode}</span> ({selectedDoc.titleBn})
              </p>
              <div>
                <label className="block text-stone-600 font-bold mb-1">কারণ বা স্থগিতাদেশের রেফারেন্স</label>
                <textarea
                  rows={2}
                  value={holdForm.reason}
                  onChange={(e) => setHoldForm({ reason: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-xl"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t flex justify-end gap-2 text-xs">
              <button onClick={() => setShowHoldModal(false)} className="px-4 py-2 bg-stone-200 rounded-xl">
                বাতিল
              </button>
              <button
                onClick={handleToggleHold}
                className="px-5 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-xl font-bold transition"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEPTION MODAL */}
      {showExceptionModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
            <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">নীতিমালা বিশেষ ব্যতিক্রম অনুমোদন (Policy Exception)</h3>
              <button onClick={() => setShowExceptionModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-bold mb-1">সংশ্লিষ্ট নীতিমালা</label>
                <select
                  value={selectedDoc.id}
                  onChange={(e) => {
                    const found = docs.find((d) => d.id === e.target.value);
                    if (found) setSelectedDoc(found);
                  }}
                  className="w-full p-2 bg-stone-50 border rounded-xl"
                >
                  {docs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.documentCode} - {d.titleBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">ব্যতিক্রমের বিষয়বস্তু*</label>
                <input
                  type="text"
                  value={exceptionForm.subject}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, subject: e.target.value })}
                  placeholder="যেমন: লিল্লাহ বোডিং ভর্তিতে বিশেষ শিথিলতা"
                  className="w-full p-2 bg-stone-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">অনুমোদনের কারণ*</label>
                <textarea
                  rows={2}
                  value={exceptionForm.reason}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, reason: e.target.value })}
                  placeholder="সুনির্দিষ্ট যৌক্তিক কারণ..."
                  className="w-full p-2 bg-stone-50 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">শুরুর তারিখ</label>
                  <input
                    type="date"
                    value={exceptionForm.startDate}
                    onChange={(e) => setExceptionForm({ ...exceptionForm, startDate: e.target.value })}
                    className="w-full p-2 bg-stone-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-bold mb-1">সমাপ্তির তারিখ</label>
                  <input
                    type="date"
                    value={exceptionForm.endDate}
                    onChange={(e) => setExceptionForm({ ...exceptionForm, endDate: e.target.value })}
                    className="w-full p-2 bg-stone-50 border rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t flex justify-end gap-2 text-xs">
              <button onClick={() => setShowExceptionModal(false)} className="px-4 py-2 bg-stone-200 rounded-xl">
                বাতিল
              </button>
              <button
                onClick={handleCreateException}
                disabled={!exceptionForm.subject || !exceptionForm.reason}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold transition disabled:opacity-50"
              >
                ব্যতিক্রম সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
