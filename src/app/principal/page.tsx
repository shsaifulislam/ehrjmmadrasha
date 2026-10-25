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
  Calendar,
  CalendarDays,
  HeartHandshake,
  DollarSign,
  Percent,
  Search,
  Filter,
  Check,
  Award,
  Sparkles,
  Printer,
  ChevronRight,
  Info,
  HelpCircle,
  PlusCircle,
  UserMinus,
  Utensils,
  BookOpen,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
import PrincipalShell, { PrincipalTabType } from "@/components/shells/PrincipalShell";
import PrincipalExamResultsHub from "@/components/principal/PrincipalExamResultsHub";

export default function PrincipalDashboardPage() {
  const [activeTab, setActiveTab] = useState<PrincipalTabType>("DASHBOARD");
  const [stats, setStats] = useState<any | null>(null);
  const [analyticsOverview, setAnalyticsOverview] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Message & Directives
  const [message, setMessage] = useState(
    "বিসমিল্লাহির রাহমানির রাহিম। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কুরআন-সুন্নাহর সঠিক প্রচার ও চরিত্রবান আদর্শ নাগরিক গড়ার একটি অন্যতম শ্রেষ্ঠ মারকাজ। আমাদের লক্ষ্য শুধু কিতাবি জ্ঞান নয়, বরং আমলে পরিপূর্ণ এক আদর্শ প্রজন্ম তৈরি করা।"
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [issueSent, setIssueSent] = useState(false);

  // Operations
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

  // ==========================================
  // 1. LEAVE MANAGEMENT STATE
  // ==========================================
  const [leaveSubTab, setLeaveSubTab] = useState<"STUDENTS" | "EMPLOYEES" | "HOLIDAY">("STUDENTS");
  const [loadingLeave, setLoadingLeave] = useState(false);
  const [studentLeaves, setStudentLeaves] = useState<any[]>([]);
  const [employeeLeaves, setEmployeeLeaves] = useState<any[]>([]);
  const [leaveClasses, setLeaveClasses] = useState<any[]>([]);
  const [leaveStudents, setLeaveStudents] = useState<any[]>([]);
  const [leaveEmployees, setLeaveEmployees] = useState<any[]>([]);

  // Direct Student Leave Form State
  const [directLeaveClassId, setDirectLeaveClassId] = useState("ALL");
  const [directLeaveStudentId, setDirectLeaveStudentId] = useState("");
  const [directLeaveStartDate, setDirectLeaveStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [directLeaveEndDate, setDirectLeaveEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [directLeaveReason, setDirectLeaveReason] = useState("শারীরিক অসুস্থতা");
  const [directLeaveNote, setDirectLeaveNote] = useState("মুহতামিম কর্তৃক সরাসরি মঞ্জুরকৃত ছুটি");
  const [submittingDirectLeave, setSubmittingDirectLeave] = useState(false);
  const [directLeaveSuccess, setDirectLeaveSuccess] = useState<string | null>(null);

  // Direct Employee Leave Form State
  const [directEmpLeaveEmpId, setDirectEmpLeaveEmpId] = useState("");
  const [directEmpLeaveStartDate, setDirectEmpLeaveStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [directEmpLeaveEndDate, setDirectEmpLeaveEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [directEmpLeaveReason, setDirectEmpLeaveReason] = useState("জরুরি পারিবারিক প্রয়োজন");
  const [submittingEmpLeave, setSubmittingEmpLeave] = useState(false);
  const [empLeaveSuccess, setEmpLeaveSuccess] = useState<string | null>(null);

  // Institutional General Holiday Form State
  const [holidayTitle, setHolidayTitle] = useState("");
  const [holidayStartDate, setHolidayStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [holidayEndDate, setHolidayEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [holidayReason, setHolidayReason] = useState("");
  const [holidayAudience, setHolidayAudience] = useState<"ALL" | "CLASS">("ALL");
  const [holidayClassId, setHolidayClassId] = useState("");
  const [submittingHoliday, setSubmittingHoliday] = useState(false);
  const [holidaySuccess, setHolidaySuccess] = useState<string | null>(null);

  // Leave List Filters
  const [leaveClassFilter, setLeaveClassFilter] = useState("ALL");
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("ALL");
  const [leaveSearch, setLeaveSearch] = useState("");

  // ==========================================
  // 2. FEE CONCESSION & ORPHAN CARE STATE
  // ==========================================
  const [loadingWaivers, setLoadingWaivers] = useState(false);
  const [waiverStudents, setWaiverStudents] = useState<any[]>([]);
  const [waiverClasses, setWaiverClasses] = useState<any[]>([]);
  const [waiversList, setWaiversList] = useState<any[]>([]);
  const [waiverStats, setWaiverStats] = useState<any>({
    totalActiveStudents: 0,
    totalOrphans: 0,
    totalFinanciallyWeak: 0,
    totalWaiversGranted: 0,
    fullFreeCount: 0,
    partialWaiverCount: 0,
    totalMonthlySubsidized: 0,
  });

  // Concession Form State
  const [concessionClassFilter, setConcessionClassFilter] = useState("ALL");
  const [concessionStudentId, setConcessionStudentId] = useState("");
  const [concessionType, setConcessionType] = useState<"FULL_FREE" | "CUSTOM_FEE" | "PERCENTAGE">("CUSTOM_FEE");
  const [concessionCustomFee, setConcessionCustomFee] = useState<number>(300);
  const [concessionPercentage, setConcessionPercentage] = useState<number>(50);
  const [concessionIsOrphan, setConcessionIsOrphan] = useState(false);
  const [concessionIsFinanciallyWeak, setConcessionIsFinanciallyWeak] = useState(true);
  const [concessionReason, setConcessionReason] = useState("মুহতামিম কর্তৃক নির্ধারিত বিশেষ বেতন ছাড় ও লিল্লাহ সমন্বয়");
  const [submittingConcession, setSubmittingConcession] = useState(false);
  const [concessionSuccess, setConcessionSuccess] = useState<string | null>(null);
  const [concessionError, setConcessionError] = useState<string | null>(null);

  // Concession Directory Filters
  const [concessionDirectoryClassFilter, setConcessionDirectoryClassFilter] = useState("ALL");
  const [concessionDirectorySearch, setConcessionDirectorySearch] = useState("");
  const [concessionOnlyOrphans, setConcessionOnlyOrphans] = useState(false);

  // Loaders
  const loadLeaveData = () => {
    setLoadingLeave(true);
    fetch("/api/principal/leave")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setStudentLeaves(data.studentLeaves || []);
          setEmployeeLeaves(data.employeeLeaves || []);
          setLeaveClasses(data.classes || []);
          setLeaveStudents(data.students || []);
          setLeaveEmployees(data.employees || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingLeave(false));
  };

  const loadWaiverData = () => {
    setLoadingWaivers(true);
    fetch("/api/principal/finance/waivers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setWaiverStudents(data.students || []);
          setWaiverClasses(data.classes || []);
          setWaiversList(data.waivers || []);
          if (data.stats) setWaiverStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingWaivers(false));
  };

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

  const loadStatsAndAnalytics = () => {
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
  };

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    loadStatsAndAnalytics();
    loadLeaveData();
    loadWaiverData();
    loadOperationsOverview();
    setTimeout(() => setIsRefreshing(false), 700);
  };

  // Initial Sync
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        const upper = tabParam.toUpperCase() as PrincipalTabType;
        const validTabs: PrincipalTabType[] = [
          "DASHBOARD",
          "OVERVIEW",
          "LEAVE_MANAGEMENT",
          "FEE_CONCESSION",
          "NOTICES",
          "ISSUES",
          "REPORTS",
          "OPERATIONS",
        ];
        if (validTabs.includes(upper)) {
          setActiveTab(upper);
        }
      }
    }

    loadStatsAndAnalytics();
    loadLeaveData();
    loadWaiverData();
  }, []);

  const handleTabChange = (tab: PrincipalTabType) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  useEffect(() => {
    if (activeTab === "OPERATIONS" && !operationsData.health) {
      loadOperationsOverview();
    }
    if (activeTab === "LEAVE_MANAGEMENT") {
      loadLeaveData();
    }
    if (activeTab === "FEE_CONCESSION") {
      loadWaiverData();
    }
  }, [activeTab]);

  // Actions
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

  // Leave Actions
  const handleReviewStudentLeave = async (leaveId: string, action: "APPROVE_STUDENT_LEAVE" | "REJECT_STUDENT_LEAVE") => {
    try {
      const res = await fetch("/api/principal/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          leaveId,
          note: action === "APPROVE_STUDENT_LEAVE" ? "মুহতামিম সাহেব কর্তৃক অনুমোদিত (অটোমেটিক অ্যাডমিন সিঙ্ক)" : "মুহতামিম সাহেব কর্তৃক বাতিলকৃত",
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadLeaveData();
      } else {
        alert(data.error || "ছুটি প্রক্রিয়াকরণে সমস্যা হয়েছে");
      }
    } catch {
      alert("নেটওয়ার্ক ত্রুটি");
    }
  };

  const handleGrantDirectStudentLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directLeaveStudentId) {
      alert("দয়া করে একজন শিক্ষার্থী নির্বাচন করুন");
      return;
    }
    setSubmittingDirectLeave(true);
    setDirectLeaveSuccess(null);
    try {
      const res = await fetch("/api/principal/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GRANT_DIRECT_STUDENT_LEAVE",
          studentId: directLeaveStudentId,
          startDate: directLeaveStartDate,
          endDate: directLeaveEndDate,
          reason: directLeaveReason,
          note: directLeaveNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDirectLeaveSuccess("সরাসরি ছুটি সফলভাবে মঞ্জুর করা হয়েছে এবং অ্যাডমিন ও দৈনিক হাজিরায় স্বয়ংক্রিয়ভাবে সিঙ্ক হয়েছে!");
        loadLeaveData();
        setTimeout(() => setDirectLeaveSuccess(null), 4000);
      } else {
        alert(data.error || "ছুটি মঞ্জুরে ব্যর্থ");
      }
    } catch {
      alert("নেটওয়ার্ক সমস্যা");
    } finally {
      setSubmittingDirectLeave(false);
    }
  };

  const handleReviewEmployeeLeave = async (requestId: string, action: "APPROVE_EMPLOYEE_LEAVE" | "REJECT_EMPLOYEE_LEAVE") => {
    try {
      const res = await fetch("/api/principal/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          requestId,
          reason: action === "APPROVE_EMPLOYEE_LEAVE" ? "মুহতামিম কর্তৃক অনুমোদিত" : "মুহতামিম কর্তৃক বাতিল",
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadLeaveData();
      } else {
        alert(data.error || "ছুটি প্রক্রিয়ায় ত্রুটি");
      }
    } catch {
      alert("নেটওয়ার্ক সমস্যা");
    }
  };

  const handleGrantDirectEmployeeLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directEmpLeaveEmpId) {
      alert("দয়া করে একজন শিক্ষক বা স্টাফ নির্বাচন করুন");
      return;
    }
    setSubmittingEmpLeave(true);
    setEmpLeaveSuccess(null);
    try {
      const res = await fetch("/api/principal/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GRANT_DIRECT_EMPLOYEE_LEAVE",
          employeeId: directEmpLeaveEmpId,
          startDate: directEmpLeaveStartDate,
          endDate: directEmpLeaveEndDate,
          reason: directEmpLeaveReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmpLeaveSuccess("শিক্ষকের ছুটি সফলভাবে মঞ্জুর করা হয়েছে এবং স্টাফ রেকর্ডসে যুক্ত হয়েছে!");
        loadLeaveData();
        setTimeout(() => setEmpLeaveSuccess(null), 4000);
      } else {
        alert(data.error || "শিক্ষকের ছুটি মঞ্জুর হয়নি");
      }
    } catch {
      alert("নেটওয়ার্ক সমস্যা");
    } finally {
      setSubmittingEmpLeave(false);
    }
  };

  const handleDeclareHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayTitle) {
      alert("ছুটির শিরোনাম প্রদান করুন");
      return;
    }
    setSubmittingHoliday(true);
    setHolidaySuccess(null);
    try {
      const res = await fetch("/api/principal/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INSTITUTION_HOLIDAY",
          titleBn: holidayTitle,
          startDate: holidayStartDate,
          endDate: holidayEndDate,
          reason: holidayReason,
          notifyAudience: holidayAudience,
          targetClassId: holidayAudience === "CLASS" ? holidayClassId : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHolidaySuccess("সাধারণ অবকাশ সফলভাবে ঘোষণা ও ক্যালেন্ডার-নোটিশে জারি করা হয়েছে!");
        setHolidayTitle("");
        setHolidayReason("");
        loadLeaveData();
        setTimeout(() => setHolidaySuccess(null), 5000);
      } else {
        alert(data.error || "অবকাশ ঘোষণায় ব্যর্থ");
      }
    } catch {
      alert("নেটওয়ার্ক সমস্যা");
    } finally {
      setSubmittingHoliday(false);
    }
  };

  // Fee Concession Action
  const handleSaveStudentWaiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concessionStudentId) {
      alert("দয়া করে একজন শিক্ষার্থী নির্বাচন করুন");
      return;
    }
    setSubmittingConcession(true);
    setConcessionSuccess(null);
    setConcessionError(null);
    try {
      const res = await fetch("/api/principal/finance/waivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_STUDENT_WAIVER",
          studentId: concessionStudentId,
          waiverType: concessionType,
          customTuitionFee: Number(concessionCustomFee),
          waiverPercentage: Number(concessionPercentage),
          reason: concessionReason,
          isOrphan: concessionIsOrphan,
          isFinanciallyWeak: concessionIsFinanciallyWeak,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConcessionSuccess(data.message || "শিক্ষার্থীর বিশেষ বেতন ছাড় ও এতিম লিল্লাহ বৃত্তি কার্যকর হয়েছে!");
        loadWaiverData();
        setTimeout(() => setConcessionSuccess(null), 4000);
      } else {
        setConcessionError(data.error || "বেতন ছাড় সংরক্ষণে সমস্যা হয়েছে");
      }
    } catch {
      setConcessionError("নেটওয়ার্ক সমস্যা দেখা দিয়েছে");
    } finally {
      setSubmittingConcession(false);
    }
  };

  // Selected Student Calculation in Concession Form
  const selectedStudentForConcession = waiverStudents.find((s) => s.id === concessionStudentId);
  const baseMonthlyFee = selectedStudentForConcession?.currentEnrollment?.class?.monthlyTuitionFee || 1000;
  const calculatedPayable =
    concessionType === "FULL_FREE"
      ? 0
      : concessionType === "CUSTOM_FEE"
      ? Number(concessionCustomFee || 0)
      : Math.max(0, baseMonthlyFee - (baseMonthlyFee * Number(concessionPercentage || 0)) / 100);

  // Filtered Leave Students for selector
  const eligibleLeaveStudents = leaveStudents.filter(
    (s) => directLeaveClassId === "ALL" || s.classId === directLeaveClassId
  );

  // Filtered Student Leave Requests
  const filteredStudentLeaves = studentLeaves.filter((l) => {
    const matchesClass = leaveClassFilter === "ALL" || l.student?.currentClass?.id === leaveClassFilter;
    const matchesStatus = leaveStatusFilter === "ALL" || l.status === leaveStatusFilter;
    const matchesSearch =
      leaveSearch.trim() === "" ||
      l.student?.fullNameBn?.toLowerCase().includes(leaveSearch.toLowerCase()) ||
      l.student?.admissionNo?.toLowerCase().includes(leaveSearch.toLowerCase()) ||
      l.guardian?.fullNameBn?.toLowerCase().includes(leaveSearch.toLowerCase());
    return matchesClass && matchesStatus && matchesSearch;
  });

  // Filtered Concession Students in Directory
  const filteredConcessions = waiversList.filter((w) => {
    const student = w.student;
    const jamatId = student?.enrollments?.[0]?.class?.id;
    const matchesClass = concessionDirectoryClassFilter === "ALL" || jamatId === concessionDirectoryClassFilter;
    const matchesOrphan = !concessionOnlyOrphans || student?.isOrphan || w.isOrphan;
    const matchesSearch =
      concessionDirectorySearch.trim() === "" ||
      student?.fullNameBn?.toLowerCase().includes(concessionDirectorySearch.toLowerCase()) ||
      student?.admissionNo?.toLowerCase().includes(concessionDirectorySearch.toLowerCase());
    return matchesClass && matchesOrphan && matchesSearch;
  });

  return (
    <PrincipalShell
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onRefresh={handleRefreshAll}
      isRefreshing={isRefreshing}
    >
      {/* 1. DASHBOARD */}
      {activeTab === "DASHBOARD" && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-xs text-emerald-900 flex items-start justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#0D5C3A] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-950">
                  সম্মানিত মুহতামিম মহোদয়ের কেন্দ্রীয় তদারকি ও নির্বাহী কমান্ড সেন্টার:
                </p>
                <p className="mt-1 text-emerald-800 leading-relaxed max-w-2xl">
                  মাদরাসার অ্যাকাডেমিক শৃঙ্খলা, লিল্লাহ বোর্ডিং ও যাকাত তহবিলের স্বচ্ছতা, ছুটির পূর্ণ নিয়ন্ত্রণ এবং এতিম-অসচ্ছল শিক্ষার্থীদের বেতন নির্ধারণ আপনি এখান থেকে সরাসরি পরিচালনা করতে পারবেন। মুহতামিম অনুমোদনে সকল বিষয় স্বয়ংক্রিয়ভাবে অ্যাডমিন ও অ্যাকাউন্টে সিঙ্ক হয়ে যায়।
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="bg-emerald-800 text-white font-semibold px-2.5 py-0.5 rounded-full font-mono">
                    স্থাপিত: ২০২১ ইং (ESTD 2021)
                  </span>
                  <span className="bg-emerald-200/80 text-emerald-900 font-semibold px-2 py-0.5 rounded-full">
                    স্বয়ংক্রিয় অ্যাডমিন সিঙ্ক সক্রিয়
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefreshAll}
              className="p-2 bg-white rounded-xl border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition shadow-xs self-start"
              title="তাত্ক্ষণিক রিফ্রেশ"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Quick Access Tiles to Major Features */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <button
              onClick={() => handleTabChange("ACADEMICS")}
              className="p-4 rounded-2xl bg-gradient-to-br from-[#083B25] to-emerald-900 text-white text-left hover:shadow-lg transition hover:-translate-y-0.5 group"
            >
              <div className="p-2.5 rounded-xl bg-white/10 w-fit text-[#C59B27] group-hover:scale-110 transition mb-2.5">
                <Award className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm">পরীক্ষা ও মেধা তালিকা</div>
              <div className="text-[11px] text-emerald-200/80 mt-0.5">রেজাল্ট অনুমোদন ও প্রকাশ</div>
            </button>

            <button
              onClick={() => handleTabChange("LEAVE_MANAGEMENT")}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white text-left hover:shadow-lg transition hover:-translate-y-0.5 group"
            >
              <div className="p-2.5 rounded-xl bg-white/10 w-fit text-emerald-300 group-hover:scale-110 transition mb-2.5">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm">ছুটি ও অবকাশ সিস্টেম</div>
              <div className="text-[11px] text-emerald-200/80 mt-0.5">ছাত্র ও শিক্ষক ছুটি মঞ্জুর</div>
            </button>

            <button
              onClick={() => handleTabChange("FEE_CONCESSION")}
              className="p-4 rounded-2xl bg-gradient-to-br from-amber-700 to-yellow-800 text-white text-left hover:shadow-lg transition hover:-translate-y-0.5 group"
            >
              <div className="p-2.5 rounded-xl bg-white/10 w-fit text-amber-200 group-hover:scale-110 transition mb-2.5">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm">বেতন ছাড় ও এতিম তহবিল</div>
              <div className="text-[11px] text-amber-100/80 mt-0.5">ইচ্ছামত ফি ও লিল্লাহ বৃত্তি</div>
            </button>

            <button
              onClick={() => handleTabChange("OVERVIEW")}
              className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-left hover:shadow-md transition hover:-translate-y-0.5 group"
            >
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 w-fit group-hover:scale-110 transition mb-2.5">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm">সার্বিক পর্যবেক্ষণ</div>
              <div className="text-[11px] text-slate-500 mt-0.5">পরিসংখ্যান ও স্বাস্থ্য ডেক</div>
            </button>

            <button
              onClick={() => handleTabChange("NOTICES")}
              className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-left hover:shadow-md transition hover:-translate-y-0.5 group"
            >
              <div className="p-2.5 rounded-xl bg-yellow-50 text-yellow-700 w-fit group-hover:scale-110 transition mb-2.5">
                <Bell className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm">জরুরি নোটিশ জারি</div>
              <div className="text-[11px] text-slate-500 mt-0.5">লাইভ সার্কুলার প্রকাশ</div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Update Official Message */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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
                  className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 rounded-xl text-xs font-semibold transition shadow"
                >
                  বাণী সংরক্ষণ করুন
                </button>
              </form>
            </div>

            {/* Box 2: Issue Directive to Admin */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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
                  className="w-full bg-[#C59B27] hover:bg-amber-600 text-[#083B25] py-2.5 rounded-xl text-xs font-bold transition shadow"
                >
                  নির্দেশনা প্রেরণ করুন
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACADEMICS & EXAMINATIONS (পরীক্ষা নিয়ন্ত্রণ, মেধা তালিকা ও ফলাফল প্রকাশ) */}
      {activeTab === "ACADEMICS" && (
        <PrincipalExamResultsHub />
      )}

      {/* 3. LEAVE MANAGEMENT (ছুটি ও অবকাশ সিস্টেম - সম্পূর্ণ নিয়ন্ত্রণ) */}
      {activeTab === "LEAVE_MANAGEMENT" && (
        <div className="space-y-6">
          {/* Header Bar with Counters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 font-display">
                    মুহতামিম ছুটি ও অবকাশ নিয়ন্ত্রণ সিস্টেম (Leave Management)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  ছাত্র-ছাত্রীদের ছুটি মঞ্জুর, অভিভাবকদের আবেদন অনুমোদন, উস্তাদদের ছুটি এবং সাধারণ প্রাতিষ্ঠানিক অবকাশ ঘোষণা।
                  <b className="text-emerald-700 ml-1">মুহতামিমের অনুমোদন সরাসরি কার্যকর ও অ্যাডমিনে সিঙ্কড।</b>
                </p>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto text-xs font-bold">
                <button
                  onClick={() => setLeaveSubTab("STUDENTS")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    leaveSubTab === "STUDENTS" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ছাত্রদের ছুটি ({studentLeaves.length})
                </button>
                <button
                  onClick={() => setLeaveSubTab("EMPLOYEES")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    leaveSubTab === "EMPLOYEES" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  উস্তাদদের ছুটি ({employeeLeaves.length})
                </button>
                <button
                  onClick={() => setLeaveSubTab("HOLIDAY")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    leaveSubTab === "HOLIDAY" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  সাধারণ অবকাশ ঘোষণা
                </button>
              </div>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">মোট ছাত্র আবেদন</span>
                <span className="text-xl font-black text-slate-900">{studentLeaves.length} টি</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-[11px] text-amber-700 block">পেন্ডিং আবেদন</span>
                <span className="text-xl font-black text-amber-800">
                  {studentLeaves.filter((l) => l.status === "SUBMITTED").length} টি
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[11px] text-emerald-700 block">অনুমোদিত ছুটি</span>
                <span className="text-xl font-black text-emerald-800">
                  {studentLeaves.filter((l) => l.status === "APPROVED").length} টি
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-[11px] text-blue-700 block">উস্তাদ ছুটি রেকর্ড</span>
                <span className="text-xl font-black text-blue-800">{employeeLeaves.length} টি</span>
              </div>
            </div>
          </div>

          {/* SUB-TAB 1: STUDENTS LEAVE MANAGEMENT */}
          {leaveSubTab === "STUDENTS" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Direct Leave Grant Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <PlusCircle className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    সরাসরি ছাত্রের ছুটি মঞ্জুর (মুহতামিম ডেস্ক)
                  </h3>
                </div>

                {directLeaveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{directLeaveSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleGrantDirectStudentLeave} className="space-y-3.5 text-xs">
                  {/* Jamat Filter for student dropdown */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">জামাত / শ্রেণি নির্বাচন</label>
                    <select
                      value={directLeaveClassId}
                      onChange={(e) => {
                        setDirectLeaveClassId(e.target.value);
                        setDirectLeaveStudentId("");
                      }}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-slate-800 font-medium"
                    >
                      <option value="ALL">সকল জামাত</option>
                      {leaveClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Student Selector */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">শিক্ষার্থী নির্বাচন *</label>
                    <select
                      required
                      value={directLeaveStudentId}
                      onChange={(e) => setDirectLeaveStudentId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white text-slate-900 font-medium"
                    >
                      <option value="">-- ছাত্র নির্বাচন করুন --</option>
                      {eligibleLeaveStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullNameBn} (দাখিলা: {s.admissionNo} {s.rollNo ? `| রোল: ${s.rollNo}` : ""})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="pt-1">
                    <span className="text-[11px] text-slate-500 block mb-1">দ্রুত মেয়াদের বোতাম:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date().toISOString().split("T")[0];
                          setDirectLeaveStartDate(today);
                          setDirectLeaveEndDate(today);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                      >
                        আজকের ছুটি (১ দিন)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const start = new Date();
                          const end = new Date();
                          end.setDate(start.getDate() + 2);
                          setDirectLeaveStartDate(start.toISOString().split("T")[0]);
                          setDirectLeaveEndDate(end.toISOString().split("T")[0]);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                      >
                        ৩ দিন
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const start = new Date();
                          const end = new Date();
                          end.setDate(start.getDate() + 6);
                          setDirectLeaveStartDate(start.toISOString().split("T")[0]);
                          setDirectLeaveEndDate(end.toISOString().split("T")[0]);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                      >
                        ১ সপ্তাহ
                      </button>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">শুরুর তারিখ</label>
                      <input
                        type="date"
                        required
                        value={directLeaveStartDate}
                        onChange={(e) => setDirectLeaveStartDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">শেষের তারিখ</label>
                      <input
                        type="date"
                        required
                        value={directLeaveEndDate}
                        onChange={(e) => setDirectLeaveEndDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ছুটির কারণ</label>
                    <input
                      type="text"
                      required
                      value={directLeaveReason}
                      onChange={(e) => setDirectLeaveReason(e.target.value)}
                      placeholder="যেমন: জ্বর ও শারীরিক অসুস্থতা, পারিবারিক বিবাহ..."
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">মুহতামিমের মন্তব্য</label>
                    <textarea
                      rows={2}
                      value={directLeaveNote}
                      onChange={(e) => setDirectLeaveNote(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingDirectLeave}
                    className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {submittingDirectLeave ? "সংরক্ষণ হচ্ছে..." : "সরাসরি ছুটি মঞ্জুর করুন (Auto-Sync)"}
                  </button>
                </form>
              </div>

              {/* Right Columns: Requests Table & List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  {/* Filters Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-700" />
                      অভিভাবকদের ছুটির আবেদন ও বর্তমান তালিকা ({filteredStudentLeaves.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={leaveClassFilter}
                        onChange={(e) => setLeaveClassFilter(e.target.value)}
                        className="px-2.5 py-1.5 border rounded-lg text-xs bg-slate-50 text-slate-700"
                      >
                        <option value="ALL">সকল শ্রেণি</option>
                        {leaveClasses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameBn}
                          </option>
                        ))}
                      </select>

                      <select
                        value={leaveStatusFilter}
                        onChange={(e) => setLeaveStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 border rounded-lg text-xs bg-slate-50 text-slate-700"
                      >
                        <option value="ALL">সকল স্ট্যাটাস</option>
                        <option value="SUBMITTED">পেন্ডিং (অপেক্ষমাণ)</option>
                        <option value="APPROVED">অনুমোদিত</option>
                        <option value="REJECTED">বাতিলকৃত</option>
                      </select>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={leaveSearch}
                      onChange={(e) => setLeaveSearch(e.target.value)}
                      placeholder="ছাত্রের নাম, দাখিলা নম্বর বা অভিভাবকের নাম দিয়ে খুঁজুন..."
                      className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl bg-slate-50 focus:bg-white"
                    />
                  </div>

                  {/* List / Table */}
                  {loadingLeave ? (
                    <div className="text-center py-8 text-xs text-slate-500">তথ্য লোড হচ্ছে...</div>
                  ) : filteredStudentLeaves.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">কোনো ছুটির আবেদন পাওয়া যায়নি।</div>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {filteredStudentLeaves.map((leave) => {
                        const start = new Date(leave.startDate);
                        const end = new Date(leave.endDate);
                        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                        return (
                          <div key={leave.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">
                                  {leave.student?.fullNameBn || "মুহাম্মদ ছাত্র"}
                                </span>
                                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                                  {leave.student?.currentClass?.nameBn || "হিফজ"} | দাখিলা: {leave.student?.admissionNo}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    leave.status === "APPROVED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : leave.status === "REJECTED"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {leave.status === "APPROVED" ? "মঞ্জুরকৃত" : leave.status === "REJECTED" ? "বাতিল" : "অপেক্ষমাণ"}
                                </span>
                              </div>
                              <div className="text-slate-600">
                                <b>মেয়াদ:</b> {start.toLocaleDateString("bn-BD")} থেকে {end.toLocaleDateString("bn-BD")} ({diffDays} দিন)
                              </div>
                              <div className="text-slate-500 text-[11px]">
                                <b>কারণ:</b> {leave.reason} {leave.guardian ? `| অভিভাবক: ${leave.guardian.fullNameBn} (${leave.guardian.phone || "ফোন নেই"})` : ""}
                              </div>
                              {leave.adminNote && (
                                <div className="text-emerald-700 font-medium text-[11px] bg-emerald-50 px-2 py-0.5 rounded w-fit">
                                  মন্তব্য: {leave.adminNote}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              {leave.status === "SUBMITTED" ? (
                                <>
                                  <button
                                    onClick={() => handleReviewStudentLeave(leave.id, "APPROVE_STUDENT_LEAVE")}
                                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-xs"
                                  >
                                    মঞ্জুর করুন
                                  </button>
                                  <button
                                    onClick={() => handleReviewStudentLeave(leave.id, "REJECT_STUDENT_LEAVE")}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs"
                                  >
                                    বাতিল
                                  </button>
                                </>
                              ) : leave.status === "APPROVED" ? (
                                <button
                                  onClick={() => handleReviewStudentLeave(leave.id, "REJECT_STUDENT_LEAVE")}
                                  className="px-2.5 py-1 text-slate-400 hover:text-rose-600 text-[11px]"
                                >
                                  বাতিল করুন
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReviewStudentLeave(leave.id, "APPROVE_STUDENT_LEAVE")}
                                  className="px-2.5 py-1 text-slate-400 hover:text-emerald-700 text-[11px]"
                                >
                                  পুনরায় মঞ্জুর
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: TEACHERS LEAVE MANAGEMENT */}
          {leaveSubTab === "EMPLOYEES" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Direct Grant to Employee */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <UserCheck className="w-4 h-4 text-blue-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    উস্তাদ / কর্মচারীর সরাসরি ছুটি মঞ্জুর
                  </h3>
                </div>

                {empLeaveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{empLeaveSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleGrantDirectEmployeeLeave} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">শিক্ষক / স্টাফ নির্বাচন *</label>
                    <select
                      required
                      value={directEmpLeaveEmpId}
                      onChange={(e) => setDirectEmpLeaveEmpId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white text-slate-900 font-medium"
                    >
                      <option value="">-- শিক্ষক/স্টাফ নির্বাচন করুন --</option>
                      {leaveEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.designation || "উস্তাদ"} - {emp.department || "সাধারণ"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">শুরুর তারিখ</label>
                      <input
                        type="date"
                        required
                        value={directEmpLeaveStartDate}
                        onChange={(e) => setDirectEmpLeaveStartDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">শেষের তারিখ</label>
                      <input
                        type="date"
                        required
                        value={directEmpLeaveEndDate}
                        onChange={(e) => setDirectEmpLeaveEndDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ছুটির কারণ</label>
                    <input
                      type="text"
                      required
                      value={directEmpLeaveReason}
                      onChange={(e) => setDirectEmpLeaveReason(e.target.value)}
                      placeholder="জরুরি পারিবারিক বিষয় বা অসুস্থতা..."
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingEmpLeave}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl font-bold transition shadow-md"
                  >
                    {submittingEmpLeave ? "মঞ্জুর হচ্ছে..." : "উস্তাদের ছুটি সরাসরি মঞ্জুর করুন"}
                  </button>
                </form>
              </div>

              {/* Employees Leave Applications List */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-700" />
                  উস্তাদ ও স্টাফদের ছুটির আবেদন ও বর্তমান স্থিতি ({employeeLeaves.length})
                </h3>

                {employeeLeaves.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">কোনো শিক্ষক ছুটির আবেদন জমা পড়েনি।</div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {employeeLeaves.map((el) => (
                      <div key={el.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {el.employee?.fullName || "উস্তাদ"}
                            </span>
                            <span className="text-[11px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-mono">
                              {el.employee?.designation}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                el.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : el.status === "REJECTED"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {el.status === "APPROVED" ? "মঞ্জুরকৃত" : el.status === "REJECTED" ? "বাতিল" : "অপেক্ষমাণ"}
                            </span>
                          </div>
                          <div className="text-slate-600">
                            <b>মেয়াদ:</b> {new Date(el.startDate).toLocaleDateString("bn-BD")} থেকে {new Date(el.endDate).toLocaleDateString("bn-BD")}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            <b>কারণ/ধরন:</b> {el.decisionReason || el.leaveType?.nameBn || el.leaveType?.name || "জরুরি কারণ"}
                          </div>
                        </div>

                        {el.status === "PENDING" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReviewEmployeeLeave(el.id, "APPROVE_EMPLOYEE_LEAVE")}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs"
                            >
                              অনুমোদন
                            </button>
                            <button
                              onClick={() => handleReviewEmployeeLeave(el.id, "REJECT_EMPLOYEE_LEAVE")}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs"
                            >
                              বাতিল
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 3: INSTITUTIONAL GENERAL HOLIDAY */}
          {leaveSubTab === "HOLIDAY" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-2xl mx-auto space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    সাধারণ প্রাতিষ্ঠানিক অবকাশ / ছুটি ঘোষণা (সবার জন্য বা নির্দিষ্ট জামাত)
                  </h3>
                  <p className="text-xs text-slate-500">
                    এখান থেকে ছুটি ঘোষণা করলে তা স্বয়ংক্রিয়ভাবে মাদরাসার ক্যালেন্ডারে যুক্ত হবে এবং অভিভাবকদের জন্য নোটিশ জারি হবে।
                  </p>
                </div>
              </div>

              {holidaySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{holidaySuccess}</span>
                </div>
              )}

              <form onSubmit={handleDeclareHoliday} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">অবকাশ / ছুটির শিরোনাম *</label>
                  <input
                    type="text"
                    required
                    value={holidayTitle}
                    onChange={(e) => setHolidayTitle(e.target.value)}
                    placeholder="যেমন: পবিত্র ঈদুল ফিতর উপলক্ষে সাধারণ ছুটি, শীতকালীন অবকাশ..."
                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">শুরুর তারিখ</label>
                    <input
                      type="date"
                      required
                      value={holidayStartDate}
                      onChange={(e) => setHolidayStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">শেষের তারিখ</label>
                    <input
                      type="date"
                      required
                      value={holidayEndDate}
                      onChange={(e) => setHolidayEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ছুটির পরিধি / কাদের জন্য প্রযোজ্য</label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={holidayAudience === "ALL"}
                        onChange={() => setHolidayAudience("ALL")}
                      />
                      <span className="font-semibold text-slate-800">মাদরাসার সকল শিক্ষার্থী ও উস্তাদ (সবাইকে ছুটি)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={holidayAudience === "CLASS"}
                        onChange={() => setHolidayAudience("CLASS")}
                      />
                      <span className="font-semibold text-slate-800">শুধুমাত্র নির্দিষ্ট জামাত</span>
                    </label>
                  </div>
                </div>

                {holidayAudience === "CLASS" && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">জামাত নির্বাচন করুন</label>
                    <select
                      value={holidayClassId}
                      onChange={(e) => setHolidayClassId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                    >
                      <option value="">-- জামাত নির্বাচন করুন --</option>
                      {leaveClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ছুটির বিবরণ / কারণ ও দিকনির্দেশনা</label>
                  <textarea
                    rows={3}
                    value={holidayReason}
                    onChange={(e) => setHolidayReason(e.target.value)}
                    placeholder="ছুটিকালীন তালিবানে ইলমদের পড়াশোনা ও আদব রক্ষার দিকনির্দেশনা..."
                    className="w-full px-3 py-2 border rounded-xl text-xs leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingHoliday}
                  className="w-full bg-[#D4AF37] hover:bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl transition shadow-md"
                >
                  {submittingHoliday ? "ঘোষণা জারি হচ্ছে..." : "সাধারণ অবকাশ ঘোষণা ও নোটিশ জারি করুন"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 3. FEE CONCESSION & ORPHAN CARE (বেতন ছাড় ও এতিম ছাত্র কল্যাণ তহবিল) */}
      {activeTab === "FEE_CONCESSION" && (
        <div className="space-y-6">
          {/* Header Bar with Concession Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 font-display">
                    মুহতামিম বিশেষ বেতন ছাড় ও এতিম ছাত্র তহবিল (Fee Concession & Orphan Care)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  কোনো ছাত্র এতিম বা অসচ্ছল হলে ইচ্ছামত যে যত বেতন দিতে পারে সেই অনুযায়ী ফি নির্ধারণ এবং ১০০% লিল্লাহ বৃত্তি অনুমোদন।
                  <b className="text-emerald-700 ml-1">মুহতামিমের আদেশে ইনভয়েস ও রসিদ স্বয়ংক্রিয়ভাবে সমন্বিত হয়।</b>
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-900 text-xs font-semibold self-start sm:self-auto">
                লিল্লাহ ও যাকাত ফান্ডের সরাসরি সমন্বয়
              </div>
            </div>

            {/* Metric Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">নিবন্ধিত এতিম শিক্ষার্থী</span>
                <span className="text-xl font-black text-slate-900">{waiverStats.totalOrphans} জন</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[11px] text-emerald-700 block">১০০% পূর্ণ ফ্রি বৃত্তি</span>
                <span className="text-xl font-black text-emerald-800">{waiverStats.fullFreeCount} জন</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-[11px] text-amber-700 block">কাস্টম ফি ও আংশিক ছাড়</span>
                <span className="text-xl font-black text-amber-800">{waiverStats.partialWaiverCount} জন</span>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <span className="text-[11px] text-purple-700 block">মাসিক মোট সাবসিডি</span>
                <span className="text-xl font-black text-purple-800 font-mono">
                  ৳ {(waiverStats.totalMonthlySubsidized || 0).toLocaleString("bn-BD")}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Set Custom Fee Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  ইচ্ছামত ছাত্রের বেতন নির্ধারণ ও ছাড় ফর্ম
                </h3>
              </div>

              {concessionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{concessionSuccess}</span>
                </div>
              )}

              {concessionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{concessionError}</span>
                </div>
              )}

              <form onSubmit={handleSaveStudentWaiver} className="space-y-4 text-xs">
                {/* Jamat filter for student selector */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">জামাত / শ্রেণি দিয়ে ফিল্টার</label>
                  <select
                    value={concessionClassFilter}
                    onChange={(e) => {
                      setConcessionClassFilter(e.target.value);
                      setConcessionStudentId("");
                    }}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-slate-800 font-medium"
                  >
                    <option value="ALL">সকল জামাত</option>
                    {waiverClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn} (নিয়মিত ফি: ৳{c.monthlyTuitionFee})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Student Selector */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">শিক্ষার্থী নির্বাচন *</label>
                  <select
                    required
                    value={concessionStudentId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setConcessionStudentId(id);
                      const std = waiverStudents.find((s) => s.id === id);
                      if (std) {
                        setConcessionIsOrphan(Boolean(std.isOrphan));
                        setConcessionIsFinanciallyWeak(Boolean(std.isFinanciallyWeak ?? true));
                        if (std.activeWaiver) {
                          if (std.activeWaiver.waiverPercentage === 100) {
                            setConcessionType("FULL_FREE");
                          } else if (std.activeWaiver.customTuitionFee !== null) {
                            setConcessionType("CUSTOM_FEE");
                            setConcessionCustomFee(std.activeWaiver.customTuitionFee);
                          }
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-xl bg-white text-slate-900 font-medium"
                  >
                    <option value="">-- ছাত্র নির্বাচন করুন --</option>
                    {waiverStudents
                      .filter((s) => concessionClassFilter === "ALL" || s.currentEnrollment?.class?.id === concessionClassFilter)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullNameBn} (দাখিলা: {s.admissionNo} {s.isOrphan ? "★ এতিম" : ""})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Display Current Status & Baseline */}
                {selectedStudentForConcession && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>জামাত:</span>
                      <b>{selectedStudentForConcession.currentEnrollment?.class?.nameBn}</b>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>নিয়মিত মাসিক বেতন:</span>
                      <b className="font-mono">৳ {baseMonthlyFee}</b>
                    </div>
                    {selectedStudentForConcession.activeWaiver && (
                      <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t">
                        <span>বর্তমান কার্যকর ছাড়:</span>
                        <span>
                          {selectedStudentForConcession.activeWaiver.waiverPercentage === 100
                            ? "সম্পূর্ণ ফ্রি (১০০%)"
                            : `ধার্য ফি ৳ ${selectedStudentForConcession.activeWaiver.customTuitionFee}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Concession Type Buttons */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">ছাড়ের ধরন ও ফি নির্ধারণ *</label>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => setConcessionType("CUSTOM_FEE")}
                      className={`p-2 rounded-xl border transition ${
                        concessionType === "CUSTOM_FEE"
                          ? "bg-emerald-800 text-white border-emerald-800 font-bold"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      কাস্টম ফি
                    </button>
                    <button
                      type="button"
                      onClick={() => setConcessionType("FULL_FREE")}
                      className={`p-2 rounded-xl border transition ${
                        concessionType === "FULL_FREE"
                          ? "bg-emerald-800 text-white border-emerald-800 font-bold"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      সম্পূর্ণ ফ্রি (১০০%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConcessionType("PERCENTAGE")}
                      className={`p-2 rounded-xl border transition ${
                        concessionType === "PERCENTAGE"
                          ? "bg-emerald-800 text-white border-emerald-800 font-bold"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      শতাংশ ছাড়
                    </button>
                  </div>
                </div>

                {/* Dynamic Input based on Type */}
                {concessionType === "CUSTOM_FEE" && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ইচ্ছামত মাসিক বেতন নির্ধারণ (টাকা) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold">৳</span>
                      <input
                        type="number"
                        min="0"
                        max="5000"
                        value={concessionCustomFee}
                        onChange={(e) => setConcessionCustomFee(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 border rounded-xl text-sm font-bold font-mono"
                        placeholder="যেমন: ২০০ বা ৩০০ বা ৫০০"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      ছাত্রটি প্রতি মাসে এই নির্ধারিত টাকা পরিশোধ করবে (বাকি অংশ লিল্লাহ ফান্ড হতে সমন্বয় হবে)।
                    </p>
                  </div>
                )}

                {concessionType === "PERCENTAGE" && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ছাড়ের হার (%) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="95"
                        step="5"
                        value={concessionPercentage}
                        onChange={(e) => setConcessionPercentage(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-xl text-sm font-bold font-mono"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                )}

                {/* Live Payable Preview */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="text-emerald-900 font-semibold">মাসিক প্রদেয় ধার্য ফি:</span>
                  <span className="text-base font-black text-emerald-900 font-mono">
                    ৳ {calculatedPayable}
                  </span>
                </div>

                {/* Status Checkboxes */}
                <div className="space-y-2 pt-1 border-t">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={concessionIsOrphan}
                      onChange={(e) => setConcessionIsOrphan(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                    />
                    <span className="text-slate-800 font-semibold">ছাত্রটি এতিম (বাবার অবর্তমানে অভিভাবকহীন)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={concessionIsFinanciallyWeak}
                      onChange={(e) => setConcessionIsFinanciallyWeak(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                    />
                    <span className="text-slate-800 font-semibold">আর্থিক অসচ্ছল পরিবার</span>
                  </label>
                </div>

                {/* Reason */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">মুহতামিমের আদেশের কারণ / নথি</label>
                  <input
                    type="text"
                    value={concessionReason}
                    onChange={(e) => setConcessionReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                    placeholder="যেমন: লিল্লাহ বোর্ডিং ও যাকাত তহবিল থেকে সমন্বয়..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingConcession}
                  className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submittingConcession ? "সংরক্ষণ হচ্ছে..." : "মুহতামিম ফি ছাড় অনুমোদন করুন (Auto-Sync)"}
                </button>
              </form>
            </div>

            {/* Right Columns: Active Concessions Directory */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-amber-600" />
                    বিশেষ ফি ছাড় ও এতিম বৃত্তিপ্রাপ্ত শিক্ষার্থীদের তালিকা ({filteredConcessions.length})
                  </h3>

                  <div className="flex items-center gap-2">
                    <select
                      value={concessionDirectoryClassFilter}
                      onChange={(e) => setConcessionDirectoryClassFilter(e.target.value)}
                      className="px-2.5 py-1.5 border rounded-lg text-xs bg-slate-50 text-slate-700"
                    >
                      <option value="ALL">সকল জামাত</option>
                      {waiverClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameBn}
                        </option>
                      ))}
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer ml-1">
                      <input
                        type="checkbox"
                        checked={concessionOnlyOrphans}
                        onChange={(e) => setConcessionOnlyOrphans(e.target.checked)}
                      />
                      <span>কেবল এতিম</span>
                    </label>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={concessionDirectorySearch}
                    onChange={(e) => setConcessionDirectorySearch(e.target.value)}
                    placeholder="ছাত্রের নাম বা দাখিলা নম্বর দিয়ে খুঁজুন..."
                    className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>

                {/* Table */}
                {loadingWaivers ? (
                  <div className="text-center py-8 text-xs text-slate-500">লোড হচ্ছে...</div>
                ) : filteredConcessions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">কোনো ছাড়প্রাপ্ত ছাত্র পাওয়া যায়নি।</div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {filteredConcessions.map((w) => {
                      const student = w.student;
                      const jamat = student?.enrollments?.[0]?.class;
                      const standardFee = jamat?.monthlyTuitionFee || 1000;
                      const payable = w.customTuitionFee !== null ? w.customTuitionFee : w.waiverPercentage === 100 ? 0 : standardFee * (1 - w.waiverPercentage / 100);

                      return (
                        <div key={w.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{student?.fullNameBn}</span>
                              <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                                {jamat?.nameBn || "সাধারণ"} | দাখিলা: {student?.admissionNo}
                              </span>
                              {(student?.isOrphan || w.isOrphan) && (
                                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  ★ এতিম
                                </span>
                              )}
                            </div>
                            <div className="text-slate-600 flex items-center gap-3">
                              <span>নিয়মিত ফি: ৳{standardFee}</span>
                              <span className="text-emerald-700 font-bold">
                                ধার্যকৃত ফি: ৳{payable} {w.waiverPercentage === 100 ? "(১০০% লিল্লাহ বৃত্তি)" : `(মওকুফ: ৳${standardFee - payable})`}
                              </span>
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              <b>কারণ:</b> {w.reason}
                            </div>
                          </div>

                          <div className="text-right text-[11px] text-slate-400 font-mono self-start sm:self-auto">
                            <span>কার্যকর: {w.approvedAt ? new Date(w.approvedAt).toLocaleDateString("bn-BD") : "বর্তমান শিক্ষাবর্ষ"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {analyticsOverview?.executiveSummary && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 text-xs leading-relaxed text-gray-800">
              <span className="font-bold text-emerald-900 block mb-1 text-sm">
                মুহতামিম তদারকি নির্বাহী সারসংক্ষেপ:
              </span>
              {analyticsOverview.executiveSummary.bn}
            </div>
          )}

          {/* Core Oversight Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-white rounded-2xl border shadow-sm">
              <span className="text-xs text-gray-500 block">মোট সক্রিয় শিক্ষার্থী</span>
              <span className="text-2xl font-bold font-serif text-gray-900">
                {analyticsOverview?.students?.active || stats?.totalStudents || 0} জন
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border shadow-sm">
              <span className="text-xs text-gray-500 block">আজকের উপস্থিতি হার</span>
              <span className="text-2xl font-bold font-serif text-teal-700">
                {analyticsOverview?.attendance?.rateToday !== undefined ? `${analyticsOverview.attendance.rateToday}%` : "৯৪%"}
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border shadow-sm">
              <span className="text-xs text-gray-500 block">আবাসিক ও ডে-কেয়ার</span>
              <span className="text-2xl font-bold font-serif text-blue-700">
                {analyticsOverview?.students?.residential || 0} / {analyticsOverview?.students?.dayCare || 0}
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border shadow-sm">
              <span className="text-xs text-gray-500 block">৫ তহবিলের সর্বমোট</span>
              <span className="text-2xl font-bold font-serif text-emerald-700">
                ৳ {(analyticsOverview?.finance?.fundsTotal || stats?.totalFundBalance || 0).toLocaleString("bn-BD")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. NOTICES */}
      {activeTab === "NOTICES" && (
        <div className="bg-white rounded-2xl border p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-[#083B25] border-b pb-2">মুহতামিমের জরুরি ঘোষণা ও সার্কুলার</h2>
          <p className="text-xs text-gray-600">
            এখান থেকে প্রেরিত ঘোষণা স্বয়ংক্রিয়ভাবে মাদরাসার লাইভ নোটিশ বোর্ডে প্রধান বার্তা হিসেবে সংরক্ষিত হবে।
          </p>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
            <p className="font-semibold">বর্তমান সক্রিয় নোটিশ: {stats?.totalNotices || 2} টি</p>
          </div>
        </div>
      )}

      {/* 6. ISSUES */}
      {activeTab === "ISSUES" && (
        <div className="bg-white rounded-2xl border p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-[#083B25] border-b pb-2">প্রশাসনিক অডিট ও ইস্যু সমাধান তালিকা</h2>
          <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
            কোনো জরুরি প্রশাসনিক অমিল বা অ্যাকাডেমিক অনিয়ম পরিলক্ষিত হয়নি। সমস্ত ফান্ড ও রোল নম্বর হালনাগাদ রয়েছে।
          </div>
        </div>
      )}

      {/* 7. REPORTS */}
      {activeTab === "REPORTS" && (
        <div className="bg-white rounded-2xl border p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-base font-bold text-[#083B25]">মাসিক অ্যাকাডেমিক ও আর্থিক রিপোর্ট</h2>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900 transition"
            >
              <Printer className="w-4 h-4" />
              প্রিন্ট / PDF ডাউনলোড
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-3 border rounded-xl flex items-center justify-between">
              <span>মার্চ ২০২৬ সার্বিক আর্থিক নিরীক্ষা ও লিল্লাহ ফান্ড ব্যয় রিপোর্ট</span>
              <span className="text-[#0D5C3A] font-bold">নিরীক্ষিত (Audited)</span>
            </div>
            <div className="p-3 border rounded-xl flex items-center justify-between">
              <span>প্রথম সাময়িক পরীক্ষা প্রস্তুতি ও সিলেবাস সম্পন্ন রিপোর্ট</span>
              <span className="text-[#0D5C3A] font-bold">অনুমোদিত (Approved)</span>
            </div>
          </div>
        </div>
      )}

      {/* 8. OPERATIONS */}
      {activeTab === "OPERATIONS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border shadow-sm">
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition"
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
        </div>
      )}
    </PrincipalShell>
  );
}
