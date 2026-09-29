"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Users,
  FileText,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Search,
  Eye,
  Sliders,
  Bell,
  Trash2,
  Calendar,
  Check,
  X,
  Play,
} from "lucide-react";

export default function AdminCommunicationsPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "campaigns" | "audience" | "templates" | "suppressions" | "digests" | "ai"
  >("overview");

  const [metrics, setMetrics] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [suppressions, setSuppressions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Campaign Form State
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    objective: "",
    communicationType: "OFFICIAL_NOTICE",
    channels: ["PORTAL", "EMAIL"],
    audienceType: "ALL_GUARDIANS",
    templateCode: "",
    subject: "",
    body: "",
    priority: "NORMAL",
  });

  // Audience Explorer State
  const [audienceTestType, setAudienceTestType] = useState("ALL_GUARDIANS");
  const [audienceResult, setAudienceResult] = useState<any>(null);
  const [testingAudience, setTestingAudience] = useState(false);

  // Template Test State
  const [selectedTemplateCode, setSelectedTemplateCode] = useState("");
  const [templateTestVars, setTemplateTestVars] = useState<Record<string, string>>({
    recipient_name: "মুহাম্মদ আব্দুল্লাহ",
    student_name: "আহমাদ উল্লাহ",
    roll: "১",
    class_title: "হিফজুল কুরআন বিভাগ",
    amount: "১৫০০",
    due_date: "১০ অক্টোবর ২০২৬",
  });

  // AI Drafter State
  const [aiAction, setAiAction] = useState("EXAM_ANNOUNCEMENT");
  const [aiDraftResult, setAiDraftResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Suppression Add State
  const [newSuppressionEmail, setNewSuppressionEmail] = useState("");
  const [newSuppressionReason, setNewSuppressionReason] = useState("USER_UNSUBSCRIBE");

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [mRes, cRes, tRes, sRes] = await Promise.all([
        fetch("/api/admin/communications/overview").then((r) => r.json()),
        fetch("/api/admin/communications/campaigns").then((r) => r.json()),
        fetch("/api/admin/communications/templates").then((r) => r.json()),
        fetch("/api/admin/communications/suppressions").then((r) => r.json()),
      ]);

      if (mRes.success) setMetrics(mRes.metrics);
      if (cRes.success) setCampaigns(cRes.campaigns);
      if (tRes.success) setTemplates(tRes.templates);
      if (sRes.success) setSuppressions(sRes.suppressions);
    } catch (err: any) {
      setErrorMsg("তথ্য লোড করতে সমস্যা হয়েছে: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Campaign Creation
  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/communications/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCampaign),
      }).then((r) => r.json());

      if (res.success) {
        setSuccessMsg(`ক্যাম্পেইন তৈরি সফল হয়েছে! আইডি: ${res.campaign.id}`);
        setNewCampaign({
          title: "",
          objective: "",
          communicationType: "OFFICIAL_NOTICE",
          channels: ["PORTAL", "EMAIL"],
          audienceType: "ALL_GUARDIANS",
          templateCode: "",
          subject: "",
          body: "",
          priority: "NORMAL",
        });
        loadAllData();
      } else {
        setErrorMsg(res.error || "ক্যাম্পেইন তৈরি ব্যর্থ হয়েছে");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  }

  // Handle Campaign Action (Send / Approve / DryRun)
  async function handleCampaignAction(id: string, action: "approve" | "send" | "dryRun") {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      if (action === "approve") {
        const res = await fetch(`/api/admin/communications/campaigns/${id}/approve`, {
          method: "POST",
        }).then((r) => r.json());
        if (res.success) {
          setSuccessMsg("ক্যাম্পেইন অনুমোদিত হয়েছে!");
          loadAllData();
        } else setErrorMsg(res.error);
      } else if (action === "dryRun" || action === "send") {
        const res = await fetch(`/api/admin/communications/campaigns/${id}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dryRun: action === "dryRun" }),
        }).then((r) => r.json());
        if (res.success) {
          setSuccessMsg(
            action === "dryRun"
              ? `ড্রাই-রান সফল! লক্ষ্য শ্রোতা: ${res.queued} জন, সফল: ${res.sent} জন, সাপ্রেসড: ${res.suppressed} জন।`
              : `ক্যাম্পেইন প্রেরণ সফল হয়েছে! মোট প্রেরিত: ${res.sent} জন।`
          );
          loadAllData();
        } else setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  }

  // Handle Test Audience Preview
  async function handleTestAudience() {
    setTestingAudience(true);
    setAudienceResult(null);
    try {
      const res = await fetch("/api/admin/communications/audience/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audienceType: audienceTestType }),
      }).then((r) => r.json());

      if (res.success) {
        setAudienceResult(res);
      }
    } catch (err: any) {
      setErrorMsg("শ্রোতা যাচাইকরণ ব্যর্থ: " + err.message);
    } finally {
      setTestingAudience(false);
    }
  }

  // Handle AI Drafter
  async function handleGenerateAiDraft() {
    setAiLoading(true);
    setAiDraftResult(null);
    try {
      const res = await fetch("/api/admin/communications/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: aiAction }),
      }).then((r) => r.json());

      if (res.success) {
        setAiDraftResult(res.draft);
      }
    } catch (err: any) {
      setErrorMsg("এআই ড্রাফট তৈরিতে সমস্যা: " + err.message);
    } finally {
      setAiLoading(false);
    }
  }

  // Handle Add Suppression
  async function handleAddSuppression(e: React.FormEvent) {
    e.preventDefault();
    if (!newSuppressionEmail) return;
    try {
      const res = await fetch("/api/admin/communications/suppressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newSuppressionEmail, reason: newSuppressionReason }),
      }).then((r) => r.json());
      if (res.success) {
        setSuccessMsg("ইমেইল সাপ্রেশন তালিকায় অন্তর্ভুক্ত হয়েছে।");
        setNewSuppressionEmail("");
        loadAllData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  }

  // Handle Generate Digest
  async function handleGenerateDigest(type: "DAILY" | "WEEKLY", live: boolean) {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/communications/digests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digestType: type, targetRole: "GUARDIAN", dispatchLive: live }),
      }).then((r) => r.json());
      if (res.success) {
        setSuccessMsg(
          `${type === "DAILY" ? "দৈনিক" : "সাপ্তাহিক"} ডাইজেস্ট তৈরি সম্পন্ন! সংগৃহীত আইটেম: ${res.digest.totalItems} টি${
            live ? `, প্রেরিত প্রাপক: ${res.digest.dispatchedRecipientsCount || 0} জন।` : "।"
          }`
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  ইনস্টিটিউশনাল কমিউনিকেশন অ্যান্ড ক্যাম্পেইন সেন্টার
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  Phase 32: প্রাতিষ্ঠানিক যোগাযোগ, টার্গেটেড ক্যাম্পেইন ও সম্প্রচার ইঞ্জিন
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition shadow-sm"
            >
              <RefreshCw className="w-4 h-4" /> রিফ্রেশ
            </button>
            <Link
              href="/admin"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 transition shadow-sm"
            >
              অ্যাডমিন ড্যাশবোর্ড
            </Link>
          </div>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg("")}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 border-b border-slate-200 pb-2">
          {[
            { id: "overview", label: "ওভারভিউ ও মেট্রিক্স", icon: Sliders },
            { id: "campaigns", label: "ক্যাম্পেইনস ম্যানেজার", icon: Send },
            { id: "audience", label: "শ্রোতা এক্সপ্লোরার", icon: Users },
            { id: "templates", label: "টেমপ্লেট ক্যাটালগ", icon: FileText },
            { id: "suppressions", label: "সাপ্রেশন ও অপ্ট-আউট", icon: ShieldAlert },
            { id: "digests", label: "ডাইজেস্ট ব্রডকাস্ট", icon: Bell },
            { id: "ai", label: "এআই ড্রাফটিং অ্যাসিস্ট্যান্ট", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === "overview" && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  মোট ক্যাম্পেইন
                </span>
                <div className="text-3xl font-bold text-slate-900 mt-2">
                  {metrics.totalCampaigns}
                </div>
                <span className="text-xs text-emerald-600 mt-1 block">
                  সক্রিয়: {metrics.activeCampaigns} টি
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  মোট প্রেরিত বার্তা
                </span>
                <div className="text-3xl font-bold text-emerald-600 mt-2">
                  {metrics.totalMessagesSent}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">
                  ডেলিভারড: {metrics.totalDelivered}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  সাপ্রেশন / অপ্ট-আউট
                </span>
                <div className="text-3xl font-bold text-amber-600 mt-2">
                  {metrics.suppressionCount}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">সুরক্ষিত বাউন্স ও ব্লক</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  অ্যাপ্রুভড টেমপ্লেট
                </span>
                <div className="text-3xl font-bold text-indigo-600 mt-2">
                  {metrics.templatesCount}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">ভার্শন নিয়ন্ত্রিত</span>
              </div>
            </div>

            {/* Recent Campaigns Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">সাম্প্রতিক কমিউনিকেশন ক্যাম্পেইনস</h3>
                <span className="text-xs text-slate-400">অডিট নিয়ন্ত্রিত রিয়েল-টাইম লগ</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="p-4">ক্যাম্পেইন আইডি ও শিরোনাম</th>
                      <th className="p-4">ক্যাটাগরি</th>
                      <th className="p-4">শ্রোতা ডোমেন</th>
                      <th className="p-4">স্ট্যাটাস</th>
                      <th className="p-4">প্রেরিত সংখ্যা</th>
                      <th className="p-4 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaigns.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          এখনো কোনো ক্যাম্পেইন তৈরি করা হয়নি।
                        </td>
                      </tr>
                    ) : (
                      campaigns.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <div className="font-semibold text-slate-900">{c.title}</div>
                            <div className="text-xs font-mono text-slate-400">{c.id}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                              {c.communicationType}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600">{c.audienceType}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                c.status === "SENT"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : c.status === "APPROVED"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : c.status === "SENDING"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-700">
                            {c.metrics?.sent || 0} / {c.metrics?.queued || 0}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {c.requiresApproval && !c.approvedBy && (
                              <button
                                onClick={() => handleCampaignAction(c.id, "approve")}
                                className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                              >
                                অনুমোদন দিন
                              </button>
                            )}
                            {c.status !== "SENT" && (
                              <button
                                onClick={() => handleCampaignAction(c.id, "send")}
                                className="px-3 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700"
                              >
                                সেন্ড করুন
                              </button>
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

        {/* ========================================================= */}
        {/* TAB 2: CAMPAIGNS MANAGER */}
        {/* ========================================================= */}
        {activeTab === "campaigns" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Campaign Form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                নতুন ক্যাম্পেইন তৈরি
              </h3>
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্যাম্পেইন শিরোনাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaign.title}
                    onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                    placeholder="যেমন: সাময়িক পরীক্ষার সময়সূচি ঘোষণা"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    উদ্দেশ্য ও নোট
                  </label>
                  <input
                    type="text"
                    value={newCampaign.objective}
                    onChange={(e) => setNewCampaign({ ...newCampaign, objective: e.target.value })}
                    placeholder="ক্যাম্পেইনের মূল লক্ষ্য..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ক্যাটাগরি</label>
                    <select
                      value={newCampaign.communicationType}
                      onChange={(e) =>
                        setNewCampaign({ ...newCampaign, communicationType: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="OFFICIAL_NOTICE">প্রাতিষ্ঠানিক নোটিশ</option>
                      <option value="PAYMENT_REMINDER">ফি পরিশোধের তাগিদ</option>
                      <option value="ADMISSION_UPDATE">ভর্তি সংক্রান্ত</option>
                      <option value="EVENT_INVITATION">অনুষ্ঠান দাওয়াত</option>
                      <option value="RESULT_NOTIFICATION">পরীক্ষার ফলাফল</option>
                      <option value="SYSTEM_ALERT">জরুরি অ্যালার্ট</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      শ্রোতা ডোমেন *
                    </label>
                    <select
                      value={newCampaign.audienceType}
                      onChange={(e) =>
                        setNewCampaign({ ...newCampaign, audienceType: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="ALL_GUARDIANS">সকল অভিভাবক</option>
                      <option value="ALL_TEACHERS">সকল শিক্ষক</option>
                      <option value="CLASS">নির্দিষ্ট জামাত</option>
                      <option value="RESIDENTIAL_GROUP">আবাসিক ছাত্র উইং</option>
                      <option value="FINANCE_TARGET_GROUP">বকেয়া ফি টার্গেট</option>
                      <option value="LIBRARY_TARGET_GROUP">লাইব্রেরি ওভারডিউ</option>
                      <option value="ALL_PUBLIC_USERS">পাবলিক সাবস্ক্রাইবার</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মেসেজ সাবজেক্ট *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaign.subject}
                    onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                    placeholder="ইমেইল ও নোটিফিকেশন টাইটেল"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    বার্তার মূল বিষয়বস্তু *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newCampaign.body}
                    onChange={(e) => setNewCampaign({ ...newCampaign, body: e.target.value })}
                    placeholder="মুহতারাম {{recipient_name}}, ..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition text-sm shadow-sm"
                >
                  ক্যাম্পেইন ড্রাফট সংরক্ষণ করুন
                </button>
              </form>
            </div>

            {/* Campaign List & Controls */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-lg text-slate-900 mb-2">ক্যাম্পেইন তালিকা ও অ্যাকশন</h3>
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        {c.id}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base mt-1">{c.title}</h4>
                      <p className="text-slate-500 text-xs mt-0.5">{c.objective}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        c.status === "SENT"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.status === "APPROVED"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                    <div>
                      <strong>বিষয়:</strong> {c.subject}
                    </div>
                    <div className="text-slate-500 line-clamp-2">
                      <strong>মেসেজ:</strong> {c.body}
                    </div>
                    <div className="flex gap-4 pt-1 text-slate-500">
                      <span>শ্রোতা: {c.audienceType}</span>
                      <span>চ্যানেল: {c.channels.join(", ")}</span>
                      <span>অগ্রাধিকার: {c.priority}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      লক্ষ্য: {c.metrics?.queued || 0} জন | প্রেরিত: {c.metrics?.sent || 0} জন |
                      সাপ্রেশন: {c.metrics?.suppressed || 0} জন
                    </div>
                    <div className="flex items-center gap-2">
                      {c.requiresApproval && !c.approvedBy && (
                        <button
                          onClick={() => handleCampaignAction(c.id, "approve")}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> অনুমোদন
                        </button>
                      )}
                      <button
                        onClick={() => handleCampaignAction(c.id, "dryRun")}
                        className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-200 flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5" /> ড্রাই-রান
                      </button>
                      {c.status !== "SENT" && (
                        <button
                          onClick={() => handleCampaignAction(c.id, "send")}
                          className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700 flex items-center gap-1 font-semibold"
                        >
                          <Send className="w-3.5 h-3.5" /> সেন্ড লাইভ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: AUDIENCE EXPLORER */}
        {/* ========================================================= */}
        {activeTab === "audience" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">ডাইনামিক অডিয়েন্স ও গ্রাহক রেজোলিউশন</h3>
              <p className="text-sm text-slate-500">
                ইআরপি ডেটাবেজ হতে রিয়েল-টাইম তথ্য অনুযায়ী প্রাপক রেজোলিউশন ও স্ন্যাপশট যাচাইকরণ
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="w-full sm:w-72">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  শ্রোতা ক্যাটাগরি নির্বাচন করুন
                </label>
                <select
                  value={audienceTestType}
                  onChange={(e) => setAudienceTestType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                >
                  <option value="ALL_GUARDIANS">সকল নিবন্ধিত অভিভাবক (ALL_GUARDIANS)</option>
                  <option value="ALL_TEACHERS">সকল শিক্ষক পরিষদ (ALL_TEACHERS)</option>
                  <option value="ALL_PRINCIPAL_OVERSIGHT">মুহতামিম ও প্রশাসন (ALL_PRINCIPAL_OVERSIGHT)</option>
                  <option value="RESIDENTIAL_GROUP">আবাসিক ছাত্র উইং (RESIDENTIAL_GROUP)</option>
                  <option value="FINANCE_TARGET_GROUP">বকেয়া ফি টার্গেট (FINANCE_TARGET_GROUP)</option>
                  <option value="LIBRARY_TARGET_GROUP">লাইব্রেরি ওভারডিউ (LIBRARY_TARGET_GROUP)</option>
                  <option value="EMPLOYEE_GROUP">কর্মকর্তা ও স্টাফ (EMPLOYEE_GROUP)</option>
                </select>
              </div>
              <div className="pt-5">
                <button
                  onClick={handleTestAudience}
                  disabled={testingAudience}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {testingAudience ? "যাচাই হচ্ছে..." : "রিয়েল-টাইম রেজোলিউশন দেখুন"}
                </button>
              </div>
            </div>

            {audienceResult && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase font-bold text-emerald-800">
                      সফলভাবে রেজোলিউশন সম্পন্ন
                    </span>
                    <div className="text-xl font-bold text-emerald-950 mt-0.5">
                      মোট প্রাপক: {audienceResult.totalCount} জন
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-white px-3 py-1 rounded-md border border-emerald-200 text-emerald-800">
                    {audienceResult.audienceType}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs">
                      <tr>
                        <th className="p-3">প্রাপকের নাম</th>
                        <th className="p-3">রোল / পদবি</th>
                        <th className="p-3">ইমেইল / যোগাযোগ</th>
                        <th className="p-3">শিক্ষার্থী</th>
                        <th className="p-3">অন্তর্ভুক্তির কারণ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {audienceResult.sampleRecipients.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-900">{r.name}</td>
                          <td className="p-3 text-slate-600">{r.role}</td>
                          <td className="p-3 font-mono text-xs text-slate-500">{r.email || r.phone || "উপস্থিত নেই"}</td>
                          <td className="p-3 text-slate-700">{r.studentNameBn || "N/A"}</td>
                          <td className="p-3 text-xs text-slate-500">{r.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: TEMPLATES CATALOG */}
        {/* ========================================================= */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">অনুমোদিত কমিউনিকেশন টেমপ্লেট ক্যাটালগ</h3>
                <p className="text-sm text-slate-500">
                  নিরাপদ স্যান্ডবক্সড ভ্যারিয়েবল ইন্টারপোলেশন ও ভার্সন কন্ট্রোলড হিস্ট্রি
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((tpl) => (
                <div
                  key={tpl.code}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold">
                        {tpl.code} (v{tpl.version})
                      </span>
                      <h4 className="font-bold text-slate-900 text-base mt-1">{tpl.nameBn}</h4>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-slate-100 rounded-full font-medium text-slate-600">
                      {tpl.category}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-2">
                    <div>
                      <strong className="text-slate-700">বিষয়:</strong> {tpl.subjectTemplateBn}
                    </div>
                    <div className="text-slate-600">
                      <strong className="text-slate-700">বডি:</strong> {tpl.bodyTemplateBn}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 pt-1">
                    <strong>অনুমোদিত ভ্যারিয়েবলস:</strong>{" "}
                    {tpl.allowedVariables?.map((v: string) => (
                      <span
                        key={v}
                        className="inline-block bg-slate-200/60 font-mono px-1.5 py-0.5 rounded mr-1 text-[11px]"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: SUPPRESSIONS & PREFERENCES */}
        {/* ========================================================= */}
        {activeTab === "suppressions" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                সাপ্রেশন তালিকায় অন্তর্ভুক্তি
              </h3>
              <form onSubmit={handleAddSuppression} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ইমেইল ঠিকানা *
                  </label>
                  <input
                    type="email"
                    required
                    value={newSuppressionEmail}
                    onChange={(e) => setNewSuppressionEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">কারণ</label>
                  <select
                    value={newSuppressionReason}
                    onChange={(e) => setNewSuppressionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="USER_UNSUBSCRIBE">ব্যবহারকারীর অনুরোধে আনসাবস্ক্রাইব</option>
                    <option value="BOUNCE_PERMANENT">স্থায়ী বাউন্স (Permanent Bounce)</option>
                    <option value="INVALID_ADDRESS">অকার্যকর ইমেইল ঠিকানা</option>
                    <option value="ADMIN_BLOCK">প্রশাসনিক ব্লক</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition text-sm shadow-sm"
                >
                  সাপ্রেশন তালিকায় যুক্ত করুন
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">সাপ্রেশন ও অপ্ট-আউট তালিকা ({suppressions.length})</h3>
                <span className="text-xs text-slate-400">স্প্যাম ও বাউন্স প্রতিরোধ সুরক্ষা</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="p-3">ইমেইল</th>
                      <th className="p-3">কারণ</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppressions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          কোনো সাপ্রেসড ঠিকানা নেই।
                        </td>
                      </tr>
                    ) : (
                      suppressions.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-slate-900">{s.email}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded text-xs font-semibold">
                              {s.reason}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-slate-500">
                            {new Date(s.suppressedAt).toLocaleDateString("bn-BD")}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={async () => {
                                await fetch(`/api/admin/communications/suppressions?email=${encodeURIComponent(s.email)}`, {
                                  method: "DELETE",
                                });
                                loadAllData();
                              }}
                              className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
                            >
                              রিমুভ
                            </button>
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

        {/* ========================================================= */}
        {/* TAB 6: DIGESTS */}
        {/* ========================================================= */}
        {activeTab === "digests" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">ইনস্টিটিউশনাল নোটিফিকেশন ডাইজেস্ট</h3>
              <p className="text-sm text-slate-500">
                বিজ্ঞপ্তি, অনুষ্ঠান ও গুরুত্বপূর্ণ একাডেমিক খবরের ভূমিকা ভিত্তিক সংকলন
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">দৈনিক সংবাদ ডাইজেস্ট (Daily Digest)</h4>
                    <p className="text-xs text-slate-500">গত ২৪ ঘণ্টার নোটিশ ও আপডেট</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  অভিভাবক ও শিক্ষকদের জন্য দিনের প্রধান নোটিশ এবং শিক্ষাবর্ষের প্রয়োজনীয় করণীয় কাজের
                  স্বয়ংক্রিয় সারসংক্ষেপ।
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleGenerateDigest("DAILY", false)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
                  >
                    ড্রাফট তৈরি করুন
                  </button>
                  <button
                    onClick={() => handleGenerateDigest("DAILY", true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                  >
                    তৈরি ও সরাসরি সম্প্রচার
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">সাপ্তাহিক বুলেটিন (Weekly Bulletin)</h4>
                    <p className="text-xs text-slate-500">গত ৭ দিনের প্রাতিষ্ঠানিক কার্যক্রম</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  সাপ্তাহিক পরীক্ষার ফলাফল, আসন্ন ওয়াজ মাহফিল বা ছুটির নোটিশ সমন্বিত পূর্ণাঙ্গ বুলেটিন।
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleGenerateDigest("WEEKLY", false)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
                  >
                    ড্রাফট তৈরি করুন
                  </button>
                  <button
                    onClick={() => handleGenerateDigest("WEEKLY", true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                  >
                    তৈরি ও সরাসরি সম্প্রচার
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: AI CAMPAIGN DRAFTER */}
        {/* ========================================================= */}
        {activeTab === "ai" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">এআই ক্যাম্পেইন ড্রাফটার</h3>
              </div>
              <p className="text-xs text-slate-500">
                Phase 21 এআই ইন্টেলিজেন্স দ্বারা প্রাতিষ্ঠানিক বার্তার মানসম্মত ড্রাফট তৈরি করুন।
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কমিউনিকেশনের ধরন বেছে নিন
                </label>
                <select
                  value={aiAction}
                  onChange={(e) => setAiAction(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="EXAM_ANNOUNCEMENT">আসন্ন পরীক্ষার রুটিন ও ঘোষণা</option>
                  <option value="FEE_REMINDER">মাসিক ফি পরিশোধের তাগিদপত্র</option>
                  <option value="EVENT_INVITATION">ওয়াজ মাহফিল ও আলোচনা সভার দাওয়াত</option>
                  <option value="ADMISSION_OPEN">নতুন শিক্ষাবর্ষে ভর্তি বিজ্ঞপ্তি</option>
                </select>
              </div>

              <button
                onClick={handleGenerateAiDraft}
                disabled={aiLoading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {aiLoading ? "ড্রাফট তৈরি হচ্ছে..." : "এআই ড্রাফট তৈরি করুন"}
              </button>
            </div>

            {aiDraftResult && (
              <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                  <span className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-1">
                    <Sparkles className="w-4 h-4" /> এআই কর্তৃক প্রস্তুতকৃত খসড়া
                  </span>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                    অনুমোদন আবশ্যক
                  </span>
                </div>

                <div>
                  <strong className="text-xs text-slate-700">প্রস্তাবিত বিষয়:</strong>
                  <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-semibold text-slate-900 mt-1">
                    {aiDraftResult.suggestedSubject}
                  </div>
                </div>

                <div>
                  <strong className="text-xs text-slate-700">প্রস্তাবিত বার্তা:</strong>
                  <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 whitespace-pre-line mt-1">
                    {aiDraftResult.suggestedBody}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  ⚠️ {aiDraftResult.disclaimerBn}
                </div>

                <button
                  onClick={() => {
                    setNewCampaign({
                      ...newCampaign,
                      subject: aiDraftResult.suggestedSubject,
                      body: aiDraftResult.suggestedBody,
                      audienceType: aiDraftResult.suggestedAudience,
                    });
                    setActiveTab("campaigns");
                    setSuccessMsg("এআই ড্রাফট ক্যাম্পেইন ফর্মে কপি করা হয়েছে!");
                  }}
                  className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                >
                  এই ড্রাফট দিয়ে ক্যাম্পেইন তৈরি করুন
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
