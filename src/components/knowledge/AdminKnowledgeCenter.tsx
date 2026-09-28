"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
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
} from "lucide-react";

interface KnowledgeDoc {
  id: string;
  documentCode: string;
  titleBn: string;
  category: string;
  documentType: string;
  version: string;
  status: string;
  effectiveDate: string;
  securityClassification: string;
  roleScope: string;
  contentText: string;
  tags: string[];
  author: string;
  updatedAt: string;
}

interface KnowledgeStats {
  totalDocs: number;
  publishedDocs: number;
  draftDocs: number;
  reviewDocs: number;
  supersededDocs: number;
  staleDocsCount: number;
  totalSearches: number;
  avgLatencyMs: number;
  openGapsCount: number;
  totalFeedbackCount: number;
}

interface KnowledgeGap {
  id: string;
  query: string;
  searchCount: number;
  detectedCategory: string;
  status: string;
  lastSearchedAt: string;
}

export default function AdminKnowledgeCenter() {
  const [activeTab, setActiveTab] = useState<"DOCUMENTS" | "GAPS" | "RAG_SANDBOX" | "ANALYTICS">("DOCUMENTS");
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // New Document Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDoc, setNewDoc] = useState({
    documentCode: "EHRJ-DOC-",
    titleBn: "",
    titleEn: "",
    category: "ACADEMIC",
    documentType: "POLICY",
    version: "1.0",
    securityClassification: "PUBLIC",
    roleScope: "ALL",
    contentText: "",
    tags: "",
  });

  // RAG Sandbox Testing
  const [ragQuery, setRagQuery] = useState("");
  const [ragResult, setRagResult] = useState<any | null>(null);
  const [ragLoading, setRagLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/knowledge"),
        fetch("/api/admin/knowledge/analytics"),
      ]);

      if (docsRes.ok) {
        const d = await docsRes.json();
        setDocs(d.documents || []);
      }
      if (analyticsRes.ok) {
        const a = await analyticsRes.json();
        setStats(a.stats || null);
        setGaps(a.gaps || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/knowledge/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: `প্রশাসনিক একশন: ${action}` }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg(data.message || "অ্যাকশন সফল হয়েছে।");
        loadData();
      } else {
        alert(data.error || "অ্যাকশন সম্পন্ন করা যায়নি।");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = newDoc.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDoc,
          tags: tagsArray,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMsg("নতুন প্রাতিষ্ঠানিক ডকুমেন্ট সফলভাবে তৈরি হয়েছে।");
        setShowCreateModal(false);
        setNewDoc({
          documentCode: "EHRJ-DOC-",
          titleBn: "",
          titleEn: "",
          category: "ACADEMIC",
          documentType: "POLICY",
          version: "1.0",
          securityClassification: "PUBLIC",
          roleScope: "ALL",
          contentText: "",
          tags: "",
        });
        loadData();
      } else {
        alert(data.error || "ডকুমেন্ট তৈরি করা যায়নি।");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunRAGSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;

    setRagLoading(true);
    setRagResult(null);
    try {
      const res = await fetch("/api/ai/knowledge-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: ragQuery }),
      });
      const data = await res.json();
      setRagResult(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-[#0B1914] text-white p-6 rounded-2xl shadow-lg border border-emerald-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-400/30">
              PHASE 22 ENGINE
            </span>
            <span className="text-xs text-emerald-300">ভেরিফাইড নলেজ ও RAG গ্রাউন্ডিং হাব</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">প্রাতিষ্ঠানিক জ্ঞানভান্ডার ও সার্চ সেন্টার</h1>
          <p className="text-emerald-200 text-sm mt-1">
            উৎস-সংযুক্ত (Source-Grounded) প্রাতিষ্ঠানিক ডকুমেন্টস, ভার্সন ট্র্যাকিং ও অনুমতি-সচেতন অনুসন্ধান ব্যবস্থাপনা।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#C59B27] hover:bg-amber-500 text-emerald-950 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            নতুন নীতিমালা / গাইডলাইন
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-800/60 hover:bg-emerald-800 border border-emerald-700/60 text-white px-3 py-2 rounded-xl text-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex justify-between items-center text-sm font-medium">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span>মোট ডকুমেন্টস</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalDocs || docs.length}</p>
          <span className="text-[10px] text-emerald-600 font-medium">ভার্সনসহ সংরক্ষিত</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span>প্রকাশিত (Active)</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats?.publishedDocs || 0}</p>
          <span className="text-[10px] text-gray-500">অনুমোদিত ও কার্যকর</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-100">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span>পর্যালোচনাধীন</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.reviewDocs || 0}</p>
          <span className="text-[10px] text-amber-600 font-medium">অ্যাডমিন সিদ্ধান্তের অপেক্ষায়</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span>সুপারসিডেড</span>
            <Archive className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-700 mt-1">{stats?.supersededDocs || 0}</p>
          <span className="text-[10px] text-gray-400">ঐতিহাসিক রেকর্ড</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span>নলেজ গ্যাপ</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats?.openGapsCount || gaps.length}</p>
          <span className="text-[10px] text-red-500 font-medium">অনুপস্থিত নীতিমালা</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span>অনুসন্ধান গড় গতি</span>
            <Search className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.avgLatencyMs || 12} ms</p>
          <span className="text-[10px] text-blue-500 font-medium">হাইব্রিড সার্চ স্পীড</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-xl">
        <button
          onClick={() => setActiveTab("DOCUMENTS")}
          className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 ${
            activeTab === "DOCUMENTS"
              ? "border-[#0D5C3A] text-[#0D5C3A]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          ডকুমেন্ট ও নীতিমালা তালিকা ({docs.length})
        </button>

        <button
          onClick={() => setActiveTab("GAPS")}
          className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 ${
            activeTab === "GAPS"
              ? "border-[#0D5C3A] text-[#0D5C3A]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          নলেজ গ্যাপ মনিটর ({gaps.length})
        </button>

        <button
          onClick={() => setActiveTab("RAG_SANDBOX")}
          className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 ${
            activeTab === "RAG_SANDBOX"
              ? "border-[#0D5C3A] text-[#0D5C3A]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          লাইভ RAG ও সাইটেশন স্যান্ডবক্স
        </button>
      </div>

      {/* TAB 1: DOCUMENTS TABLE */}
      {activeTab === "DOCUMENTS" && (
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">কোড ও শিরোনাম</th>
                  <th className="py-3 px-4">ক্যাটেগরি ও ধরন</th>
                  <th className="py-3 px-4">সংস্করণ</th>
                  <th className="py-3 px-4">সিকিউরিটি ও স্কোপ</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">কার্যক্রম (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{doc.titleBn}</div>
                      <div className="text-[11px] text-gray-500">{doc.documentCode}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-sm">
                        {doc.contentText.substring(0, 100)}...
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-800">{doc.category}</span>
                      <span className="block text-[10px] text-gray-500">{doc.documentType}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-700">v{doc.version}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          doc.securityClassification === "PUBLIC"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {doc.securityClassification}
                      </span>
                      <span className="block text-[10px] text-gray-500 mt-0.5">স্কোপ: {doc.roleScope}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          doc.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : doc.status === "SUPERSEDED"
                            ? "bg-gray-100 text-gray-600 line-through"
                            : doc.status === "UNDER_REVIEW"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {doc.status === "DRAFT" && (
                          <button
                            onClick={() => handleAction(doc.id, "UNDER_REVIEW")}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-[10px] font-semibold transition"
                          >
                            রিভিউ পাঠান
                          </button>
                        )}
                        {doc.status === "UNDER_REVIEW" && (
                          <button
                            onClick={() => handleAction(doc.id, "APPROVED")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-semibold transition"
                          >
                            অনুমোদন
                          </button>
                        )}
                        {doc.status === "APPROVED" && (
                          <button
                            onClick={() => handleAction(doc.id, "PUBLISHED")}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px] font-semibold transition"
                          >
                            প্রকাশ করুন
                          </button>
                        )}
                        {doc.status === "PUBLISHED" && (
                          <button
                            onClick={() => handleAction(doc.id, "ARCHIVED")}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-[10px] font-semibold transition"
                          >
                            আর্কাইভ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE GAPS */}
      {activeTab === "GAPS" && (
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">সনাক্তকৃত নলেজ গ্যাপ ও অমীমাংসিত অনুসন্ধান</h3>
            <p className="text-xs text-gray-500">
              যে সকল প্রশ্নের উত্তর বর্তমান অনুমোদিত নীতিমালায় পাওয়া যায়নি এবং ব্যবহারকারীরা বারবার অনুসন্ধান করেছেন।
            </p>
          </div>

          <div className="space-y-3">
            {gaps.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">কোনো অমীমাংসিত নলেজ গ্যাপ নেই।</div>
            ) : (
              gaps.map((g) => (
                <div
                  key={g.id}
                  className="p-4 border border-amber-200 bg-amber-50/50 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Search className="w-4 h-4 text-amber-600" />
                      &quot;{g.query}&quot;
                    </div>
                    <div className="text-xs text-gray-600 mt-1 flex items-center gap-3">
                      <span>ক্যাটেগরি: <strong>{g.detectedCategory}</strong></span>
                      <span>অনুসন্ধানের সংখ্যা: <strong>{g.searchCount} বার</strong></span>
                      <span>সর্বশেষ: {new Date(g.lastSearchedAt).toLocaleDateString("bn-BD")}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setNewDoc({
                        ...newDoc,
                        titleBn: `${g.query} সংক্রান্ত নীতিমালা`,
                        category: g.detectedCategory as any,
                        tags: g.query,
                      });
                      setShowCreateModal(true);
                    }}
                    className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    নীতিমালা তৈরি করুন
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE RAG & CITATIONS SANDBOX */}
      {activeTab === "RAG_SANDBOX" && (
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              লাইভ RAG গ্রাউন্ডিং ও সাইটেশন যাচাই স্যান্ডবক্স
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              ব্যবহারকারীর প্রশ্ন কীভাবে অনুমোদন-সচেতনভাবে অনুমোদিত উৎস হতে উত্তর প্রস্তুত করে এবং উৎস কোড যুক্ত করে তা পর্যবেক্ষণ করুন।
            </p>
          </div>

          <form onSubmit={handleRunRAGSandbox} className="flex gap-2">
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="যেকোনো প্রাতিষ্ঠানিক প্রশ্ন লিখুন (যেমন: ভর্তি ফি কত? অথবা ছুটির নিয়ম কী?)..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              disabled={ragLoading}
              className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              {ragLoading ? "যাচাই হচ্ছে..." : "গ্রাউন্ডেড উত্তর আনুন"}
            </button>
          </form>

          {ragResult && (
            <div className="p-5 border border-emerald-200 bg-emerald-50/40 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      ragResult.isGrounded
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                    }`}
                  >
                    {ragResult.isGrounded ? "ভেরিফাইড ও গ্রাউন্ডেড" : "অনুপস্থিত/আনগ্রাউন্ডেড"}
                  </span>
                  <span className="text-xs text-gray-500">গতি: {ragResult.latencyMs}ms</span>
                </div>
                {ragResult.promptInjectionDetected && (
                  <span className="bg-red-600 text-white text-[11px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    প্রম্পট ইনজেকশন প্রতিরোধকৃত
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">প্রস্তুতকৃত উত্তর:</h4>
                <div className="mt-1 text-sm text-gray-900 bg-white p-4 rounded-xl border border-emerald-100 shadow-sm whitespace-pre-line leading-relaxed">
                  {ragResult.answer}
                </div>
              </div>

              {ragResult.citations && ragResult.citations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    সংযুক্ত নির্ভরযোগ্য প্রাতিষ্ঠানিক সাইটেশন (Citations):
                  </h4>
                  <ul className="mt-1 space-y-1">
                    {ragResult.citations.map((c: string, idx: number) => (
                      <li key={idx} className="text-xs text-emerald-800 font-mono bg-white/80 px-2 py-1 rounded border border-emerald-100">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE DOCUMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">নতুন প্রাতিষ্ঠানিক ডকুমেন্ট / নীতিমালা তৈরি</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">ডকুমেন্ট কোড</label>
                  <input
                    type="text"
                    required
                    value={newDoc.documentCode}
                    onChange={(e) => setNewDoc({ ...newDoc, documentCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">সংস্করণ (Version)</label>
                  <input
                    type="text"
                    required
                    value={newDoc.version}
                    onChange={(e) => setNewDoc({ ...newDoc, version: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">শিরোনাম (বাংলা)</label>
                <input
                  type="text"
                  required
                  value={newDoc.titleBn}
                  onChange={(e) => setNewDoc({ ...newDoc, titleBn: e.target.value })}
                  placeholder="যেমন: শিক্ষার্থী ভর্তি নীতিমালা ২০২৬"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">ক্যাটেগরি</label>
                  <select
                    value={newDoc.category}
                    onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="ADMISSION">ADMISSION</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="EXAMINATION">EXAMINATION</option>
                    <option value="RESIDENTIAL">RESIDENTIAL</option>
                    <option value="LIBRARY">LIBRARY</option>
                    <option value="HR">HR</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">সিকিউরিটি ক্লাসিফিকেশন</label>
                  <select
                    value={newDoc.securityClassification}
                    onChange={(e) => setNewDoc({ ...newDoc, securityClassification: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="PUBLIC">PUBLIC (পাবলিকলি দৃশ্যমান)</option>
                    <option value="INTERNAL">INTERNAL (অভ্যন্তরীণ)</option>
                    <option value="RESTRICTED">RESTRICTED (সীমাবদ্ধ)</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL (গোপনীয়)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">নীতিমালার পূর্ণ বিবরণ ও নিয়মাবলী</label>
                <textarea
                  required
                  rows={6}
                  value={newDoc.contentText}
                  onChange={(e) => setNewDoc({ ...newDoc, contentText: e.target.value })}
                  placeholder="এখানে অনুমোদিত নির্দেশিকা, ধারা ও শর্তাবলী স্পষ্টভাবে লিখুন..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">সার্চ ট্যাগ (কমা দিয়ে লিখুন)</label>
                <input
                  type="text"
                  value={newDoc.tags}
                  onChange={(e) => setNewDoc({ ...newDoc, tags: e.target.value })}
                  placeholder="ভর্তি, ফি, ২০২৬, নিয়ম"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-5 py-2 rounded-lg font-bold"
                >
                  সংরক্ষণ করুন (ড্রাফট)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
