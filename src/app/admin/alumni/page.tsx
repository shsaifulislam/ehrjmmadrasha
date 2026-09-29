"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  ShieldCheck,
  Search,
  Filter,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  Eye,
  Check,
  X,
  AlertTriangle,
  History,
  BookOpen,
  HandHeart,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { AlumniProfile, AlumniStatus, AlumniAuditEntry } from "@/lib/alumni/types";

export default function AdminAlumniCockpitPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AlumniAuditEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"verification" | "directory" | "import" | "audit">("verification");

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Action state
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [verificationNote, setVerificationNote] = useState("");

  // Import state
  const [importJson, setImportJson] = useState("");
  const [importBatchName, setImportBatchName] = useState("");
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetch("/api/alumni?view=admin&stats=true&limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfiles(data.data || []);
          setStats(data.stats || null);
        }
      })
      .catch((err) => console.error("Error loading admin alumni data:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async (id: string, action: "VERIFY" | "REJECT" | "OPT_OUT" | "ARCHIVE") => {
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/alumni/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notes: verificationNote || `Admin ${action.toLowerCase()} via Cockpit`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVerificationNote("");
        loadData();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePreviewImport = async () => {
    if (!importBatchName || !importJson) {
      alert("দয়া করে ব্যাচের নাম এবং JSON ডেটা প্রদান করুন।");
      return;
    }
    try {
      const parsedRows = JSON.parse(importJson);
      const res = await fetch("/api/alumni/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PREVIEW",
          batchName: importBatchName,
          sourceFormat: "JSON",
          rows: parsedRows,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImportPreview(data.preview);
        setImportResult(null);
      } else {
        alert(data.error || "Preview failed");
      }
    } catch (err: any) {
      alert("Invalid JSON format: " + err.message);
    }
  };

  const handleExecuteImport = async () => {
    if (!importPreview) return;
    setImporting(true);
    try {
      const parsedRows = JSON.parse(importJson);
      const res = await fetch("/api/alumni/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EXECUTE",
          batchName: importBatchName,
          sourceFormat: "JSON",
          rows: parsedRows,
          autoVerifyLegacy: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImportResult(data.result);
        setImportPreview(null);
        setImportJson("");
        setImportBatchName("");
        loadData();
      } else {
        alert(data.error || "Execution failed");
      }
    } catch (err: any) {
      alert("Import execution error: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const pendingVerificationList = profiles.filter((p) => p.status === "PENDING_VERIFICATION");

  const filteredProfiles = profiles.filter((p) => {
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchSearch =
      !searchQuery ||
      p.fullNameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.fullNameEn && p.fullNameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.studentId && p.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
              <span>প্রশাসনিক নিয়ন্ত্রণ কেন্দ্র</span>
              <span>/</span>
              <span>অ্যালামনাই ও প্রাক্তন ছাত্র উইং</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif">
              অ্যালামনাই ম্যানেজমেন্ট ও সম্পর্ক ইঞ্জিন
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              যাচাইকরণ কার্যপ্রবাহ, সম্প্রদায় গ্রুপ, ক্যারিয়ার মেন্টরশিপ ও ঐতিহাসিক তথ্য সমন্বয়
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/alumni/directory"
              target="_blank"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            >
              পাবলিক ডিরেক্টরি <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={loadData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition"
              title="রিফ্রেশ"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Institutional Invariant Alert */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <span className="font-bold">EHRJ ERP Invariant:</span> অ্যালামনাই কোনো দ্বিতীয় ছাত্র ডাটাবেজ নয়। এটি প্রাক্তন ছাত্রদের সাথে মাদরাসার সম্পর্ক রক্ষাকারী স্তর। মূল সনদ ও শিক্ষাবর্ষ ছাত্র নথির সাথে সংযুক্ত।
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 rounded text-emerald-800 font-bold whitespace-nowrap">
            Phase 36
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-xl font-black text-slate-900">{stats.totalProfiles}</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">মোট প্রোফাইল</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-xl font-black text-amber-600">{stats.pendingVerification}</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">যাচাই অপেক্ষমাণ</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-xl font-black text-emerald-600">{stats.verifiedCount}</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">যাচাইকৃত সক্রিয়</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-xl font-black text-indigo-600">{stats.activeMentors}</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">নিবন্ধিত মেন্টর</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-xl font-black text-teal-600">{stats.activeGroups}</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">কমিউনিটি গ্রুপ</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-xl font-black text-blue-600">{stats.totalVolunteerHours} ঘণ্টা</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">সমাজসেবা খেদমত</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab("verification")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "verification"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            যাচাইকরণ কিউ ({pendingVerificationList.length})
          </button>
          <button
            onClick={() => setActiveTab("directory")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "directory"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-500" />
            সকল অ্যালামনাই তালিকা ({profiles.length})
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "import"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            ঐতিহাসিক তথ্য ব্যাচ ইমপোর্ট
          </button>
        </div>

        {/* Tab 1: Verification Queue */}
        {activeTab === "verification" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold font-serif text-slate-900">
                  যাচাইকরণ অপেক্ষমাণ আবেদনসমূহ
                </h3>
                <p className="text-xs text-slate-500">
                  নতুন নিবন্ধনকারী শিক্ষার্থীদের মূল মাদরাসা রেকর্ডের সাথে যাচাই করে অনুমোদন দিন।
                </p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                অপেক্ষমাণ: {pendingVerificationList.length} জন
              </span>
            </div>

            {pendingVerificationList.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">বর্তমানে কোনো অপেক্ষমাণ আবেদন নেই। সকল প্রোফাইল যাচাইকৃত।</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                      <th className="py-3 px-3">ছাত্র আইডি</th>
                      <th className="py-3 px-3">নাম (বাংলা / ইংরেজি)</th>
                      <th className="py-3 px-3">পাসিং ব্যাচ ও বিভাগ</th>
                      <th className="py-3 px-3">পেশা ও অবস্থান</th>
                      <th className="py-3 px-3">যোগাযোগ</th>
                      <th className="py-3 px-3 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingVerificationList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {p.studentId}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{p.fullNameBn}</div>
                          <div className="text-[11px] text-slate-500">{p.fullNameEn}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-700">ব্যাচ {p.passOutYear}</span>
                          <div className="text-[11px] text-slate-500">{p.department}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <div>{p.currentProfession || "উল্লেখ নেই"}</div>
                          <div className="text-[11px] text-slate-400">{p.currentCity}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <div>{p.phone || "—"}</div>
                          <div className="text-[11px] text-slate-400">{p.email || "—"}</div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleVerify(p.id, "VERIFY")}
                              disabled={actionInProgress === p.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> যাচাই ও অনুমোদন
                            </button>
                            <button
                              onClick={() => handleVerify(p.id, "REJECT")}
                              disabled={actionInProgress === p.id}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] transition flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> প্রত্যাখ্যান
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: All Alumni Directory */}
        {activeTab === "directory" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none w-64"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="ALL">সকল স্ট্যাটাস</option>
                  <option value="VERIFIED">যাচাইকৃত (VERIFIED)</option>
                  <option value="PENDING_VERIFICATION">অপেক্ষমাণ (PENDING)</option>
                  <option value="REJECTED">প্রত্যাখ্যাত (REJECTED)</option>
                  <option value="OPTED_OUT">অপসারণকৃত (OPTED_OUT)</option>
                  <option value="ARCHIVED">আর্কাইভড (ARCHIVED)</option>
                </select>
              </div>

              <div className="text-xs text-slate-500">
                মোট প্রদর্শন: <span className="font-bold text-slate-800">{filteredProfiles.length}</span> জন
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                    <th className="py-2.5 px-3">স্ট্যাটাস</th>
                    <th className="py-2.5 px-3">ছাত্র আইডি</th>
                    <th className="py-2.5 px-3">নাম</th>
                    <th className="py-2.5 px-3">ব্যাচ ও বিভাগ</th>
                    <th className="py-2.5 px-3">বর্তমান পেশা ও শহর</th>
                    <th className="py-2.5 px-3">ঐতিহাসিক রেকর্ড</th>
                    <th className="py-2.5 px-3 text-right">ব্যবস্থাপনা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === "VERIFIED"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.status === "PENDING_VERIFICATION"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{p.studentId}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{p.fullNameBn}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {p.passOutYear} • {p.department}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {p.currentProfession || "—"} {p.currentCity && `(${p.currentCity})`}
                      </td>
                      <td className="py-2.5 px-3">
                        {p.isLegacy ? (
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                            ঐতিহাসিক
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">স্টুডেন্ট মাস্টার</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status !== "OPTED_OUT" && (
                            <button
                              onClick={() => handleVerify(p.id, "OPT_OUT")}
                              disabled={actionInProgress === p.id}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold"
                            >
                              অপসারণ
                            </button>
                          )}
                          {p.status !== "ARCHIVED" && (
                            <button
                              onClick={() => handleVerify(p.id, "ARCHIVE")}
                              disabled={actionInProgress === p.id}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold"
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

        {/* Tab 3: Legacy Data Import */}
        {activeTab === "import" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold font-serif text-slate-900 mb-1">
              ঐতিহাসিক প্রাক্তন ছাত্র তথ্য ব্যাচ ইমপোর্ট
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              প্রতিষ্ঠানের পূর্ববর্তী খাতা বা রেজিস্টার থেকে সংগৃহীত রেকর্ড নিরাপদভাবে সিস্টেমে যুক্ত করুন।
              স্বয়ংক্রিয় ডুপ্লিকেট সনাক্তকরণ (ফোন, ইমেইল, নাম+ব্যাচ) সক্রিয় থাকবে।
            </p>

            <div className="space-y-4 max-w-3xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ব্যাচের নাম বা রেফারেন্স *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: Batch-2021-Hifz-Register-Import"
                  value={importBatchName}
                  onChange={(e) => setImportBatchName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  JSON রেকর্ডস অ্যারে *
                </label>
                <textarea
                  rows={8}
                  placeholder={`[
  {
    "studentId": "LEGACY-2021-001",
    "fullNameBn": "মাওলানা হাফেজ মুসা",
    "fullNameEn": "Musa Ahmed",
    "passOutYear": 2021,
    "department": "Hifz",
    "phone": "01811223344",
    "currentProfession": "ইমাম ও শিক্ষক"
  }
]`}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePreviewImport}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" /> প্রিভিউ ও ডুপ্লিকেট যাচাই
                </button>
              </div>

              {/* Preview Diagnostic */}
              {importPreview && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-800">
                      ইমপোর্ট প্রিভিউ ফলাফল (ডায়াগনস্টিকস)
                    </h4>
                    <span className="text-xs font-bold text-emerald-700">
                      বৈধ রেকর্ড: {importPreview.validCount} / {importPreview.totalRows}
                    </span>
                  </div>

                  {importPreview.duplicatesCount > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{importPreview.duplicatesCount} টি সম্ভাব্য ডুপ্লিকেট রেকর্ড সনাক্ত হয়েছে।</span>
                    </div>
                  )}

                  {importPreview.errors.length > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                      <div className="font-bold mb-1">ত্রুটিসমূহ:</div>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                        {importPreview.errors.map((err: any, i: number) => (
                          <li key={i}>সারি {err.rowIndex}: {err.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      disabled={importing || importPreview.validCount === 0}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                    >
                      {importing ? "ইমপোর্ট সম্পন্ন হচ্ছে..." : "ইমপোর্ট চূড়ান্ত করুন"}
                    </button>
                  </div>
                </div>
              )}

              {/* Import Result Notification */}
              {importResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">ইমপোর্ট সফল!</span> ব্যাচ {importResult.batchId}: {importResult.importedCount} টি রেকর্ড সফলভাবে সংরক্ষিত হয়েছে।
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
