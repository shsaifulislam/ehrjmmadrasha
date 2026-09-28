"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Users,
  Laptop,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  Activity,
  UserX,
  Radio,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

interface SecurityStats {
  activeSessions: number;
  lockedAccounts: number;
  suspendedAccounts: number;
  openIncidents: number;
  recentHighRiskEvents: number;
}

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  timestamp: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  details?: Record<string, any>;
}

interface ActiveSessionItem {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
    email: string;
    status: string;
  };
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
}

interface IncidentItem {
  id: string;
  incidentCode: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  affectedService: string;
  detectedAt: string;
  resolvedAt?: string;
  events?: Array<{
    id: string;
    eventType: string;
    description: string;
    performedByName?: string;
    timestamp: string;
  }>;
}

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "accounts" | "events" | "incidents">("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SecurityStats>({
    activeSessions: 0,
    lockedAccounts: 0,
    suspendedAccounts: 0,
    openIncidents: 0,
    recentHighRiskEvents: 0,
  });
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [sessions, setSessions] = useState<ActiveSessionItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filters
  const [eventSeverityFilter, setEventSeverityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Action States
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [showCreateIncidentModal, setShowCreateIncidentModal] = useState(false);
  const [newIncidentTitle, setNewIncidentTitle] = useState("");
  const [newIncidentDesc, setNewIncidentDesc] = useState("");
  const [newIncidentSeverity, setNewIncidentSeverity] = useState("HIGH");
  const [actionLoading, setActionLoading] = useState(false);

  // Step-Up Suspend Modal
  const [suspendingUserId, setSuspendingUserId] = useState<string | null>(null);
  const [suspendPhrase, setSuspendPhrase] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      // 1. Fetch Overview & Events
      const ovRes = await fetch("/api/admin/security/overview");
      if (ovRes.ok) {
        const ovData = await ovRes.json();
        if (ovData.success) {
          setStats(ovData.data.stats);
          setEvents(ovData.data.recentEvents || []);
        }
      }

      // 2. Fetch Sessions
      const sessRes = await fetch("/api/admin/security/sessions");
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        if (sessData.success) {
          setSessions(sessData.data.sessions || []);
        }
      }

      // 3. Fetch Incidents
      const incRes = await fetch("/api/admin/security/incidents");
      if (incRes.ok) {
        const incData = await incRes.json();
        if (incData.success) {
          setIncidents(incData.data.incidents || []);
        }
      }
    } catch (err: any) {
      console.error("Failed to load security dashboard data:", err);
      setStatusMessage({ text: "নিরাপত্তা ডেটা লোড করতে ব্যর্থ হয়েছে।", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Revoke session handler
  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই সেশনটি বাতিল করতে চান? ব্যবহারকারী তাৎক্ষণিকভাবে লগআউট হবে।")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/security/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVOKE_SESSION", sessionId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ text: data.message, type: "success" });
        fetchData();
      } else {
        setStatusMessage({ text: data.error || "সেশন বাতিল ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch {
      setStatusMessage({ text: "সার্ভার সংযোগ ত্রুটি।", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke all user sessions handler
  const handleRevokeAllUserSessions = async (userId: string) => {
    if (!confirm("এই ব্যবহারকারীর সমস্ত সক্রিয় ডিভাইস ও সেশন কি অবিলম্বে বাতিল করতে চান?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/security/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVOKE_ALL_USER_SESSIONS", userId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ text: data.message, type: "success" });
        fetchData();
      } else {
        setStatusMessage({ text: data.error || "সেশন বাতিল ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch {
      setStatusMessage({ text: "সার্ভার সংযোগ ত্রুটি।", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Create Incident
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentTitle.trim() || !newIncidentDesc.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/security/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_INCIDENT",
          title: newIncidentTitle,
          description: newIncidentDesc,
          severity: newIncidentSeverity,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ text: data.message, type: "success" });
        setShowCreateIncidentModal(false);
        setNewIncidentTitle("");
        setNewIncidentDesc("");
        fetchData();
      } else {
        setStatusMessage({ text: data.error || "ইনসিডেন্ট তৈরি ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch {
      setStatusMessage({ text: "সার্ভার সংযোগ ত্রুটি।", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Transition Incident Status
  const handleUpdateIncidentStatus = async (incidentId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/security/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATUS",
          incidentId,
          newStatus,
          resolutionNotes: newStatus === "RESOLVED" ? "অ্যাডমিন কর্তৃক সমাধান নিশ্চিত করা হয়েছে।" : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ text: data.message, type: "success" });
        fetchData();
      } else {
        setStatusMessage({ text: data.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch {
      setStatusMessage({ text: "সার্ভার সংযোগ ত্রুটি।", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    if (eventSeverityFilter !== "ALL" && e.severity !== eventSeverityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchType = e.eventType.toLowerCase().includes(q);
      const matchUser = e.username?.toLowerCase().includes(q);
      const matchIp = e.ipAddress?.toLowerCase().includes(q);
      if (!matchType && !matchUser && !matchIp) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F9F8F3] pb-24 text-stone-800">
      {/* Top Banner / Navigation */}
      <header className="bg-[#0D5C3A] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="অ্যাডমিন ড্যাশবোর্ডে ফিরে যান"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-amber-300" />
                <h1 className="text-xl font-bold tracking-tight">নিরাপত্তা ও আইডেন্টিটি গভর্ন্যান্স সেন্টার</h1>
              </div>
              <p className="text-xs text-emerald-100">
                {INSTITUTION_INFO.nameBn} • জিরো-ট্রাস্ট সিকিউরিটি ও ইভেন্ট মনিটরিং
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-2 border-t border-emerald-800/60 pt-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-emerald-100 hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4" />
            ওভারভিউ
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === "sessions"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-emerald-100 hover:text-white"
            }`}
          >
            <Laptop className="w-4 h-4" />
            অ্যাক্টিভ সেশন ({stats.activeSessions})
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === "events"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-emerald-100 hover:text-white"
            }`}
          >
            <Radio className="w-4 h-4" />
            নিরাপত্তা ইভেন্ট লগ ({events.length})
          </button>
          <button
            onClick={() => setActiveTab("incidents")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === "incidents"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-emerald-100 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            ইনসিডেন্ট রেসপন্স ({stats.openIncidents})
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center justify-between border shadow-sm ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-center gap-3">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-stone-400 hover:text-stone-600 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">সক্রিয় সেশন</p>
                  <p className="text-2xl font-bold text-stone-900 mt-0.5">{stats.activeSessions}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">লকড অ্যাকাউন্ট</p>
                  <p className="text-2xl font-bold text-stone-900 mt-0.5">{stats.lockedAccounts}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-700">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">উন্মুক্ত ইনসিডেন্ট</p>
                  <p className="text-2xl font-bold text-stone-900 mt-0.5">{stats.openIncidents}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
                  <Radio className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">উচ্চ-ঝুঁকির ইভেন্ট</p>
                  <p className="text-2xl font-bold text-stone-900 mt-0.5">{stats.recentHighRiskEvents}</p>
                </div>
              </div>
            </div>

            {/* Zero-Trust Architecture Status Card */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-[#0D5C3A]" />
                  <div>
                    <h3 className="text-base font-bold text-stone-900">জিরো-ট্রাস্ট এনফোর্সমেন্ট স্ট্যাটাস</h3>
                    <p className="text-xs text-stone-500">অননুমোদিত ক্লায়েন্ট রিকোয়েস্ট ও আইডিওআর প্রতিরোধে সক্রিয় স্তরসমূহ</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                  সক্রিয় ও সুরক্ষিত
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <p className="text-xs font-bold text-stone-700">১. পরিচয় ও সেশন ভ্যালিডেশন</p>
                  <p className="text-xs text-stone-500 mt-1">
                    সার্ভার-সাইড টোকেন স্টেট ও ডাটাবেস সেশন ক্রস-চেক। তাৎক্ষণিক রিমোট রেভোকেশন সক্রিয়।
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <p className="text-xs font-bold text-stone-700">২. ভূমিকা ও রিসোর্স ওনারশিপ</p>
                  <p className="text-xs text-stone-500 mt-1">
                    অভিভাবক কেবলমাত্র ভেরিফায়েড সন্তান এবং উস্তাদ কেবলমাত্র নির্ধারিত ক্লাসে প্রবেশাধিকার পান।
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <p className="text-xs font-bold text-stone-700">৩. স্টেপ-আপ প্রোটেকশন</p>
                  <p className="text-xs text-stone-500 mt-1">
                    অ্যাকাউন্ট স্থগিত, রোল পরিবর্তন বা ডাটাবেস রিস্টোর অপারেশনে নির্দিষ্ট নিশ্চিতকরণ বাধ্যতামূলক।
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Events Feed Preview */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900">সাম্প্রতিক নিরাপত্তা ইভেন্ট ফিড</h3>
                  <p className="text-xs text-stone-500">স্বয়ংক্রিয় ব্রুট-ফোর্স, লগইন ও এক্সেস মনিটরিং</p>
                </div>
                <button
                  onClick={() => setActiveTab("events")}
                  className="text-xs font-bold text-[#0D5C3A] hover:underline"
                >
                  সকল ইভেন্ট দেখুন →
                </button>
              </div>
              <div className="divide-y divide-stone-100">
                {events.slice(0, 6).map((evt) => (
                  <div key={evt.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          evt.severity === "CRITICAL"
                            ? "bg-red-600"
                            : evt.severity === "HIGH"
                            ? "bg-amber-500"
                            : evt.severity === "MEDIUM"
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-bold text-stone-800">{evt.eventType}</p>
                        <p className="text-xs text-stone-500">
                          {evt.username || "অজ্ঞাত ব্যবহারকারী"} • আইপি: {evt.ipAddress || "১২৭.০.০.১"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-stone-400">
                      {new Date(evt.timestamp).toLocaleTimeString("bn-BD")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE SESSIONS */}
        {activeTab === "sessions" && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">সক্রিয় সেশন ও ডিভাইস মনিটরিং</h3>
                <p className="text-xs text-stone-500">
                  বর্তমানে লগইনকৃত সকল ডিভাইস, ব্রাউজার ও আইপি পর্যবেক্ষণ এবং একক/সম্মিলিত লগআউট
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-stone-100 text-stone-700 rounded-lg">
                মোট সেশন: {sessions.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-700">
                <thead className="bg-stone-50 text-xs text-stone-500 uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">ব্যবহারকারী</th>
                    <th className="py-3 px-4 font-semibold">ভূমিকা</th>
                    <th className="py-3 px-4 font-semibold">আইপি ঠিকানা</th>
                    <th className="py-3 px-4 font-semibold">ব্রাউজার / ডিভাইস</th>
                    <th className="py-3 px-4 font-semibold">লগইন সময়</th>
                    <th className="py-3 px-4 font-semibold text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400 text-sm">
                        কোনো সক্রিয় সেশন পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    sessions.map((sess) => (
                      <tr key={sess.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-stone-900">
                          {sess.user?.name || "ব্যবহারকারী"}
                          <span className="block text-xs text-stone-400 font-mono">@{sess.user?.username}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-700">
                            {sess.user?.role || "GUEST"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-stone-600">{sess.ipAddress}</td>
                        <td className="py-3.5 px-4 text-xs text-stone-500 max-w-xs truncate" title={sess.userAgent}>
                          {sess.userAgent}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-stone-500">
                          {new Date(sess.createdAt).toLocaleString("bn-BD")}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRevokeSession(sess.id)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
                              title="শুধুমাত্র এই ডিভাইসটি লগআউট করান"
                            >
                              সেশন বাতিল
                            </button>
                            <button
                              onClick={() => handleRevokeAllUserSessions(sess.userId)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 rounded border border-amber-200 transition-colors"
                              title="ব্যবহারকারীর সমস্ত ডিভাইস থেকে লগআউট করান"
                            >
                              সকল ডিভাইস বাতিল
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY EVENTS LOG */}
        {activeTab === "events" && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">সিকিউরিটি ইভেন্ট লগ (Audit & Telemetry)</h3>
                <p className="text-xs text-stone-500">
                  নিরাপত্তা ঘটনা, ব্যর্থ লগইন, রেভোকেশন ও অপব্যবহার শনাক্তকরণ রেকর্ড
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="অনুসন্ধান করুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600 w-48"
                  />
                </div>
                <select
                  value={eventSeverityFilter}
                  onChange={(e) => setEventSeverityFilter(e.target.value)}
                  className="text-xs rounded-lg border border-stone-200 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="ALL">সকল মাত্রা (All)</option>
                  <option value="CRITICAL">ক্রিটিক্যাল (CRITICAL)</option>
                  <option value="HIGH">উচ্চ (HIGH)</option>
                  <option value="MEDIUM">মাঝারি (MEDIUM)</option>
                  <option value="INFO">তথ্যমূলক (INFO)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-700">
                <thead className="bg-stone-50 text-xs text-stone-500 uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">ইভেন্ট আইডি</th>
                    <th className="py-3 px-4 font-semibold">ধরণ</th>
                    <th className="py-3 px-4 font-semibold">মাত্রা</th>
                    <th className="py-3 px-4 font-semibold">ব্যবহারকারী / আইপি</th>
                    <th className="py-3 px-4 font-semibold">রিসোর্স / বিবরণ</th>
                    <th className="py-3 px-4 font-semibold text-right">সময়কাল</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400 text-sm">
                        কোনো নিরাপত্তা ইভেন্ট রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-stone-900">{evt.id}</td>
                        <td className="py-3.5 px-4 font-medium text-stone-800">{evt.eventType}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              evt.severity === "CRITICAL"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : evt.severity === "HIGH"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : evt.severity === "MEDIUM"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {evt.severity}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-semibold text-stone-800">{evt.username || "SYSTEM"}</span>
                          <span className="block font-mono text-stone-400">{evt.ipAddress || "১২৭.০.০.১"}</span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-stone-500 max-w-sm truncate">
                          {evt.resource ? `${evt.resource} • ` : ""}
                          {evt.details ? JSON.stringify(evt.details) : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right text-xs text-stone-400">
                          {new Date(evt.timestamp).toLocaleString("bn-BD")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: INCIDENT MANAGEMENT */}
        {activeTab === "incidents" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">নিরাপত্তা ইনসিডেন্ট রেসপন্স ফ্রেমওয়ার্ক</h3>
                <p className="text-xs text-stone-500">
                  শনাক্তকরণ, প্রতিরোধ, তদন্ত ও রেজোলিউশন লাইফসাইকেল ট্র্যাকিং
                </p>
              </div>
              <button
                onClick={() => setShowCreateIncidentModal(true)}
                className="px-4 py-2 bg-[#0D5C3A] hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
              >
                + নতুন ইনসিডেন্ট নথিভুক্ত করুন
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incidents.length === 0 ? (
                <div className="col-span-2 bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-400">
                  বর্তমানে কোনো নিরাপত্তা ইনসিডেন্ট উন্মুক্ত নেই। সিস্টেম সুরক্ষিত।
                </div>
              ) : (
                incidents.map((inc) => (
                  <div key={inc.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-700 font-mono text-xs font-bold rounded">
                          {inc.incidentCode}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            inc.severity === "CRITICAL"
                              ? "bg-red-100 text-red-800"
                              : inc.severity === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          inc.status === "RESOLVED" || inc.status === "CLOSED"
                            ? "bg-emerald-100 text-emerald-800"
                            : inc.status === "INVESTIGATING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-stone-900">{inc.title}</h4>
                      <p className="text-xs text-stone-500 mt-1">{inc.description}</p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                      <span>শনাক্ত: {new Date(inc.detectedAt).toLocaleDateString("bn-BD")}</span>
                      <div className="flex items-center gap-2">
                        {inc.status !== "RESOLVED" && (
                          <button
                            onClick={() => handleUpdateIncidentStatus(inc.id, "RESOLVED")}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
                          >
                            সমাধান চিহ্নিত করুন
                          </button>
                        )}
                        {inc.status === "OPEN" && (
                          <button
                            onClick={() => handleUpdateIncidentStatus(inc.id, "INVESTIGATING")}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition-colors"
                          >
                            তদন্তাধীন
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modal: Create Incident */}
        {showCreateIncidentModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
              <div className="p-5 bg-[#0D5C3A] text-white flex items-center justify-between">
                <h3 className="text-base font-bold">নতুন নিরাপত্তা ইনসিডেন্ট নথিভুক্ত করুন</h3>
                <button
                  onClick={() => setShowCreateIncidentModal(false)}
                  className="text-emerald-100 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateIncident} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ইনসিডেন্ট শিরোনাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={newIncidentTitle}
                    onChange={(e) => setNewIncidentTitle(e.target.value)}
                    placeholder="যেমন: পুনরাবৃত্ত অস্বাভাবিক পাসওয়ার্ড ব্যর্থতা"
                    className="w-full p-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    গুরুত্ব মাত্রা (Severity) *
                  </label>
                  <select
                    value={newIncidentSeverity}
                    onChange={(e) => setNewIncidentSeverity(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  >
                    <option value="CRITICAL">P0/P1 - ক্রিটিক্যাল (CRITICAL)</option>
                    <option value="HIGH">P2 - উচ্চ (HIGH)</option>
                    <option value="MEDIUM">P3 - মাঝারি (MEDIUM)</option>
                    <option value="LOW">P4 - সাধারণ (LOW)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ঘটনার বিস্তারিত বিবরণ *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newIncidentDesc}
                    onChange={(e) => setNewIncidentDesc(e.target.value)}
                    placeholder="ইনসিডেন্টের প্রভাব, শনাক্তকৃত আইপি, ও প্রাথমিক পর্যবেক্ষণ লিপিবদ্ধ করুন..."
                    className="w-full p-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateIncidentModal(false)}
                    className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-[#0D5C3A] hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    ইনসিডেন্ট সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
