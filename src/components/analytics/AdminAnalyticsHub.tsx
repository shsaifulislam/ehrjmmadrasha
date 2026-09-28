"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Users,
  GraduationCap,
  Calendar,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Printer,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Home,
  Truck,
  Package,
  UserCheck,
  LifeBuoy,
  ChevronRight,
  Save,
  Trash2,
  Copy,
  Info,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function AdminAnalyticsHub() {
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "STUDENTS" | "ATTENDANCE_RESULTS" | "FINANCE" | "OPERATIONS" | "COMPARISON" | "REPORTS"
  >("OVERVIEW");

  // Filters
  const [dateFilter, setDateFilter] = useState("THIS_MONTH");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [overviewData, setOverviewData] = useState<any>(null);
  const [studentsData, setStudentsData] = useState<any>(null);
  const [admissionData, setAdmissionData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [academicData, setAcademicData] = useState<any>(null);
  const [financeData, setFinanceData] = useState<any>(null);
  const [operationsData, setOperationsData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);

  // Comparison filter
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionA, setSessionA] = useState("");
  const [sessionB, setSessionB] = useState("");

  // Report Builder State
  const [builderModule, setBuilderModule] = useState("STUDENTS");
  const [builderResult, setBuilderResult] = useState<any>(null);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Fetch overview on filter change
  useEffect(() => {
    fetchOverview();
  }, [dateFilter]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (activeTab === "STUDENTS") {
      fetchStudentsAndAdmissions();
    } else if (activeTab === "ATTENDANCE_RESULTS") {
      fetchAttendanceAndAcademic();
    } else if (activeTab === "FINANCE") {
      fetchFinance();
    } else if (activeTab === "OPERATIONS") {
      fetchOperations();
    } else if (activeTab === "COMPARISON") {
      fetchSessionsList();
    } else if (activeTab === "REPORTS") {
      fetchSavedReports();
    }
  }, [activeTab, dateFilter]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/analytics/overview?filter=${dateFilter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ডাটা লোড করতে ব্যর্থ");
      setOverviewData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsAndAdmissions = async () => {
    try {
      const [stRes, admRes] = await Promise.all([
        fetch("/api/admin/analytics/students"),
        fetch("/api/admin/analytics/admissions"),
      ]);
      const stData = await stRes.json();
      const admData = await admRes.json();
      if (stData.success) setStudentsData(stData.data);
      if (admData.success) setAdmissionData(admData.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceAndAcademic = async () => {
    try {
      const [attRes, acadRes] = await Promise.all([
        fetch("/api/admin/analytics/attendance"),
        fetch("/api/admin/analytics/academic"),
      ]);
      const attData = await attRes.json();
      const acadData = await acadRes.json();
      if (attData.success) setAttendanceData(attData.data);
      if (acadData.success) setAcademicData(acadData.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFinance = async () => {
    try {
      const res = await fetch(`/api/admin/analytics/finance?filter=${dateFilter}`);
      const data = await res.json();
      if (data.success) setFinanceData(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOperations = async () => {
    try {
      const res = await fetch("/api/admin/analytics/operations");
      const data = await res.json();
      if (data.success) setOperationsData(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessionsList = async () => {
    try {
      const res = await fetch("/api/admin/academic/sessions");
      const data = await res.json();
      if (data.sessions && data.sessions.length > 0) {
        setSessions(data.sessions);
        if (!sessionA) setSessionA(data.sessions[0].id);
        if (!sessionB && data.sessions.length > 1) setSessionB(data.sessions[1].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunComparison = async () => {
    if (!sessionA || !sessionB) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics/comparison?sessionAId=${sessionA}&sessionBId=${sessionB}`);
      const data = await res.json();
      if (data.success) setComparisonData(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedReports = async () => {
    try {
      const res = await fetch("/api/admin/analytics/reports/saved");
      const data = await res.json();
      if (data.success) setSavedReports(data.reports);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteBuilder = async () => {
    try {
      setBuilderLoading(true);
      const res = await fetch("/api/admin/analytics/reports/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: builderModule }),
      });
      const data = await res.json();
      if (data.success) setBuilderResult(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setBuilderLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!saveTitle) return;
    try {
      const res = await fetch("/api/admin/analytics/reports/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: saveTitle,
          module: builderModule,
          reportType: "SUMMARY",
          filtersJson: JSON.stringify({ module: builderModule, dateFilter }),
          isPublic: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowSaveModal(false);
        setSaveTitle("");
        fetchSavedReports();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSavedReport = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই রিপোর্টটি মুছে ফেলতে চান?")) return;
    try {
      await fetch(`/api/admin/analytics/reports/saved/${id}`, { method: "DELETE" });
      fetchSavedReports();
    } catch (err) {
      console.error(err);
    }
  };

  const copyExecutiveSummary = () => {
    if (overviewData?.executiveSummary?.bn) {
      navigator.clipboard.writeText(overviewData.executiveSummary.bn);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-900 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-800 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              ফেজ ১৫: ম্যানেজমেন্ট ড্যাশবোর্ড
            </span>
            <span className="text-emerald-300 text-xs">রিয়েল-টাইম এনালাইটিক্স ও রিপোর্ট</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif">
            অ্যাডভান্সড ড্যাশবোর্ড ও ম্যানেজমেন্ট রিপোর্টিং
          </h1>
          <p className="text-emerald-100 text-sm mt-1">
            {INSTITUTION_INFO.nameBn} — প্রতিষ্ঠানটির সকল কার্যক্রমের সমন্বিত তথ্য পর্যালোচনা ও সিদ্ধান্ত গ্রহণ
          </p>
        </div>

        {/* Global Date Filter Controls */}
        <div className="flex items-center gap-2 bg-emerald-950/60 p-2 rounded-xl border border-emerald-700/50">
          <Filter className="w-4 h-4 text-emerald-300" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-emerald-900 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 border border-emerald-700"
          >
            <option value="ALL_TIME">সর্বকালের তথ্য</option>
            <option value="TODAY">আজকের তথ্য</option>
            <option value="YESTERDAY">গতকালের তথ্য</option>
            <option value="THIS_WEEK">চলতি সপ্তাহ (৭ দিন)</option>
            <option value="THIS_MONTH">চলতি মাস</option>
            <option value="PREVIOUS_MONTH">গত মাস</option>
          </select>
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="p-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 rounded-lg transition"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {[
          { id: "OVERVIEW", label: "ওভারভিউ", icon: BarChart3 },
          { id: "STUDENTS", label: "শিক্ষার্থী ও ভর্তি", icon: Users },
          { id: "ATTENDANCE_RESULTS", label: "হাজিরা ও ফলাফল", icon: GraduationCap },
          { id: "FINANCE", label: "অর্থ ও ৫ তহবিল", icon: Wallet },
          { id: "OPERATIONS", label: "প্রাতিষ্ঠানিক কার্যক্রম", icon: Package },
          { id: "COMPARISON", label: "শিক্ষাবর্ষ তুলনা", icon: TrendingUp },
          { id: "REPORTS", label: "রিপোর্ট ও প্রিন্ট", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Executive Summary Narrative Card */}
          {overviewData?.executiveSummary && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <span>এক্সিকিউটিভ সামারি ও প্রাতিষ্ঠানিক প্রতিবেদন</span>
                </div>
                <button
                  onClick={copyExecutiveSummary}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-lg transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedSummary ? "কপি হয়েছে!" : "কপি করুন"}
                </button>
              </div>
              <p className="text-gray-800 text-sm leading-relaxed font-sans">
                {overviewData.executiveSummary.bn}
              </p>
            </div>
          )}

          {/* Actionable Alerts Banner */}
          {overviewData?.alerts && overviewData.alerts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                জরুরি নোটিফিকেশন ও অ্যালার্ট ({overviewData.alerts.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {overviewData.alerts.map((al: any) => {
                  const isUrgent = al.severity === "URGENT";
                  const isWarning = al.severity === "WARNING";
                  return (
                    <div
                      key={al.id}
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                        isUrgent
                          ? "bg-rose-50 border-rose-200 text-rose-900"
                          : isWarning
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-blue-50 border-blue-200 text-blue-900"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isUrgent ? "bg-rose-600" : isWarning ? "bg-amber-600" : "bg-blue-600"
                            }`}
                          />
                          {al.title}
                        </div>
                        <p className="text-xs mt-1 text-gray-700">{al.description}</p>
                      </div>
                      <Link
                        href={al.actionUrl}
                        className="text-xs font-semibold underline shrink-0 hover:opacity-80"
                      >
                        পদক্ষেপ নিন
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Core KPI Cards with Direct Drill-Down Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* 1. Active Students */}
            <Link
              href="/admin/students"
              className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-emerald-600 transition group"
            >
              <div className="flex items-center justify-between text-gray-500 text-xs">
                <span>সক্রিয় শিক্ষার্থী</span>
                <Users className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2 font-serif">
                {overviewData ? overviewData.students.active.toLocaleString("bn-BD") : "—"}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span>মোট: {overviewData?.students.total || 0}</span>
                <ChevronRight className="w-3 h-3 text-emerald-600 ml-auto" />
              </div>
            </Link>

            {/* 2. Admission Conversion */}
            <Link
              href="/admin/admissions"
              className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-600 transition group"
            >
              <div className="flex items-center justify-between text-gray-500 text-xs">
                <span>ভর্তি রূপান্তর হার</span>
                <CheckCircle className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2 font-serif">
                {overviewData ? `${overviewData.admissions.conversionRate}%` : "—"}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span>আবেদন: {overviewData?.admissions.total || 0}</span>
                <ChevronRight className="w-3 h-3 text-blue-600 ml-auto" />
              </div>
            </Link>

            {/* 3. Today's Attendance */}
            <Link
              href="/admin/attendance"
              className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-teal-600 transition group"
            >
              <div className="flex items-center justify-between text-gray-500 text-xs">
                <span>আজকের উপস্থিতি</span>
                <UserCheck className="w-4 h-4 text-teal-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2 font-serif">
                {overviewData ? `${overviewData.attendance.rateToday}%` : "—"}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span>উপস্থিত: {overviewData?.attendance.presentToday || 0}</span>
                <ChevronRight className="w-3 h-3 text-teal-600 ml-auto" />
              </div>
            </Link>

            {/* 4. Pass Rate */}
            <Link
              href="/admin/exams"
              className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-indigo-600 transition group"
            >
              <div className="flex items-center justify-between text-gray-500 text-xs">
                <span>গড় পাশের হার</span>
                <GraduationCap className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2 font-serif">
                {overviewData ? `${overviewData.academics.passRate}%` : "—"}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span>মুমতাজ: {overviewData?.academics.mumtazCount || 0}</span>
                <ChevronRight className="w-3 h-3 text-indigo-600 ml-auto" />
              </div>
            </Link>

            {/* 5. Collections */}
            <Link
              href="/admin/finance"
              className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-amber-600 transition group"
            >
              <div className="flex items-center justify-between text-gray-500 text-xs">
                <span>মোট আদায় (কালেকশন)</span>
                <Wallet className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2 font-serif">
                ৳{overviewData ? (overviewData.finance.totalCollections / 1000).toFixed(1) + "k" : "—"}
              </div>
              <div className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                <span>বকেয়া: ৳{(overviewData?.finance.totalOutstanding || 0).toLocaleString("bn-BD")}</span>
                <ChevronRight className="w-3 h-3 ml-auto" />
              </div>
            </Link>

            {/* 6. Total Funds Balance */}
            <Link
              href="/admin/finance"
              className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-emerald-600 transition group"
            >
              <div className="flex items-center justify-between text-gray-500 text-xs">
                <span>৫ তহবিলের ব্যালেন্স</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2 font-serif">
                ৳{overviewData ? (overviewData.finance.fundsTotal / 1000).toFixed(1) + "k" : "—"}
              </div>
              <div className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
                <span>সাধারণ, যাকাত, লিল্লাহ</span>
                <ChevronRight className="w-3 h-3 ml-auto" />
              </div>
            </Link>
          </div>

          {/* Secondary Operational Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Library Overview */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" /> লাইব্রেরি সার্কুলেশন
                </span>
                <Link href="/admin/library" className="text-xs text-emerald-700 hover:underline">
                  বিস্তারিত
                </Link>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                <span className="text-gray-500">মোট বই ও কপি:</span>
                <span className="font-bold text-gray-800">
                  {overviewData?.operations?.library?.totalBooks || 0} টি ({overviewData?.operations?.library?.totalCopies || 0})
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                <span className="text-gray-500">চালু ঋণ (ধার দেওয়া):</span>
                <span className="font-semibold text-blue-700">{overviewData?.operations?.library?.activeLoans || 0} টি</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1">
                <span className="text-gray-500">মেয়াদোত্তীর্ণ (বিলম্বিত):</span>
                <span className="font-semibold text-rose-600">{overviewData?.operations?.library?.overdueLoans || 0} টি</span>
              </div>
            </div>

            {/* Residential Hostel */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-emerald-600" /> ছাত্রাবাস ও আবাসন
                </span>
                <Link href="/admin/hostel" className="text-xs text-emerald-700 hover:underline">
                  বিস্তারিত
                </Link>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                <span className="text-gray-500">আবাসিক শিক্ষার্থী:</span>
                <span className="font-bold text-emerald-700">{overviewData?.students?.residential || 0} জন</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                <span className="text-gray-500">ডে-কেয়ার শিক্ষার্থী:</span>
                <span className="font-semibold text-blue-700">{overviewData?.students?.dayCare || 0} জন</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1">
                <span className="text-gray-500">অনাবাসিক শিক্ষার্থী:</span>
                <span className="font-semibold text-gray-700">{overviewData?.students?.nonResidential || 0} জন</span>
              </div>
            </div>

            {/* Transport & Inventory */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" /> পরিবহন ও ইনভেন্টরি
                </span>
                <Link href="/admin/transport" className="text-xs text-emerald-700 hover:underline">
                  বিস্তারিত
                </Link>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                <span className="text-gray-500">পরিবহন রুট ও শিক্ষার্থী:</span>
                <span className="font-bold text-gray-800">
                  {overviewData?.operations?.transport?.routes || 0} রুট ({overviewData?.operations?.transport?.students || 0} জন)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                <span className="text-gray-500">মোট ইনভেন্টরি আইটেম:</span>
                <span className="font-semibold text-gray-800">{overviewData?.operations?.inventory?.totalItems || 0} টি</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1">
                <span className="text-gray-500">স্বল্প স্টক সতর্কতা:</span>
                <span className="font-semibold text-amber-600">{overviewData?.operations?.inventory?.lowStockItems || 0} টি</span>
              </div>
            </div>

            {/* HR & Helpdesk */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                  <LifeBuoy className="w-4 h-4 text-emerald-600" /> এইচআর ও হেল্পডেস্ক
                </span>
                <Link href="/admin/helpdesk" className="text-xs text-emerald-700 hover:underline">
                  বিস্তারিত
                </Link>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                <span className="text-gray-500">সক্রিয় জনবল (এইচআর):</span>
                <span className="font-bold text-gray-800">{overviewData?.operations?.hr?.activeEmployees || 0} জন</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                <span className="text-gray-500">ছুটিতে রয়েছেন:</span>
                <span className="font-semibold text-gray-700">{overviewData?.operations?.hr?.employeesOnLeave || 0} জন</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1">
                <span className="text-gray-500">উন্মুক্ত হেল্পডেস্ক টিকিট:</span>
                <span className="font-semibold text-rose-600">
                  {overviewData?.operations?.helpdesk?.openTickets || 0} টি (জরুরি: {overviewData?.operations?.helpdesk?.urgentTickets || 0})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS & ADMISSIONS */}
      {activeTab === "STUDENTS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student Demographics */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="font-bold text-gray-900 text-base border-b pb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" /> শিক্ষার্থী বিন্যাস
              </h2>
              {studentsData ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">মোট নিবন্ধিত:</span>
                    <span className="font-bold text-gray-900">{studentsData.totalStudents} জন</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">সক্রিয় শিক্ষার্থী:</span>
                    <span className="font-bold text-emerald-700">{studentsData.activeStudents} জন</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">ছাত্র (পুরুষ):</span>
                    <span className="font-semibold text-gray-800">
                      {studentsData.genderDistribution.male} ({studentsData.genderDistribution.malePercentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">ছাত্রী (মহিলা):</span>
                    <span className="font-semibold text-gray-800">
                      {studentsData.genderDistribution.female} ({studentsData.genderDistribution.femalePercentage}%)
                    </span>
                  </div>
                  <div className="pt-2 border-t text-sm space-y-1">
                    <div className="flex justify-between text-gray-600">
                      <span>এতিম শিক্ষার্থী:</span>
                      <span className="font-bold text-amber-700">{studentsData.specialCategories.orphans} জন</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>আর্থিক সাহায্যপ্রাপ্ত:</span>
                      <span className="font-bold text-blue-700">{studentsData.specialCategories.financiallyWeak} জন</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-sm">তথ্য লোড হচ্ছে...</div>
              )}
            </div>

            {/* Admission Funnel */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 md:col-span-2">
              <h2 className="font-bold text-gray-900 text-base border-b pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" /> নতুন ভর্তি কার্যক্রম ও রূপান্তর হার
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  রূপান্তর হার: {admissionData?.conversionRate || 0}%
                </span>
              </h2>
              {admissionData ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-xs text-gray-500">মোট আবেদন</div>
                    <div className="text-xl font-bold text-gray-900 mt-1">{admissionData.totalApplications}</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="text-xs text-amber-800">অপেক্ষমান</div>
                    <div className="text-xl font-bold text-amber-900 mt-1">{admissionData.statusBreakdown.submitted}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-xs text-emerald-800">অনুমোদিত/ভর্তি</div>
                    <div className="text-xl font-bold text-emerald-900 mt-1">{admissionData.statusBreakdown.approved}</div>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                    <div className="text-xs text-rose-800">বাতিল/প্রত্যাখ্যাত</div>
                    <div className="text-xl font-bold text-rose-900 mt-1">{admissionData.statusBreakdown.rejected}</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">ভর্তি ডাটা লোড হচ্ছে...</div>
              )}

              {/* Source Distribution */}
              {admissionData && (
                <div className="pt-2 text-xs flex justify-between text-gray-600 border-t">
                  <span>অনলাইন আবেদন: {admissionData.sourceDistribution.online} ({admissionData.sourceDistribution.onlinePercentage}%)</span>
                  <span>অফিস আবেদন: {admissionData.sourceDistribution.office} ({admissionData.sourceDistribution.officePercentage}%)</span>
                </div>
              )}
            </div>
          </div>

          {/* Jamat / Class Distribution Table */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 text-base mb-3">শ্রেণি ও জামাতভিত্তিক শিক্ষার্থী উপস্থিতি ও বণ্টন</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-600 text-xs uppercase">
                    <th className="p-3">জামাত / শ্রেণি</th>
                    <th className="p-3">কোড</th>
                    <th className="p-3">শিক্ষার্থী সংখ্যা</th>
                    <th className="p-3">মোট শিক্ষার্থীর শতকরা</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentsData?.classDistribution?.map((c: any) => (
                    <tr key={c.classId} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-800">{c.nameBn}</td>
                      <td className="p-3 text-gray-500 font-mono text-xs">{c.code}</td>
                      <td className="p-3 font-bold text-emerald-800">{c.studentCount} জন</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${c.percentage}%` }} />
                          </div>
                          <span className="text-xs text-gray-600">{c.percentage}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/admin/students?classId=${c.classId}`}
                          className="text-xs text-emerald-700 hover:underline"
                        >
                          শিক্ষার্থী তালিকা
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE & RESULTS */}
      {activeTab === "ATTENDANCE_RESULTS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Attendance Statistics */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="font-bold text-gray-900 text-base border-b pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-600" /> হাজিরা ও নিয়মিততা হার
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                  গড় উপস্থিতি: {attendanceData?.overallRate || 0}%
                </span>
              </h2>
              {attendanceData ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-xs text-emerald-800">উপস্থিত</div>
                    <div className="text-xl font-bold text-emerald-900 mt-1">{attendanceData.summary.present}</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="text-xs text-amber-800">বিলম্বে উপস্থিতি</div>
                    <div className="text-xl font-bold text-amber-900 mt-1">{attendanceData.summary.late}</div>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                    <div className="text-xs text-rose-800">অনুপস্থিত</div>
                    <div className="text-xl font-bold text-rose-900 mt-1">{attendanceData.summary.absent}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-xs text-blue-800">ছুটি</div>
                    <div className="text-xl font-bold text-blue-900 mt-1">{attendanceData.summary.leave}</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">হাজিরা লোড হচ্ছে...</div>
              )}
            </div>

            {/* Qawmi Results Grade Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="font-bold text-gray-900 text-base border-b pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" /> কওমি গ্রেডিং ফলাফল বিন্যাস
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  পাশের হার: {academicData?.passRate || 0}%
                </span>
              </h2>
              {academicData ? (
                <div className="space-y-2">
                  {academicData.gradeDistribution.map((g: any) => (
                    <div key={g.gradeCode} className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 border">
                      <span className="font-semibold text-gray-800">{g.gradeBn}</span>
                      <span className="text-gray-500 font-mono">{g.range}</span>
                      <span className="font-bold text-indigo-900 px-2 py-0.5 bg-indigo-50 rounded">{g.count} জন</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">ফলাফল লোড হচ্ছে...</div>
              )}
            </div>
          </div>

          {/* Class Attendance Comparison Table */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 text-base mb-3">জামাতভিত্তিক উপস্থিতি তুলনা</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-600 text-xs uppercase">
                    <th className="p-3">জামাত</th>
                    <th className="p-3">মোট রেকর্ড</th>
                    <th className="p-3">উপস্থিত</th>
                    <th className="p-3">অনুপস্থিত</th>
                    <th className="p-3">উপস্থিতির হার</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendanceData?.classComparison?.map((c: any) => (
                    <tr key={c.classId} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-800">{c.nameBn}</td>
                      <td className="p-3 text-gray-600">{c.total}</td>
                      <td className="p-3 font-bold text-emerald-700">{c.present}</td>
                      <td className="p-3 text-rose-600">{c.absent}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          c.attendanceRate >= 80
                            ? "bg-emerald-100 text-emerald-800"
                            : c.attendanceRate >= 60
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}>
                          {c.attendanceRate}%
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

      {/* TAB 4: FINANCE & 5 FUNDS */}
      {activeTab === "FINANCE" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <div className="text-xs text-gray-500">মোট নির্ধারিত ফি (Billed)</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                ৳{(financeData?.summary?.billedAmount || 0).toLocaleString("bn-BD")}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <div className="text-xs text-emerald-700 font-semibold">আদায়কৃত কালেকশন</div>
              <div className="text-2xl font-bold text-emerald-800 mt-1">
                ৳{(financeData?.summary?.collectedAmount || 0).toLocaleString("bn-BD")}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <div className="text-xs text-rose-700 font-semibold">বকেয়া ফি (Outstanding)</div>
              <div className="text-2xl font-bold text-rose-700 mt-1">
                ৳{(financeData?.summary?.outstandingAmount || 0).toLocaleString("bn-BD")}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <div className="text-xs text-blue-700 font-semibold">মোট ব্যয় (Expenses)</div>
              <div className="text-2xl font-bold text-blue-800 mt-1">
                ৳{(financeData?.summary?.expenseAmount || 0).toLocaleString("bn-BD")}
              </div>
            </div>
          </div>

          {/* 5 Dedicated Cash Funds Status */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900 text-base flex items-center justify-between border-b pb-2">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" /> মাদরাসার ৫টি অফিসিয়াল নগদ তহবিল (Cash Funds)
              </span>
              <span className="text-xs text-gray-500">স্বতন্ত্র ব্যালেন্স ও লেজার অখণ্ডতা</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {financeData?.fundMovements?.map((f: any) => (
                <div key={f.fundId} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <div className="text-xs font-semibold text-gray-700">{f.nameBn}</div>
                  <div className="text-lg font-bold text-emerald-800">
                    ৳{f.currentBalance.toLocaleString("bn-BD")}
                  </div>
                  <div className="text-xs text-gray-500 pt-1 border-t flex justify-between">
                    <span>আয়: ৳{f.periodIncome}</span>
                    <span>ব্যয়: ৳{f.periodExpense}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Channels & Fee Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 text-sm">আদায়কৃত পেমেন্ট মাধ্যম</h3>
              <div className="space-y-2">
                {financeData?.methodBreakdown?.map((m: any) => (
                  <div key={m.method} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{m.method}</span>
                    <span className="font-bold text-gray-900">৳{m.amount.toLocaleString("bn-BD")} ({m.count}টি)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 text-sm">ফি ক্যাটাগরিভিত্তিক আয়</h3>
              <div className="space-y-2">
                {financeData?.incomeByType?.map((t: any) => (
                  <div key={t.feeType} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{t.feeType}</span>
                    <span className="text-gray-900 font-semibold">
                      আদায়: ৳{t.collected.toLocaleString("bn-BD")} / ৳{t.billed.toLocaleString("bn-BD")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OPERATIONS */}
      {activeTab === "OPERATIONS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Library */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-2">
                <BookOpen className="w-4 h-4 text-emerald-600" /> কিতাবাগার (লাইব্রেরি)
              </h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">মোট কিতাবের শিরোনাম:</span>
                  <span className="font-bold text-gray-800">{operationsData?.library?.totalTitles || 0} টি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">মোট কিতাবের কপি:</span>
                  <span className="font-bold text-gray-800">{operationsData?.library?.totalCopies || 0} টি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">বর্তমানে ইস্যুকৃত কিতাব:</span>
                  <span className="font-bold text-blue-700">{operationsData?.library?.activeLoans || 0} টি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">বিলম্বিত কিতাব:</span>
                  <span className="font-bold text-rose-600">{operationsData?.library?.overdueLoans || 0} টি</span>
                </div>
              </div>
            </div>

            {/* Hostel */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-2">
                <Home className="w-4 h-4 text-emerald-600" /> ছাত্রাবাস ও আবাসিক ব্যবস্থা
              </h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">আবাসিক ছাত্র সংখ্যা:</span>
                  <span className="font-bold text-emerald-700">{operationsData?.hostel?.residential || 0} জন</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ডে-কেয়ার ছাত্র সংখ্যা:</span>
                  <span className="font-bold text-blue-700">{operationsData?.hostel?.dayCare || 0} জন</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">অনাবাসিক ছাত্র সংখ্যা:</span>
                  <span className="font-bold text-gray-700">{operationsData?.hostel?.nonResidential || 0} জন</span>
                </div>
              </div>
            </div>

            {/* Transport */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-2">
                <Truck className="w-4 h-4 text-emerald-600" /> যানবাহন ও পরিবহন
              </h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">সক্রিয় রুট:</span>
                  <span className="font-bold text-gray-800">{operationsData?.transport?.activeRoutes || 0} টি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">সক্রিয় গাড়ি ও চালক:</span>
                  <span className="font-bold text-gray-800">
                    {operationsData?.transport?.activeVehicles || 0} গাড়ি ({operationsData?.transport?.activeDrivers || 0} চালক)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">পরিবহন সেবা গ্রহণকারী:</span>
                  <span className="font-bold text-emerald-700">{operationsData?.transport?.enrolledStudents || 0} জন</span>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-2">
                <Package className="w-4 h-4 text-emerald-600" /> ইনভেন্টরি ও সম্পদ
              </h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">আইটেম সংখ্যা ও মজুদ:</span>
                  <span className="font-bold text-gray-800">
                    {operationsData?.inventory?.totalItems || 0} টি ({operationsData?.inventory?.totalStockUnits || 0} একক)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">স্বল্প স্টক সতর্কতা:</span>
                  <span className="font-bold text-amber-600">{operationsData?.inventory?.lowStockAlerts || 0} টি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ক্ষতিগ্রস্ত সম্পদ:</span>
                  <span className="font-bold text-rose-600">{operationsData?.inventory?.damagedAssets || 0} টি</span>
                </div>
              </div>
            </div>

            {/* HR */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-2">
                <UserCheck className="w-4 h-4 text-emerald-600" /> শিক্ষক ও কর্মকর্তা (এইচআর)
              </h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">মোট জনবল:</span>
                  <span className="font-bold text-gray-800">{operationsData?.hr?.totalEmployees || 0} জন</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">শিক্ষক ও স্টাফ:</span>
                  <span className="font-bold text-gray-800">
                    {operationsData?.hr?.teachers || 0} শিক্ষক / {operationsData?.hr?.supportStaff || 0} স্টাফ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">নথির মেয়াদোত্তীর্ণ সতর্কতা:</span>
                  <span className="font-bold text-amber-600">{operationsData?.hr?.expiringDocumentsCount || 0} টি</span>
                </div>
              </div>
            </div>

            {/* Helpdesk */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-2">
                <LifeBuoy className="w-4 h-4 text-emerald-600" /> হেল্পডেস্ক ও অভিযোগ
              </h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">মোট জমা টিকিট:</span>
                  <span className="font-bold text-gray-800">{operationsData?.helpdesk?.totalRequests || 0} টি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">চলমান/উন্মুক্ত:</span>
                  <span className="font-bold text-amber-600">{operationsData?.helpdesk?.openRequests || 0} টি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">নিষ্পত্তিকৃত (Resolved):</span>
                  <span className="font-bold text-emerald-700">{operationsData?.helpdesk?.resolvedRequests || 0} টি</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SESSION COMPARISON */}
      {activeTab === "COMPARISON" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-700" /> দুটি শিক্ষাবর্ষের তুলনামূলক বিশ্লেষণ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">শিক্ষাবর্ষ ১ (ভিত্তি)</label>
                <select
                  value={sessionA}
                  onChange={(e) => setSessionA(e.target.value)}
                  className="w-full p-2 border rounded-xl text-sm"
                >
                  <option value="">নির্বাচন করুন</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">শিক্ষাবর্ষ ২ (তুলনা)</label>
                <select
                  value={sessionB}
                  onChange={(e) => setSessionB(e.target.value)}
                  className="w-full p-2 border rounded-xl text-sm"
                >
                  <option value="">নির্বাচন করুন</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  onClick={handleRunComparison}
                  disabled={!sessionA || !sessionB || loading}
                  className="w-full py-2 bg-emerald-800 text-white rounded-xl text-sm font-semibold hover:bg-emerald-900 transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  তুলনা করুন
                </button>
              </div>
            </div>
          </div>

          {comparisonData && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 text-base mb-4">
                ফলাফল: {comparisonData.sessionA.name} বনাম {comparisonData.sessionB.name}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-600 text-xs uppercase">
                      <th className="p-3">সূচক (Metric)</th>
                      <th className="p-3">{comparisonData.sessionA.name}</th>
                      <th className="p-3">{comparisonData.sessionB.name}</th>
                      <th className="p-3">পার্থক্য</th>
                      <th className="p-3">শতাংশ পরিবর্তন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { label: "সক্রিয় শিক্ষার্থী", m: comparisonData.metrics.students },
                      { label: "নতুন ভর্তি আবেদন", m: comparisonData.metrics.admissions },
                      { label: "আবাসিক শিক্ষার্থী", m: comparisonData.metrics.residential },
                      { label: "ধার্যকৃত মোট ফি", m: comparisonData.metrics.billedFees, isMoney: true },
                      { label: "মোট আদায়কৃত ফি", m: comparisonData.metrics.collections, isMoney: true },
                    ].map((row, idx) => {
                      const isPositive = row.m.diff >= 0;
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3 font-semibold text-gray-800">{row.label}</td>
                          <td className="p-3">
                            {row.isMoney ? `৳${row.m.valA.toLocaleString("bn-BD")}` : row.m.valA}
                          </td>
                          <td className="p-3 font-bold text-gray-900">
                            {row.isMoney ? `৳${row.m.valB.toLocaleString("bn-BD")}` : row.m.valB}
                          </td>
                          <td className={`p-3 font-bold ${isPositive ? "text-emerald-700" : "text-rose-700"}`}>
                            {isPositive ? "+" : ""}{row.isMoney ? `৳${row.m.diff.toLocaleString("bn-BD")}` : row.m.diff}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                              isPositive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}>
                              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {row.m.percentage}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: REPORTS & PRINT PACK */}
      {activeTab === "REPORTS" && (
        <div className="space-y-6">
          {/* Custom Report Builder */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" /> কাস্টম ম্যানেজমেন্ট রিপোর্ট বিল্ডার
              </h2>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition"
              >
                <Printer className="w-4 h-4" /> প্রিন্ট / PDF
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">মডিউল নির্বাচন</label>
                <select
                  value={builderModule}
                  onChange={(e) => setBuilderModule(e.target.value)}
                  className="w-full p-2 border rounded-xl text-sm"
                >
                  <option value="STUDENTS">শিক্ষার্থী মডিউল (Students)</option>
                  <option value="FINANCE">আর্থিক চালান (Finance)</option>
                  <option value="ATTENDANCE">হাজিরা লগ (Attendance)</option>
                  <option value="HELPDESK">হেল্পডেস্ক টিকিট (Helpdesk)</option>
                </select>
              </div>
              <div>
                <button
                  onClick={handleExecuteBuilder}
                  disabled={builderLoading}
                  className="w-full py-2 bg-emerald-800 text-white rounded-xl text-sm font-semibold hover:bg-emerald-900 transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${builderLoading ? "animate-spin" : ""}`} />
                  রিপোর্ট তৈরি করুন
                </button>
              </div>
              <div>
                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={!builderResult}
                  className="w-full py-2 bg-gray-100 text-gray-800 rounded-xl text-sm font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> প্রিসেট সংরক্ষণ করুন
                </button>
              </div>
            </div>

            {/* Builder Table Preview */}
            {builderResult && (
              <div className="mt-4 border rounded-xl overflow-hidden">
                <div className="bg-gray-50 p-3 text-xs font-semibold text-gray-600 flex justify-between">
                  <span>ফলাফল: {builderResult.module} (রেকর্ড: {builderResult.count})</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        {builderResult.data.length > 0 &&
                          Object.keys(builderResult.data[0]).map((key) => (
                            <th key={key} className="p-2 capitalize">
                              {key}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {builderResult.data.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {Object.values(row).map((val: any, cIdx: number) => (
                            <td key={cIdx} className="p-2 font-mono">
                              {typeof val === "object" ? JSON.stringify(val) : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Saved Reports List */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">সংরক্ষিত রিপোর্ট প্রিসেট সমূহ</h3>
            {savedReports.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {savedReports.map((sr) => (
                  <div key={sr.id} className="p-3 bg-gray-50 rounded-xl border flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{sr.title}</div>
                      <div className="text-xs text-gray-500">মডিউল: {sr.module}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteSavedReport(sr.id)}
                      className="p-1 text-gray-400 hover:text-rose-600 transition"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">কোন সংরক্ষিত রিপোর্ট পাওয়া যায়নি।</p>
            )}
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4">
            <h3 className="font-bold text-gray-900">রিপোর্ট প্রিসেট সংরক্ষণ</h3>
            <input
              type="text"
              placeholder="রিপোর্টের নাম লিখুন (e.g. মাসিক শিক্ষার্থী তালিকা)"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              className="w-full p-2.5 border rounded-xl text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveReport}
                className="px-4 py-2 text-xs font-semibold bg-emerald-800 text-white rounded-xl hover:bg-emerald-900"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
