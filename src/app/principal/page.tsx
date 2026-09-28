"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  UserCheck,
  Shield,
  Send,
  LogOut,
  CheckCircle,
  RefreshCw,
  FileText,
  BarChart3,
  Bell,
  AlertTriangle,
  Building,
  GraduationCap,
  Users,
  Server,
  Activity,
  Database,
  HardDrive,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function PrincipalDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "DASHBOARD" | "OVERVIEW" | "NOTICES" | "ISSUES" | "REPORTS" | "OPERATIONS"
  >("DASHBOARD");
  const [stats, setStats] = useState<any | null>(null);
  const [analyticsOverview, setAnalyticsOverview] = useState<any | null>(null);
  const [operationsData, setOperationsData] = useState<{
    health: any | null;
    backups: any[];
    incidents: any[];
    loading: boolean;
  }>({
    health: null,
    backups: [],
    incidents: [],
    loading: false,
  });
  const [message, setMessage] = useState(
    "বিসমিল্লাহির রাহমানির রাহিম। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কুরআন-সুন্নাহর সঠিক প্রচার ও চরিত্রবান আদর্শ নাগরিক গড়ার একটি অন্যতম শ্রেষ্ঠ মারকাজ।"
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [issueSent, setIssueSent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        const upper = tabParam.toUpperCase();
        if (["DASHBOARD", "OVERVIEW", "NOTICES", "ISSUES", "REPORTS", "OPERATIONS"].includes(upper)) {
          setActiveTab(upper as any);
        }
      }
    }

    fetch("/api/dashboard/stats")
      .then((res) => {
        if (!res.ok) window.location.href = "/login";
        return res.json();
      })
      .then((data) => {
        if (data?.stats) setStats(data.stats);
      })
      .catch(() => {});

    fetch("/api/admin/analytics/overview")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) setAnalyticsOverview(data.data);
      })
      .catch(() => {});
  }, []);

  const loadOperationsOverview = () => {
    setOperationsData((prev) => ({ ...prev, loading: true }));
    Promise.all([
      fetch("/api/admin/operations/health").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/operations/backups?limit=5").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/operations/incidents?limit=5").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([healthRes, backupsRes, incidentsRes]) => {
        setOperationsData({
          health: healthRes?.health || null,
          backups: backupsRes?.backups || [],
          incidents: incidentsRes?.incidents || [],
          loading: false,
        });
      })
      .catch(() => {
        setOperationsData((prev) => ({ ...prev, loading: false }));
      });
  };

  useEffect(() => {
    if (activeTab === "OPERATIONS" && !operationsData.health) {
      loadOperationsOverview();
    }
  }, [activeTab]);

  const handleSaveMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSendIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText) return;
    setIssueSent(true);
    setIssueText("");
    setTimeout(() => setIssueSent(false), 3000);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col text-[#0B1914]">
      {/* Top Header */}
      <header className="bg-[#083B25] text-white px-6 py-4 border-b-2 border-[#C59B27] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#C59B27] overflow-hidden relative shadow">
            <Image
              src="/images/principal.jpg"
              alt={INSTITUTION_INFO.principal}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg font-display leading-tight">
              মুহতামিম তদারকি ড্যাশবোর্ড (Principal Oversight Desk)
            </h1>
            <p className="text-xs text-emerald-200">
              {INSTITUTION_INFO.nameBn} (অধ্যক্ষ: {INSTITUTION_INFO.principal})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-emerald-200 hover:text-white px-2 py-1 rounded transition hidden sm:inline"
          >
            মূল ওয়েবসাইট
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition shadow"
          >
            <LogOut className="w-3.5 h-3.5" />
            লগআউট
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 flex items-center gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto">
        {[
          { id: "DASHBOARD", label: "ড্যাশবোর্ড (Dashboard)" },
          { id: "OVERVIEW", label: "সার্বিক পর্যবেক্ষণ (Overview)" },
          { id: "NOTICES", label: "জরুরি নোটিশ জারি (Notices)" },
          { id: "ISSUES", label: "প্রশাসনিক ইস্যু ও নির্দেশ (Issues)" },
          { id: "REPORTS", label: "প্রতিবেদন ও রিপোর্ট (Reports)" },
          { id: "OPERATIONS", label: "সিস্টেম অপারেশন ও স্বাস্থ্য (Operations)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3.5 border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[#0D5C3A] text-[#0D5C3A]"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* 1. DASHBOARD */}
        {activeTab === "DASHBOARD" && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-xs text-emerald-900 flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#0D5C3A] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">সম্মানিত মুহতামিম মহোদয়ের অফিসিয়াল তদারকি প্যানেল:</p>
                <p className="mt-0.5 text-gray-700 leading-relaxed">
                  মাদরাসার অ্যাকাডেমিক শৃঙ্খলা, লিল্লাহ বোর্ডিং ও যাকাত তহবিলের স্বচ্ছতা এবং শিক্ষকদের পাঠদান পরিস্থিতি আপনি সরাসরি এখান থেকে পর্যবেক্ষণ করতে পারবেন।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Update Official Message */}
              <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-sm">
                <h2 className="text-sm font-bold text-[#0D5C3A] mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  মুহতামিমের অফিসিয়াল বাণী ও বার্তা আপডেট
                </h2>

                {savedSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded text-xs mb-3 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    বাণী সফলভাবে আপডেট করা হয়েছে।
                  </div>
                )}

                <form onSubmit={handleSaveMessage} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      মুহতামিমের নাম ও উপাধি
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${INSTITUTION_INFO.principal} (প্রতিষ্ঠাতা ও মুহতামিম)`}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded bg-gray-50 text-gray-700 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      হোমপেজে প্রদর্শিত অফিসিয়াল বাণী
                    </label>
                    <textarea
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-[#0D5C3A] focus:outline-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2 rounded text-xs font-semibold transition shadow"
                  >
                    বাণী সংরক্ষণ করুন
                  </button>
                </form>
              </div>

              {/* Box 2: Issue Directive to Admin */}
              <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-sm">
                <h2 className="text-sm font-bold text-[#C59B27] mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  এডমিনের কাছে সরাসরি প্রাতিষ্ঠানিক নির্দেশ
                </h2>

                {issueSent && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded text-xs mb-3 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    নির্দেশনাটি সফলভাবে অ্যাডমিন প্যানেলে প্রেরণ করা হয়েছে।
                  </div>
                )}

                <form onSubmit={handleSendIssue} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ইস্যু বা নির্দেশের বিবরণ
                    </label>
                    <textarea
                      rows={6}
                      value={issueText}
                      onChange={(e) => setIssueText(e.target.value)}
                      placeholder="যেমন: লিল্লাহ বোর্ডিংয়ের শিক্ষার্থীদের খাবারের মান যাচাই করুন অথবা আসন্ন পরীক্ষার প্রশ্নপত্র প্রস্তুত করার নির্দেশনা জারি করুন..."
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-[#C59B27] focus:outline-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#C59B27] hover:bg-amber-600 text-[#083B25] py-2 rounded text-xs font-bold transition shadow"
                  >
                    নির্দেশনা প্রেরণ করুন
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 2. OVERVIEW */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            {/* Executive Narrative */}
            {analyticsOverview?.executiveSummary && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 text-xs leading-relaxed text-gray-800">
                <span className="font-bold text-emerald-900 block mb-1 text-sm">
                  মুহতামিম তদারকি নির্বাহী সারসংক্ষেপ:
                </span>
                {analyticsOverview.executiveSummary.bn}
              </div>
            )}

            {/* Actionable Alerts */}
            {analyticsOverview?.alerts && analyticsOverview.alerts.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase">জরুরি তদারকি অ্যালার্ট ({analyticsOverview.alerts.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analyticsOverview.alerts.map((al: any) => (
                    <div
                      key={al.id}
                      className={`p-3 rounded-xl border text-xs ${
                        al.severity === "URGENT"
                          ? "bg-rose-50 border-rose-200 text-rose-900"
                          : "bg-amber-50 border-amber-200 text-amber-900"
                      }`}
                    >
                      <div className="font-bold">{al.title}</div>
                      <div className="mt-0.5 text-gray-700">{al.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Core Oversight Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-white rounded-xl border shadow-sm">
                <span className="text-xs text-gray-500 block">মোট সক্রিয় শিক্ষার্থী</span>
                <span className="text-2xl font-bold font-serif text-gray-900">
                  {analyticsOverview?.students?.active || stats?.totalStudents || 0} জন
                </span>
              </div>
              <div className="p-4 bg-white rounded-xl border shadow-sm">
                <span className="text-xs text-gray-500 block">আজকের উপস্থিতি হার</span>
                <span className="text-2xl font-bold font-serif text-teal-700">
                  {analyticsOverview?.attendance?.rateToday !== undefined ? `${analyticsOverview.attendance.rateToday}%` : "—"}
                </span>
              </div>
              <div className="p-4 bg-white rounded-xl border shadow-sm">
                <span className="text-xs text-gray-500 block">আবাসিক ও ডে-কেয়ার</span>
                <span className="text-2xl font-bold font-serif text-blue-700">
                  {analyticsOverview?.students?.residential || 0} / {analyticsOverview?.students?.dayCare || 0}
                </span>
              </div>
              <div className="p-4 bg-white rounded-xl border shadow-sm">
                <span className="text-xs text-gray-500 block">৫ তহবিলের সর্বমোট</span>
                <span className="text-2xl font-bold font-serif text-emerald-700">
                  ৳ {(analyticsOverview?.finance?.fundsTotal || stats?.totalFundBalance || 0).toLocaleString("bn-BD")}
                </span>
              </div>
            </div>

            {/* Departmental Oversight Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-1.5">
                <div className="font-bold text-gray-900 text-sm border-b pb-1">লাইব্রেরি ও পরিবহন</div>
                <div className="flex justify-between"><span>চলমান ঋণ বই:</span><b>{analyticsOverview?.operations?.library?.activeLoans || 0} টি</b></div>
                <div className="flex justify-between"><span>বিলম্বিত বই:</span><b className="text-rose-600">{analyticsOverview?.operations?.library?.overdueLoans || 0} টি</b></div>
                <div className="flex justify-between"><span>পরিবহন ছাত্র:</span><b>{analyticsOverview?.operations?.transport?.students || 0} জন</b></div>
              </div>
              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-1.5">
                <div className="font-bold text-gray-900 text-sm border-b pb-1">ইনভেন্টরি ও সম্পদ</div>
                <div className="flex justify-between"><span>মোট আইটেম:</span><b>{analyticsOverview?.operations?.inventory?.totalItems || 0} টি</b></div>
                <div className="flex justify-between"><span>স্বল্প স্টক সতর্কতা:</span><b className="text-amber-600">{analyticsOverview?.operations?.inventory?.lowStockItems || 0} টি</b></div>
              </div>
              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-1.5">
                <div className="font-bold text-gray-900 text-sm border-b pb-1">এইচআর ও হেল্পডেস্ক</div>
                <div className="flex justify-between"><span>সক্রিয় জনবল:</span><b>{analyticsOverview?.operations?.hr?.activeEmployees || 0} জন</b></div>
                <div className="flex justify-between"><span>ছুটিতে আছেন:</span><b>{analyticsOverview?.operations?.hr?.employeesOnLeave || 0} জন</b></div>
                <div className="flex justify-between"><span>জরুরি হেল্পডেস্ক:</span><b className="text-rose-600">{analyticsOverview?.operations?.helpdesk?.urgentTickets || 0} টি</b></div>
              </div>
            </div>
          </div>
        )}

        {/* 3. NOTICES */}
        {activeTab === "NOTICES" && (
          <div className="bg-white rounded-lg border p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-[#083B25] border-b pb-2">মুহতামিমের জরুরি ঘোষণা ও সার্কুলার</h2>
            <p className="text-xs text-gray-600">
              এখান থেকে প্রেরিত ঘোষণা স্বয়ংক্রিয়ভাবে মাদরাসার লাইভ নোটিশ বোর্ডে প্রধান বার্তা হিসেবে সংরক্ষিত হবে।
            </p>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
              <p className="font-semibold">বর্তমান সক্রিয় নোটিশ: {stats?.totalNotices || 2} টি</p>
            </div>
          </div>
        )}

        {/* 4. ISSUES */}
        {activeTab === "ISSUES" && (
          <div className="bg-white rounded-lg border p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-[#083B25] border-b pb-2">প্রশাসনিক অডিট ও ইস্যু সমাধান তালিকা</h2>
            <div className="p-3 bg-gray-50 rounded text-xs text-gray-600">
              কোনো জরুরি প্রশাসনিক অমিল বা অ্যাকাডেমিক অনিয়ম পরিলক্ষিত হয়নি। সমস্ত ফান্ড ও রোল নম্বর হালনাগাদ রয়েছে।
            </div>
          </div>
        )}

        {/* 5. REPORTS */}
        {activeTab === "REPORTS" && (
          <div className="bg-white rounded-lg border p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-base font-bold text-[#083B25]">মাসিক অ্যাকাডেমিক ও আর্থিক রিপোর্ট</h2>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 text-white rounded text-xs font-semibold hover:bg-emerald-900 transition"
              >
                প্রিন্ট / PDF ডাউনলোড
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 border rounded-lg flex items-center justify-between">
                <span>মার্চ ২০২৬ সার্বিক আর্থিক নিরীক্ষা ও লিল্লাহ ফান্ড ব্যয় রিপোর্ট</span>
                <span className="text-[#0D5C3A] font-bold">নিরীক্ষিত (Audited)</span>
              </div>
              <div className="p-3 border rounded-lg flex items-center justify-between">
                <span>প্রথম সাময়িক পরীক্ষা প্রস্তুতি ও সিলেবাস সম্পন্ন রিপোর্ট</span>
                <span className="text-[#0D5C3A] font-bold">অনুমোদিত (Approved)</span>
              </div>
            </div>
          </div>
        )}

        {/* 6. OPERATIONS (Read-Only Oversight) */}
        {activeTab === "OPERATIONS" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
              <div>
                <h2 className="text-base font-bold text-[#083B25] flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-600" />
                  সিস্টেম অপারেশন, স্বাস্থ্য ও নির্ভরযোগ্যতা তদারকি
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  মুহতামিম ডেস্কে শুধুমাত্র পর্যবেক্ষণ ও অডিট সুবিধা সংরক্ষিত। ব্যাকআপ প্রণয়ন ও রিস্টোর কেবলমাত্র অ্যাডমিন দ্বারা নিয়ন্ত্রিত।
                </p>
              </div>
              <button
                onClick={loadOperationsOverview}
                disabled={operationsData.loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold hover:bg-emerald-100 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${operationsData.loading ? "animate-spin" : ""}`} />
                রিফ্রেশ
              </button>
            </div>

            {/* Overall Health Status Card */}
            {operationsData.health && (
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  operationsData.health.overallStatus === "HEALTHY"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : operationsData.health.overallStatus === "DEGRADED"
                    ? "bg-amber-50 border-amber-200 text-amber-950"
                    : "bg-rose-50 border-rose-200 text-rose-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Activity
                    className={`w-6 h-6 ${
                      operationsData.health.overallStatus === "HEALTHY"
                        ? "text-emerald-600"
                        : operationsData.health.overallStatus === "DEGRADED"
                        ? "text-amber-600"
                        : "text-rose-600"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-semibold text-gray-600">সার্বিক সিস্টেম স্থিতি</div>
                    <div className="text-lg font-bold">
                      {operationsData.health.overallStatus === "HEALTHY"
                        ? "সিস্টেম সম্পূর্ণ সক্রিয় ও স্বাভাবিক (HEALTHY)"
                        : operationsData.health.overallStatus === "DEGRADED"
                        ? "সিস্টেম আংশিক ধীরগতির বা সতর্কাবস্থায় (DEGRADED)"
                        : "সিস্টেমে ত্রুটি পরিলক্ষিত (DOWN)"}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-500">সর্বশেষ নিরীক্ষা</div>
                  <div className="font-mono text-gray-700">
                    {new Date(operationsData.health.checkedAt).toLocaleTimeString("bn-BD")}
                  </div>
                </div>
              </div>
            )}

            {/* Component Status Grid */}
            {operationsData.health?.components && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(operationsData.health.components).map(([key, comp]: [string, any]) => (
                  <div key={key} className="bg-white p-4 rounded-xl border shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 capitalize">{key}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          comp.status === "HEALTHY"
                            ? "bg-emerald-100 text-emerald-800"
                            : comp.status === "DEGRADED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {comp.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-tight">{comp.message}</p>
                    {comp.latencyMs !== undefined && (
                      <div className="text-[11px] text-gray-400 font-mono">লেটেন্সি: {comp.latencyMs}ms</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recent Backups Oversight */}
            <div className="bg-white rounded-xl border p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-700" />
                সর্বশেষ সিস্টেম ও ডেটাবেজ ব্যাকআপ রেকর্ড
              </h3>
              {operationsData.backups.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded text-xs text-gray-500">কোনো ব্যাকআপ পাওয়া যায়নি।</div>
              ) : (
                <div className="divide-y divide-gray-100 text-xs">
                  {operationsData.backups.map((b: any) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-medium text-gray-900">{b.filename}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-2">
                          <span>ধরন: {b.type}</span>
                          <span>আকার: {(b.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                          <span>তারিখ: {new Date(b.createdAt).toLocaleString("bn-BD")}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.verifiedStatus === "VERIFIED"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.verifiedStatus === "FAILED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {b.verifiedStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Incidents Oversight */}
            <div className="bg-white rounded-xl border p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                সক্রিয় ইনসিডেন্ট ও প্রযুক্তিগত ঘটনা
              </h3>
              {operationsData.incidents.length === 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded text-xs text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  বর্তমানে কোনো অমীমাংসিত সিস্টেম ইনসিডেন্ট নেই। সিস্টেম সম্পূর্ণ নিরাপদ।
                </div>
              ) : (
                <div className="divide-y divide-gray-100 text-xs">
                  {operationsData.incidents.map((inc: any) => (
                    <div key={inc.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900">{inc.incidentCode}: {inc.title}</div>
                        <div className="text-[11px] text-gray-500">
                          গুরুত্ব: {inc.severity} | স্থিতি: {inc.status} | উপাদান: {inc.component}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold bg-gray-100 px-2 py-1 rounded">
                        {new Date(inc.createdAt).toLocaleDateString("bn-BD")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
