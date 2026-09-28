"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Network,
  Shield,
  Key,
  Webhook,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Plus,
  Play,
  Download,
  Upload,
  Lock,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
  Clock,
  Radio,
  FileSpreadsheet,
  AlertOctagon,
  Copy,
  Check,
} from "lucide-react";
import { INSTITUTIONAL_SOURCE_OF_TRUTH_MAP } from "@/lib/integration/sourceOfTruthMap";

export default function AdminIntegrationsPage() {
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "REGISTRY" | "WEBHOOKS" | "API_GATEWAY" | "LOGS_RECON"
  >("OVERVIEW");

  const [overview, setOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(
    null
  );

  // Registry State
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  // API Keys State
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyOwner, setKeyOwner] = useState("");
  const [keyScopes, setKeyScopes] = useState<string[]>(["students:read"]);
  const [keyEnv, setKeyEnv] = useState<"PRODUCTION" | "SANDBOX">("PRODUCTION");
  const [keyRateLimit, setKeyRateLimit] = useState(60);
  const [keyValidDays, setKeyValidDays] = useState(180);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Webhooks State
  const [webhooksData, setWebhooksData] = useState<any | null>(null);
  const [dlqItems, setDlqItems] = useState<any[]>([]);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subName, setSubName] = useState("");
  const [subUrl, setSubUrl] = useState("");
  const [subEvents, setSubEvents] = useState<string[]>(["PAYMENT_SUCCESSFUL"]);

  // Logs & Recon State
  const [logs, setLogs] = useState<any[]>([]);
  const [exportEntityType, setExportEntityType] = useState<"STUDENT" | "ATTENDANCE" | "FINANCE" | "EXAM">("STUDENT");
  const [exportFormat, setExportFormat] = useState<"JSON" | "CSV">("CSV");
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<any | null>(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === "REGISTRY") fetchRegistry();
    if (activeTab === "API_GATEWAY") fetchApiKeys();
    if (activeTab === "WEBHOOKS") {
      fetchWebhooks();
      fetchDlq();
    }
    if (activeTab === "LOGS_RECON") {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/integrations/overview");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load overview");
      setOverview(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistry = async () => {
    try {
      const res = await fetch("/api/admin/integrations/registry");
      const json = await res.json();
      if (json.success) setIntegrations(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const res = await fetch("/api/admin/integrations/api-keys");
      const json = await res.json();
      if (json.success) setApiKeys(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/admin/integrations/webhooks");
      const json = await res.json();
      if (json.success) setWebhooksData(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDlq = async () => {
    try {
      const res = await fetch("/api/admin/integrations/dead-letter");
      const json = await res.json();
      if (json.success) setDlqItems(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/integrations/logs?limit=50");
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestConnection = async (id: string, code: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/integrations/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeOrId: id }),
      });
      const json = await res.json();
      if (json.success) {
        setTestResult({ code, ...json.data });
        setActionMsg({ text: `কানেকশন টেস্ট সফল (${json.data.latencyMs}ms)`, type: "success" });
        fetchRegistry();
      } else {
        setActionMsg({ text: json.error || "কানেকশন টেস্ট ব্যর্থ", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "কানেকশন টেস্ট ত্রুটি", type: "error" });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/integrations/registry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus, reason: "Manual toggle by admin" }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg({ text: `ইন্টিগ্রেশন স্ট্যাটাস পরিবর্তন সফল: ${nextStatus}`, type: "success" });
        fetchRegistry();
      } else {
        setActionMsg({ text: json.error, type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/integrations/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName,
          owner: keyOwner,
          scopes: keyScopes,
          environment: keyEnv,
          rateLimitPerMin: keyRateLimit,
          validDays: keyValidDays,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreatedRawKey(json.data.rawKey);
        setActionMsg({ text: "নতুন এপিআই কী সফলভাবে ইস্যু করা হয়েছে।", type: "success" });
        fetchApiKeys();
      } else {
        setActionMsg({ text: json.error, type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই এপিআই কী বাতিল (Revoke) করতে চান?")) return;
    try {
      const res = await fetch(`/api/admin/integrations/api-keys?id=${id}&reason=Manual+Admin+Revocation`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg({ text: "এপিআই কী সফলভাবে বাতিল করা হয়েছে।", type: "success" });
        fetchApiKeys();
      } else {
        setActionMsg({ text: json.error, type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/integrations/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: subName,
          targetUrl: subUrl,
          eventTypes: subEvents,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowSubModal(false);
        setActionMsg({ text: "ওয়েবহুক সাবস্ক্রিপশন যুক্ত করা হয়েছে।", type: "success" });
        fetchWebhooks();
      } else {
        setActionMsg({ text: json.error, type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleReplayDlq = async (id: string) => {
    try {
      const res = await fetch("/api/admin/integrations/dead-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "REPLAY" }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg({ text: json.message, type: "success" });
        fetchDlq();
      } else {
        setActionMsg({ text: json.error, type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);
    try {
      const res = await fetch("/api/admin/integrations/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EXPORT",
          entityType: exportEntityType,
          format: exportFormat,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setExportResult(json.data);
        setActionMsg({ text: json.message, type: "success" });
      } else {
        setActionMsg({ text: json.error, type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header */}
      <div className="bg-[#0D5C3A] text-white py-8 px-6 shadow-md border-b-4 border-[#C59B27]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-200 text-sm mb-1">
              <Link href="/admin" className="hover:underline flex items-center gap-1">
                অ্যাডমিন ড্যাশবোর্ড
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span>ইন্টিগ্রেশন হাব ও এপিআই গেটওয়ে</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
              <Network className="w-8 h-8 text-[#C59B27]" />
              ইন্টিগ্রেশন হাব ও প্রাতিষ্ঠানিক ইন্টারঅপারেবিলিটি
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              Phase 28 — Institutional Integration Hub, API Gateway & External Systems Boundary
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-emerald-800 text-emerald-200 px-3 py-1.5 rounded-full text-xs font-mono font-semibold border border-emerald-700">
              Checkpoint: EHRJ-AI-2026-PHASE28
            </span>
            <button
              onClick={() => {
                fetchOverview();
                if (activeTab === "REGISTRY") fetchRegistry();
                if (activeTab === "API_GATEWAY") fetchApiKeys();
                if (activeTab === "WEBHOOKS") {
                  fetchWebhooks();
                  fetchDlq();
                }
                if (activeTab === "LOGS_RECON") fetchLogs();
              }}
              className="bg-[#C59B27] hover:bg-[#a8821d] text-slate-950 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow"
            >
              <RefreshCw className="w-4 h-4" /> রিফ্রেশ
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        {/* Action / Error Toast */}
        {actionMsg && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center justify-between shadow ${
              actionMsg.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                : "bg-rose-50 text-rose-900 border border-rose-300"
            }`}
          >
            <div className="flex items-center gap-2 font-medium text-sm">
              {actionMsg.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              )}
              {actionMsg.text}
            </div>
            <button
              onClick={() => setActionMsg(null)}
              className="text-xs font-bold underline ml-4 hover:opacity-75"
            >
              বন্ধ করুন
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 mb-6">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition ${
              activeTab === "OVERVIEW"
                ? "bg-[#0D5C3A] text-white shadow"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Activity className="w-4 h-4" /> সার্বিক পর্যালোচনা (Overview)
          </button>
          <button
            onClick={() => setActiveTab("REGISTRY")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition ${
              activeTab === "REGISTRY"
                ? "bg-[#0D5C3A] text-white shadow"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Network className="w-4 h-4" /> ইন্টিগ্রেশন রেজিস্ট্রি (Registry)
          </button>
          <button
            onClick={() => setActiveTab("WEBHOOKS")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition ${
              activeTab === "WEBHOOKS"
                ? "bg-[#0D5C3A] text-white shadow"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Webhook className="w-4 h-4" /> ওয়েবহুক ও ডেড-লেটার (Webhooks & DLQ)
          </button>
          <button
            onClick={() => setActiveTab("API_GATEWAY")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition ${
              activeTab === "API_GATEWAY"
                ? "bg-[#0D5C3A] text-white shadow"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Key className="w-4 h-4" /> এপিআই গেটওয়ে ও কী (API Gateway & Keys)
          </button>
          <button
            onClick={() => setActiveTab("LOGS_RECON")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition ${
              activeTab === "LOGS_RECON"
                ? "bg-[#0D5C3A] text-white shadow"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Database className="w-4 h-4" /> ডেটা এক্সচেঞ্জ ও লগস (Logs & Recon)
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      মোট রেজিস্টার্ড ইন্টিগ্রেশন
                    </p>
                    <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                      {overview?.integrations?.total ?? 6}
                    </h3>
                  </div>
                  <div className="p-3 bg-emerald-50 text-[#0D5C3A] rounded-lg">
                    <Network className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  সক্রিয়: {overview?.integrations?.active ?? 4} টি | স্বাস্থ্যবান:{" "}
                  {overview?.integrations?.healthy ?? 6} টি
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      সক্রিয় এপিআই ক্রেডেনশিয়াল
                    </p>
                    <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                      {overview?.apiGateway?.activeKeys ?? 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-amber-50 text-[#C59B27] rounded-lg">
                    <Key className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  মোট কী: {overview?.apiGateway?.totalKeys ?? 0} | বাতিলকৃত:{" "}
                  {overview?.apiGateway?.revokedKeys ?? 0}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      ওয়েবহুক সাবস্ক্রিপশন
                    </p>
                    <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                      {overview?.webhooks?.activeSubscriptions ?? 2}
                    </h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <Webhook className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  ডেলিভারি সম্পন্ন: {overview?.webhooks?.totalDeliveries ?? 0} | ইনবাউন্ড:{" "}
                  {overview?.webhooks?.inboundProcessed ?? 0}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      ডেড-লেটার কোয়ারেন্টাইন (DLQ)
                    </p>
                    <h3
                      className={`text-3xl font-extrabold mt-1 ${
                        (overview?.webhooks?.deadLetterCount ?? 0) > 0
                          ? "text-rose-600"
                          : "text-slate-800"
                      }`}
                    >
                      {overview?.webhooks?.deadLetterCount ?? 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                    <AlertOctagon className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  অমীমাংসিত ব্যর্থ ডেলিভারি: {overview?.webhooks?.deadLetterCount ?? 0} টি
                </div>
              </div>
            </div>

            {/* Architecture Invariants Box */}
            <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 rounded-xl shadow border border-emerald-800">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-[#C59B27]" />
                <h4 className="font-bold text-lg">
                  Phase 28 Core Invariant: Connect Systems, Not Authorities
                </h4>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">
                বহিঃস্থ গেটওয়ে বা থার্ড-পার্টি সিস্টেম কখনোই মাদরাসার একক সত্যের উৎস (Source of Truth)
                হতে পারবে না। ফিন্যান্স, উপস্থিতি, একাডেমিক ফলাফল এবং সনদপত্রের চূড়ান্ত কর্তৃত্ব
                অভ্যন্তরীণ সার্ভিসসমূহের হাতে সংরক্ষিত। কোনো পেমেন্ট ভেরিফিকেশন ছাড়া সফল চিহ্নিত
                হবে না।
              </p>
            </div>

            {/* Source of Truth Mapping Grid */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-[#0D5C3A]" />
                প্রাতিষ্ঠানিক ডেটা মালিকানা ও কর্তৃত্ব ম্যাট্রিক্স (Source-of-Truth Map)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-4 font-semibold">ডোমেন / ক্ষেত্র</th>
                      <th className="py-2.5 px-4 font-semibold">কর্তৃত্বশীল ইঞ্জিন</th>
                      <th className="py-2.5 px-4 font-semibold">অভ্যন্তরীণ মডিউল</th>
                      <th className="py-2.5 px-4 font-semibold">বহিঃস্থ অনুমতি</th>
                      <th className="py-2.5 px-4 font-semibold">দ্বন্দ্ব নিরসন নীতি</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {INSTITUTIONAL_SOURCE_OF_TRUTH_MAP.slice(0, 6).map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block">{item.domainBn}</span>
                          <span className="text-xs text-slate-400 font-mono">{item.domain}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-emerald-800">
                          {item.authoritativeEngine}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.internalOwnerModule}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded font-mono">
                            {item.externalConsumerAccess}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 max-w-xs">
                          {item.conflictResolutionRule}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTEGRATION REGISTRY */}
        {activeTab === "REGISTRY" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  ইনস্টিটিউশনাল ইন্টিগ্রেশন রেজিস্ট্রি
                </h3>
                <p className="text-sm text-slate-500">
                  মাদরাসা ইআরপির সাথে সংযুক্ত বহিঃস্থ চ্যানেল ও অ্যাডাপ্টারের স্থিতি ও স্বাস্থ্য
                </p>
              </div>
            </div>

            {/* Test Connection Diagnostic Box */}
            {testResult && (
              <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-700 shadow-md">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> কানেকশন টেস্ট ডায়াগনস্টিক রেজাল্ট —{" "}
                    {testResult.code}
                  </h4>
                  <span className="text-xs bg-slate-800 px-2.5 py-1 rounded text-slate-300 font-mono">
                    Latency: {testResult.latencyMs} ms
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-3">{testResult.message}</p>
                <div className="bg-black/40 p-3 rounded font-mono text-xs text-slate-400 overflow-x-auto">
                  <pre>{JSON.stringify(testResult.diagnostics, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Integrations Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <th className="py-3 px-4 font-semibold">ইন্টিগ্রেশন ও প্রোভাইডার</th>
                      <th className="py-3 px-4 font-semibold">ক্যাটেগরি</th>
                      <th className="py-3 px-4 font-semibold">এনভায়রনমেন্ট</th>
                      <th className="py-3 px-4 font-semibold">স্ট্যাটাস</th>
                      <th className="py-3 px-4 font-semibold">স্বাস্থ্য</th>
                      <th className="py-3 px-4 font-semibold">গড় ল্যাটেন্সি</th>
                      <th className="py-3 px-4 text-right font-semibold">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {integrations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{item.nameBn}</span>
                          <span className="text-xs text-slate-500">
                            {item.name} • <span className="font-mono text-slate-400">{item.integrationCode}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded font-semibold">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded font-bold font-mono ${
                              item.environment === "PRODUCTION"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.environment}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                              item.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                                : item.status === "CONFIGURED"
                                ? "bg-blue-50 text-blue-700 border border-blue-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {item.healthStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {item.metrics?.averageLatencyMs ?? 0} ms
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleTestConnection(item.id, item.integrationCode)}
                            disabled={testingId === item.id}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded border border-slate-300 transition"
                          >
                            {testingId === item.id ? "টেস্টিং..." : "টেস্ট কানেকশন"}
                          </button>
                          <button
                            onClick={() => handleToggleStatus(item.id, item.status)}
                            className={`text-xs font-bold px-3 py-1.5 rounded transition ${
                              item.status === "ACTIVE"
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            {item.status === "ACTIVE" ? "পজ করুন" : "সক্রিয় করুন"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WEBHOOKS & DLQ */}
        {activeTab === "WEBHOOKS" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  ওয়েবহুক ব্রোকার ও ডেড-লেটার কিউ (DLQ)
                </h3>
                <p className="text-sm text-slate-500">
                  ডোমেন ইভেন্ট সাবস্ক্রিপশন, এইচএমএসি সাইনিং ও কোয়ারেন্টাইন ট্র্যাকিং
                </p>
              </div>
              <button
                onClick={() => setShowSubModal(true)}
                className="bg-[#0D5C3A] hover:bg-[#094229] text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" /> নতুন সাবস্ক্রিপশন
              </button>
            </div>

            {/* DLQ Quarantine Alert Box */}
            {dlqItems.filter((d) => d.resolutionStatus === "PENDING").length > 0 && (
              <div className="bg-rose-50 border-l-4 border-rose-600 p-5 rounded-r-xl shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-rose-900 flex items-center gap-2">
                      <AlertOctagon className="w-5 h-5 text-rose-600" />
                      ডেড-লেটার কিউতে {dlqItems.filter((d) => d.resolutionStatus === "PENDING").length} টি ব্যর্থ ডেলিভারি কোয়ারেন্টাইন রয়েছে
                    </h4>
                    <p className="text-xs text-rose-700 mt-1">
                      সর্বোচ্চ রিট্রাই ব্যর্থ হওয়ার পর এসব ইভেন্ট নিরাপদ স্টোরেজে সংরক্ষিত রয়েছে। আপনি
                      নিরাপদে পুনরায় প্রসেস (Replay) করতে পারেন।
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {dlqItems
                    .filter((d) => d.resolutionStatus === "PENDING")
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-3 rounded-lg border border-rose-200 flex justify-between items-center text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-800 mr-2">{item.id}</span>
                          <span className="text-rose-700 font-semibold mr-2">{item.eventType}</span>
                          <span className="text-slate-500">ত্রুটি: {item.lastError}</span>
                        </div>
                        <button
                          onClick={() => handleReplayDlq(item.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1 rounded text-xs transition"
                        >
                          পুনরায় চেষ্টা (Replay)
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Subscriptions List */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Webhook className="w-5 h-5 text-[#0D5C3A]" /> সক্রিয় ওয়েবহুক সাবস্ক্রিপশন
              </h4>
              <div className="space-y-3">
                {webhooksData?.subscriptions?.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{sub.name}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-1">{sub.targetUrl}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {sub.eventTypes?.map((evt: string) => (
                          <span
                            key={evt}
                            className="bg-slate-200 text-slate-700 text-[11px] px-2 py-0.5 rounded font-mono"
                          >
                            {evt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-400 font-mono">
                      Secret: {sub.secretMasked}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Deliveries */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" /> সাম্প্রতিক ওয়েবহুক ডেলিভারি হিস্ট্রি
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-xs">
                      <th className="py-2.5 px-3 font-semibold">ডেলিভারি আইডি</th>
                      <th className="py-2.5 px-3 font-semibold">ইভেন্ট আইডি</th>
                      <th className="py-2.5 px-3 font-semibold">টার্গেট URL</th>
                      <th className="py-2.5 px-3 font-semibold">চেষ্টা</th>
                      <th className="py-2.5 px-3 font-semibold">স্ট্যাটাস</th>
                      <th className="py-2.5 px-3 font-semibold">ল্যাটেন্সি</th>
                      <th className="py-2.5 px-3 font-semibold">সময়</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {webhooksData?.deliveries?.slice(0, 8).map((del: any) => (
                      <tr key={del.deliveryId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {del.deliveryId}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{del.eventId}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 truncate max-w-xs">
                          {del.targetUrl}
                        </td>
                        <td className="py-2.5 px-3">{del.attempt}/{del.maxAttempts}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] ${
                              del.deliveryStatus === "ACKNOWLEDGED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {del.deliveryStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{del.latencyMs} ms</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {new Date(del.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: API GATEWAY & KEYS */}
        {activeTab === "API_GATEWAY" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  ইনস্টিটিউশনাল এপিআই গেটওয়ে ও ক্রেডেনশিয়াল
                </h3>
                <p className="text-sm text-slate-500">
                  বহিঃস্থ সিস্টেমের জন্য সুরক্ষিত ক্রিপ্টোগ্রাফিক এপিআই কী ও ন্যূনতম সুযোগ (Least-Privilege Scopes)
                </p>
              </div>
              <button
                onClick={() => {
                  setCreatedRawKey(null);
                  setShowKeyModal(true);
                }}
                className="bg-[#0D5C3A] hover:bg-[#094229] text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" /> নতুন এপিআই কী তৈরি করুন
              </button>
            </div>

            {/* Issued Raw Key Modal Notification */}
            {createdRawKey && (
              <div className="bg-amber-50 border-2 border-[#C59B27] p-5 rounded-xl shadow-md">
                <div className="flex items-center gap-2 text-amber-900 font-bold mb-2">
                  <Lock className="w-5 h-5 text-[#C59B27]" />
                  জরুরি নিরাপত্তা সতর্কতা: আপনার গোপনীয় এপিআই কী
                </div>
                <p className="text-xs text-amber-800 mb-3">
                  এই কী-টি কেবল একবারই প্রদর্শিত হবে। এটি এখনই নিরাপদ স্থানে কপি করে সংরক্ষণ করুন। ডাটাবেজে
                  শুধুমাত্র এর SHA-256 হ্যাশ সংরক্ষিত থাকে।
                </p>
                <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-amber-300 font-mono text-sm text-slate-800">
                  <span className="flex-1 break-all select-all font-bold">{createdRawKey}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdRawKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="bg-[#C59B27] hover:bg-[#b0881f] text-slate-950 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1 shadow"
                  >
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedKey ? "কপিকৃত!" : "কপি করুন"}
                  </button>
                </div>
              </div>
            )}

            {/* API Keys Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <th className="py-3 px-4 font-semibold">কী নাম ও প্রিফিক্স</th>
                      <th className="py-3 px-4 font-semibold">মালিক / গ্রাহক</th>
                      <th className="py-3 px-4 font-semibold">অনুমোদিত স্কোপ</th>
                      <th className="py-3 px-4 font-semibold">রেট লিমিট</th>
                      <th className="py-3 px-4 font-semibold">স্ট্যাটাস</th>
                      <th className="py-3 px-4 font-semibold">মেয়াদ উত্তীর্ণ</th>
                      <th className="py-3 px-4 text-right font-semibold">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {apiKeys.map((k) => (
                      <tr key={k.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{k.name}</span>
                          <span className="font-mono text-xs text-slate-400">{k.keyPrefix}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700 block">{k.owner}</span>
                          <span className="text-xs text-slate-400">{k.ownerType}</span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {k.scopes?.map((s: string) => (
                              <span
                                key={s}
                                className="bg-slate-100 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {k.rateLimitPerMin} req/min
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                              k.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                                : "bg-rose-50 text-rose-700 border border-rose-300"
                            }`}
                          >
                            {k.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                          {new Date(k.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {k.status === "ACTIVE" && (
                            <button
                              onClick={() => handleRevokeKey(k.id)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline"
                            >
                              বাতিল (Revoke)
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LOGS & DATA EXCHANGE */}
        {activeTab === "LOGS_RECON" && (
          <div className="space-y-6">
            {/* Export Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
                <Download className="w-5 h-5 text-[#0D5C3A]" />
                প্রাতিষ্ঠানিক ডেটা এক্সপোর্ট হাব (RBAC Guarded)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                মাদরাসা শিক্ষা বোর্ড (BMEB) ও বহিরাগত অডিট রিপোর্টের জন্য ফিল্ড-লেভেল প্রাইভেসি
                সুরক্ষিত এক্সপোর্ট
              </p>
              <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    এনটিটি নির্বাচন করুন:
                  </label>
                  <select
                    value={exportEntityType}
                    onChange={(e: any) => setExportEntityType(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm font-semibold"
                  >
                    <option value="STUDENT">শিক্ষার্থী মাস্টার তালিকা (STUDENT)</option>
                    <option value="ATTENDANCE">দৈনিক উপস্থিতি রিপোর্ট (ATTENDANCE)</option>
                    <option value="FINANCE">ফি ইনভয়েস ও আদায় বিবরণী (FINANCE)</option>
                    <option value="EXAM">পরীক্ষার তালিকা (EXAM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">ফরম্যাট:</label>
                  <select
                    value={exportFormat}
                    onChange={(e: any) => setExportFormat(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm font-semibold"
                  >
                    <option value="CSV">CSV ফাইল (Excel সামঞ্জস্যপূর্ণ)</option>
                    <option value="JSON">JSON পে-লোড</option>
                  </select>
                </div>

                <div className="pt-5">
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="bg-[#0D5C3A] hover:bg-[#094229] text-white font-bold px-4 py-2 rounded text-sm flex items-center gap-2 shadow"
                  >
                    {exporting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    এক্সপোর্ট রান করুন
                  </button>
                </div>
              </div>

              {exportResult && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-emerald-900">
                      এক্সপোর্ট জব সফল: {exportResult.job.id} (সর্বমোট {exportResult.job.totalCount} রেকর্ড)
                    </span>
                    <button
                      onClick={() => {
                        const blob = new Blob(
                          [
                            exportFormat === "CSV"
                              ? exportResult.csvString
                              : JSON.stringify(exportResult.data, null, 2),
                          ],
                          {
                            type: exportFormat === "CSV" ? "text/csv" : "application/json",
                          }
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${exportResult.job.id}.${exportFormat.toLowerCase()}`;
                        a.click();
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1 rounded"
                    >
                      ডাউনলোড ফাইল
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Structured Logs Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-600" />
                স্ট্রাকচার্ড ইন্টিগ্রেশন অডিট ও রিকোয়েস্ট লগস
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-xs">
                      <th className="py-2.5 px-3 font-semibold">লগ আইডি</th>
                      <th className="py-2.5 px-3 font-semibold">ইন্টিগ্রেশন</th>
                      <th className="py-2.5 px-3 font-semibold">অপারেশন</th>
                      <th className="py-2.5 px-3 font-semibold">স্ট্যাটাস</th>
                      <th className="py-2.5 px-3 font-semibold">HTTP কোড</th>
                      <th className="py-2.5 px-3 font-semibold">সময়কাল</th>
                      <th className="py-2.5 px-3 font-semibold">টাইমস্ট্যাম্প</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          {log.id}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#0D5C3A]">
                          {log.integrationCode}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 truncate max-w-xs">
                          {log.operation}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] ${
                              log.status === "SUCCESS"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{log.httpStatus || "N/A"}</td>
                        <td className="py-2.5 px-3 font-mono">{log.durationMs} ms</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create API Key */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#0D5C3A]" /> নতুন এপিআই কী ইস্যু করুন
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                বহিঃস্থ ক্লায়েন্ট বা ইন্টিগ্রেশন পার্টনারের জন্য নিয়ন্ত্রিত এপিআই অ্যাক্সেস
              </p>

              <form onSubmit={handleCreateApiKey} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">কী নাম:</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: Madrasah Board Sync Partner"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">মালিক / পার্টনার:</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: BMEB IT Cell"
                    value={keyOwner}
                    onChange={(e) => setKeyOwner(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">পরিবেশ:</label>
                    <select
                      value={keyEnv}
                      onChange={(e: any) => setKeyEnv(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-semibold"
                    >
                      <option value="PRODUCTION">PRODUCTION</option>
                      <option value="SANDBOX">SANDBOX</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      রেট লিমিট (req/min):
                    </label>
                    <input
                      type="number"
                      value={keyRateLimit}
                      onChange={(e) => setKeyRateLimit(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    অনুমোদিত স্কোপ নির্বাচন করুন:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                    {[
                      "students:read",
                      "students:write",
                      "attendance:read",
                      "attendance:write",
                      "results:read",
                      "finance:read",
                    ].map((scope) => (
                      <label key={scope} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={keyScopes.includes(scope)}
                          onChange={(e) => {
                            if (e.target.checked) setKeyScopes([...keyScopes, scope]);
                            else setKeyScopes(keyScopes.filter((s) => s !== scope));
                          }}
                          className="rounded text-emerald-600 focus:ring-0"
                        />
                        <span className="font-mono">{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-semibold"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="bg-[#0D5C3A] hover:bg-[#094229] text-white font-bold px-4 py-2 rounded text-sm shadow"
                  >
                    ইস্যু নিশ্চিত করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Webhook Subscription */}
        {showSubModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Webhook className="w-5 h-5 text-[#0D5C3A]" /> নতুন ওয়েবহুক সাবস্ক্রিপশন
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                বহিঃস্থ এন্ডপয়েন্টে ইভেন্ট স্বয়ংক্রিয়ভাবে ডিসপ্যাচ করতে সাবস্ক্রিপশন তৈরি করুন
              </p>

              <form onSubmit={handleCreateSubscription} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    সাবস্ক্রিপশনের নাম:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: Partner Fee Payment Webhook"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    টার্গেট URL (HTTPS):
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://partner-portal.com/api/ehrj-webhook"
                    value={subUrl}
                    onChange={(e) => setSubUrl(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ইভেন্ট টাইপ নির্বাচন করুন:
                  </label>
                  <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                    {["PAYMENT_SUCCESSFUL", "ADMISSION_APPROVED", "STUDENT_CREATED"].map((evt) => (
                      <label key={evt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subEvents.includes(evt)}
                          onChange={(e) => {
                            if (e.target.checked) setSubEvents([...subEvents, evt]);
                            else setSubEvents(subEvents.filter((s) => s !== evt));
                          }}
                          className="rounded text-emerald-600 focus:ring-0"
                        />
                        <span className="font-mono font-semibold">{evt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowSubModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-semibold"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="bg-[#0D5C3A] hover:bg-[#094229] text-white font-bold px-4 py-2 rounded text-sm shadow"
                  >
                    সাবস্ক্রাইব করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
