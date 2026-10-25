"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Home,
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  Award,
  DollarSign,
  FileText,
  ShieldCheck,
  Search,
  Bell,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  QrCode,
  Printer,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Send,
  DoorOpen,
  Building,
  Heart,
  Phone,
  HelpCircle,
  Smartphone,
  ExternalLink,
  Sliders,
  Check,
  Download,
  Share2,
  Lock,
  UserCheck,
  Eye,
  Filter,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function WebAppSuitePage() {
  // Global States
  const [activeTab, setActiveTab] = useState<string>("DASHBOARD");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Module Data States
  const [moduleData, setModuleData] = useState<{
    students?: any[];
    invoices?: any[];
    financeSummary?: any;
    applications?: any[];
    notices?: any[];
    gatepasses?: any[];
    classes?: any[];
    exams?: any[];
  }>({});
  const [loadingModule, setLoadingModule] = useState(false);

  // Filter & Search States
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("ALL");
  const [feeStatusFilter, setFeeStatusFilter] = useState("ALL");
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState("ALL");

  // Selection & Profile Modals
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<any>(null);
  const [selectedNoticeDetail, setSelectedNoticeDetail] = useState<any>(null);

  // Quick Action Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Fee Modal State
  const [feeForm, setFeeForm] = useState({
    studentName: "মুহাম্মদ আব্দুল্লাহ আল মামুন",
    rollNumber: "EHRJ-2026-0001",
    feeType: "মাসিক বেতন ও খোরাকি ফি",
    amount: "1200",
    paymentMethod: "BKASH",
    trxId: "",
  });
  const [feeReceipt, setFeeReceipt] = useState<any>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  // Result Search Modal State
  const [resultRoll, setResultRoll] = useState("EHRJ-2026-0001");
  const [resultClass, setResultClass] = useState("HIFZ");
  const [searchResultData, setSearchResultData] = useState<any>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  // Admission Modal State
  const [admForm, setAdmForm] = useState({
    studentNameBn: "মুহাম্মদ তাওহীদ",
    guardianName: "মুহাম্মদ রফিকুল ইসলাম",
    guardianPhone: "01711998877",
    desiredClass: "হিফজুল কুরআন বিভাগ",
  });
  const [admResult, setAdmResult] = useState<any>(null);
  const [admLoading, setAdmLoading] = useState(false);

  // Gatepass Modal State
  const [gpForm, setGpForm] = useState({
    studentId: "",
    reason: "জরুরি পারিবারিক প্রয়োজনে বাড়িতে গমন",
    destination: "দাউদকান্দি, কুমিল্লা",
    expectedReturnHours: "24",
  });
  const [gpLoading, setGpLoading] = useState(false);

  // Attendance Sheet State
  const [attendanceClass, setAttendanceClass] = useState("হিফজুল কুরআন");
  const [attendanceRoster, setAttendanceRoster] = useState([
    { id: 1, roll: 101, name: "মুহাম্মদ আব্দুল্লাহ", status: "PRESENT" },
    { id: 2, roll: 102, name: "মুহাম্মদ মাহমুদ হাসান", status: "PRESENT" },
    { id: 3, roll: 103, name: "আহমাদুল্লাহ আল-মামুন", status: "ABSENT" },
    { id: 4, roll: 104, name: "মুহাম্মদ উসমান গণি", status: "PRESENT" },
    { id: 5, roll: 105, name: "হুসাইন মুহাম্মদ যোবায়ের", status: "LEAVE" },
    { id: 6, roll: 106, name: "আব্দুর রহমান শাকিল", status: "PRESENT" },
  ]);
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  // Prayer Timetable
  const prayers = [
    { name: "ফজর (Fajr)", time: "০৪:২৫ AM", active: false },
    { name: "যোহর (Dhuhr)", time: "১২:০৫ PM", active: false },
    { name: "আসর (Asr)", time: "০৪:৩০ PM", active: false },
    { name: "মাগরিব (Maghrib)", time: "০৫:১৮ PM", active: false },
    { name: "এশা (Isha)", time: "০৭:৪০ PM", active: true },
    { name: "জুমু'আ (Jummah)", time: "০১:১৫ PM", active: false },
  ];

  // Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("bn-BD", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("bn-BD", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Current User & Stats on Mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    fetch("/api/app/quick-stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));

    fetch("/api/app/module-data?module=CLASSES")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setModuleData((prev) => ({ ...prev, classes: data.data.classes }));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch module data whenever active tab or primary filters change
  const fetchModuleData = async (targetModule: string) => {
    if (targetModule === "DASHBOARD" || targetModule === "SETTINGS") return;
    setLoadingModule(true);
    try {
      let url = `/api/app/module-data?module=${targetModule}`;
      if (targetModule === "STUDENTS") {
        if (selectedClassFilter !== "ALL") url += `&classId=${selectedClassFilter}`;
        if (studentSearch.trim()) url += `&search=${encodeURIComponent(studentSearch.trim())}`;
      } else if (targetModule === "FEES") {
        if (feeStatusFilter !== "ALL") url += `&status=${feeStatusFilter}`;
      } else if (targetModule === "NOTICES") {
        if (noticeCategoryFilter !== "ALL") url += `&category=${noticeCategoryFilter}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setModuleData((prev) => ({
          ...prev,
          ...(targetModule === "STUDENTS" ? { students: json.data.students } : {}),
          ...(targetModule === "FEES" ? { invoices: json.data.invoices, financeSummary: json.data.summary } : {}),
          ...(targetModule === "ADMISSIONS" ? { applications: json.data.applications } : {}),
          ...(targetModule === "NOTICES" ? { notices: json.data.notices } : {}),
          ...(targetModule === "GATEPASS" ? { gatepasses: json.data.gatepasses } : {}),
          ...(targetModule === "EXAMS" ? { exams: json.data.exams } : {}),
        }));
      }
    } catch (e) {
      console.error("Module data fetch error:", e);
    } finally {
      setLoadingModule(false);
    }
  };

  useEffect(() => {
    fetchModuleData(activeTab);
  }, [activeTab, selectedClassFilter, feeStatusFilter, noticeCategoryFilter]);

  // Role Switcher Handler (Safe logout supported)
  const handleSwitchRole = async (targetRole: string) => {
    setSwitchingRole(true);
    setFeedbackMsg(`${targetRole} মোডে রূপান্তর হচ্ছে...`);
    try {
      const res = await fetch("/api/app/quick-persona-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user || null);
        setFeedbackMsg(data.message);
        setTimeout(() => setFeedbackMsg(null), 3000);
      } else {
        setFeedbackMsg(data.error || "রূপান্তর করতে ব্যর্থ হয়েছে");
      }
    } catch (e: any) {
      setFeedbackMsg("প্রক্রিয়া ব্যর্থ: " + e.message);
    } finally {
      setSwitchingRole(false);
    }
  };

  // Quick Fee Submission
  const handleGenerateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeeLoading(true);
    setFeeError(null);
    try {
      const res = await fetch("/api/app/quick-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_FEE_RECEIPT",
          payload: feeForm,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeeReceipt(data.receipt);
        fetchModuleData("FEES");
      } else {
        setFeeError(data.error || "পেমেন্ট সম্পন্ন করা সম্ভব হয়নি।");
      }
    } catch (err: any) {
      setFeeError("নেটওয়ার্ক ত্রুটি: " + err.message);
    } finally {
      setFeeLoading(false);
    }
  };

  // Quick Result Search
  const handleSearchResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultLoading(true);
    setResultError(null);
    setSearchResultData(null);
    try {
      const res = await fetch("/api/app/quick-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEARCH_RESULT",
          payload: { rollNumber: resultRoll, classCode: resultClass },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSearchResultData(data);
      } else {
        setResultError(data.error || "ফলাফল পাওয়া যায়নি");
      }
    } catch (err: any) {
      setResultError("অনুসন্ধান ব্যর্থ: " + err.message);
    } finally {
      setResultLoading(false);
    }
  };

  // Quick Admission Application
  const handleQuickAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdmLoading(true);
    try {
      const res = await fetch("/api/app/quick-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_ADMISSION_QUICK",
          payload: admForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdmResult(data);
        fetchModuleData("ADMISSIONS");
      } else {
        alert(data.error || "আবেদন ব্যর্থ হয়েছে");
      }
    } catch (err: any) {
      alert("আবেদন ব্যর্থ: " + err.message);
    } finally {
      setAdmLoading(false);
    }
  };

  // Admission Status Update (Admin action)
  const handleUpdateAdmissionStatus = async (applicationId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/app/module-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ADMISSION_STATUS",
          payload: { applicationId, newStatus, remarks: "ওয়েব অ্যাপ অ্যাডমিন কর্তৃক পরিবর্তিত" },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg(data.message);
        setTimeout(() => setFeedbackMsg(null), 3000);
        fetchModuleData("ADMISSIONS");
      } else {
        alert(data.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ");
      }
    } catch (e: any) {
      alert("ত্রুটি: " + e.message);
    }
  };

  // Gatepass Issuance
  const handleIssueGatepass = async (e: React.FormEvent) => {
    e.preventDefault();
    setGpLoading(true);
    try {
      const res = await fetch("/api/app/module-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ISSUE_GATEPASS",
          payload: gpForm,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg(data.message);
        setActiveModal(null);
        setTimeout(() => setFeedbackMsg(null), 3000);
        fetchModuleData("GATEPASS");
      } else {
        alert(data.error || "গেটপাস ইস্যু ব্যর্থ");
      }
    } catch (e: any) {
      alert("ত্রুটি: " + e.message);
    } finally {
      setGpLoading(false);
    }
  };

  // Attendance Sheet Save with Offline Fallback
  const saveAttendanceSheet = async () => {
    try {
      if (typeof window !== "undefined" && !navigator.onLine) {
        const offlineQueue = JSON.parse(localStorage.getItem("ehrj_offline_attendance") || "[]");
        offlineQueue.push({
          date: new Date().toISOString(),
          class: attendanceClass,
          roster: attendanceRoster,
          timestamp: Date.now(),
        });
        localStorage.setItem("ehrj_offline_attendance", JSON.stringify(offlineQueue));
        setAttendanceSaved(true);
        setFeedbackMsg("অফলাইন ড্রাফট হিসেবে সংরক্ষিত হয়েছে! ইন্টারনেট সংযুক্ত হলে স্বয়ংক্রিয় সিঙ্ক হবে।");
        setTimeout(() => setFeedbackMsg(null), 4000);
        return;
      }

      const res = await fetch("/api/app/quick-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SAVE_ATTENDANCE",
          payload: {
            records: attendanceRoster.map((item) => ({
              id: item.id,
              status: item.status,
            })),
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAttendanceSaved(true);
        setFeedbackMsg(data.message || "হাজিরা শিট কেন্দ্রীয় ডাটাবেসে সফলভাবে সংরক্ষিত হয়েছে!");
        setTimeout(() => setFeedbackMsg(null), 3000);
      } else {
        const offlineQueue = JSON.parse(localStorage.getItem("ehrj_offline_attendance") || "[]");
        offlineQueue.push({
          date: new Date().toISOString(),
          class: attendanceClass,
          roster: attendanceRoster,
          timestamp: Date.now(),
        });
        localStorage.setItem("ehrj_offline_attendance", JSON.stringify(offlineQueue));
        setAttendanceSaved(true);
        setFeedbackMsg(data.error || "হাজিরা শিট ড্রাফট হিসেবে সংরক্ষিত হয়েছে।");
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err: any) {
      const offlineQueue = JSON.parse(localStorage.getItem("ehrj_offline_attendance") || "[]");
      offlineQueue.push({
        date: new Date().toISOString(),
        class: attendanceClass,
        roster: attendanceRoster,
        timestamp: Date.now(),
      });
      localStorage.setItem("ehrj_offline_attendance", JSON.stringify(offlineQueue));
      setAttendanceSaved(true);
      setFeedbackMsg("অফলাইন ড্রাফট সংরক্ষিত হয়েছে!");
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const toggleAttendanceStatus = (id: number) => {
    setAttendanceRoster((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus =
            item.status === "PRESENT"
              ? "ABSENT"
              : item.status === "ABSENT"
              ? "LEAVE"
              : "PRESENT";
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
    setAttendanceSaved(false);
  };

  const markAllPresent = () => {
    setAttendanceRoster((prev) =>
      prev.map((item) => ({ ...item, status: "PRESENT" }))
    );
    setAttendanceSaved(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4] text-[#0B1914] flex flex-col font-sans">
      {/* =========================================================
          1. TOP APP APPLICATION BAR (App Header)
      ========================================================= */}
      <header className="sticky top-0 z-40 bg-[#041F14] text-white border-b border-emerald-900/60 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand & App Mode Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#D4AF37]/60 shadow bg-white p-0.5">
                <Image
                  src="/images/logo.jpg"
                  alt="EHRJ Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base sm:text-lg tracking-tight">
                    {INSTITUTION_INFO.nameBn}
                  </span>
                  <span className="bg-[#D4AF37] text-[#041F14] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    ওয়েব অ্যাপ
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300/80 font-bangla hidden sm:block">
                  ইআরপি ডিজিটাল ক্যাম্পাস প্ল্যাটফর্ম
                </p>
              </div>
            </Link>
          </div>

          {/* Live Synchronized Clock & Prayer Indicator */}
          <div className="hidden md:flex items-center gap-3 bg-emerald-950/80 px-3.5 py-1.5 rounded-xl border border-emerald-800/60 text-xs">
            <Clock className="w-4 h-4 text-[#D4AF37] animate-pulse" />
            <div>
              <div className="text-[#D4AF37] font-mono font-bold tracking-wider">
                {currentTime || "১২:০০:০০ PM"}
              </div>
              <div className="text-[10px] text-emerald-200/90">{currentDate}</div>
            </div>
            <div className="h-6 w-px bg-emerald-800 mx-1"></div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-300 block">বর্তমান ওয়াক্ত</span>
              <span className="text-xs font-bold text-white">এশা (Isha)</span>
            </div>
          </div>

          {/* Right Header Controls: Persona Switcher & Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Authenticated User Status or Login Controls */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-emerald-900/80 text-emerald-100 text-xs px-3 py-1.5 rounded-xl border border-emerald-700/60 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#041F14] font-bold flex items-center justify-center text-[10px]">
                  {currentUser.name ? currentUser.name.slice(0, 1) : "U"}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="font-bold text-white text-[11px] leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[9px] text-[#D4AF37] font-mono leading-none">
                    {currentUser.role}
                  </div>
                </div>
                <Link
                  href={
                    currentUser.role === "ADMIN"
                      ? "/admin"
                      : currentUser.role === "TEACHER"
                      ? "/teacher"
                      : "/guardian"
                  }
                  className="bg-emerald-800 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg ml-1 transition"
                >
                  ড্যাশবোর্ড
                </Link>
                <button
                  onClick={() => handleSwitchRole("LOGOUT")}
                  disabled={switchingRole}
                  title="লগআউট"
                  className="bg-red-900/60 hover:bg-red-800 text-red-200 text-[10px] px-2 py-1 rounded-lg transition"
                >
                  লগআউট
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="bg-emerald-950 text-emerald-300 text-[10px] font-medium px-2 py-1 rounded-lg border border-emerald-800/60 hidden sm:inline-block">
                  পাবলিক মোড
                </span>
                <div className="relative group">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#041F14] text-xs font-bold px-3 py-1.5 rounded-xl transition shadow"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>লগইন করুন</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-emerald-950/10 p-2 hidden group-hover:block transition-all z-50 text-gray-800">
                    <div className="text-[11px] font-bold text-gray-500 px-3 py-1.5 uppercase tracking-wider border-b border-gray-100">
                      লগইন পোর্টাল নির্বাচন
                    </div>
                    <Link
                      href="/login/admin"
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-emerald-50 text-emerald-900 font-bold flex items-center justify-between transition"
                    >
                      <span>অ্যাডমিন লগইন</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">ADMIN</span>
                    </Link>
                    <Link
                      href="/login/teacher"
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-blue-50 text-blue-900 font-bold flex items-center justify-between transition"
                    >
                      <span>শিক্ষক লগইন</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">TEACHER</span>
                    </Link>
                    <Link
                      href="/login/guardian"
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-amber-50 text-amber-900 font-bold flex items-center justify-between transition"
                    >
                      <span>অভিভাবক লগইন</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">GUARDIAN</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Back to Website Button */}
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#041F14] text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow"
            >
              <Home className="w-3.5 h-3.5" />
              <span>ওয়েবসাইট</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Feedback Toast Notification */}
      {feedbackMsg && (
        <div className="bg-emerald-800 text-white text-xs px-4 py-2.5 shadow-md flex items-center justify-center gap-2 sticky top-16 z-30 transition-all">
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* =========================================================
          2. MAIN APPLICATION WORKSPACE
      ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Module Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200">
          {[
            { id: "DASHBOARD", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
            { id: "STUDENTS", label: "শিক্ষার্থী তালিকা", icon: Users },
            { id: "FEES", label: "বেতন ও ফি হিসাব", icon: DollarSign },
            { id: "ATTENDANCE", label: "দৈনিক হাজিরা", icon: Calendar },
            { id: "EXAMS", label: "পরীক্ষা ও ফলাফল", icon: Award },
            { id: "ADMISSIONS", label: "ভর্তি আবেদন", icon: GraduationCap },
            { id: "NOTICES", label: "নোটিশ বোর্ড", icon: Bell },
            { id: "GATEPASS", label: "গেটপাস ব্যবস্থাপনা", icon: DoorOpen },
            { id: "SETTINGS", label: "সেটিংস ও রিপোর্ট", icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  isActive
                    ? "bg-[#0D5C3A] text-white shadow-md shadow-emerald-950/20"
                    : "bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 border border-gray-200/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#D4AF37]" : "text-gray-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =========================================================
            TAB 1: DASHBOARD OVERVIEW
        ========================================================= */}
        {activeTab === "DASHBOARD" && (
          <div className="space-y-6">
            {/* Top Banner: Web App Hero Cockpit */}
            <div className="bg-gradient-to-r from-[#041F14] via-[#0D5C3A] to-[#041F14] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-full text-xs text-[#D4AF37] mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদরাসা ইআরপি</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-bangla">
                    একটি পূর্ণাঙ্গ ডিজিটাল ক্যাম্পাস ওয়েব অ্যাপ
                  </h1>
                  <p className="text-emerald-200/90 text-sm mt-1 max-w-2xl font-bangla">
                    ভর্তি আবেদন, ফি পরিশোধ ও রসিদ তৈরি, ফলাফল যাচাই, ক্লাসের হাজিরা শিট এবং স্টুডেন্ট আইডি কার্ড—সকল প্রাতিষ্ঠানিক কার্যক্রম এক ক্লিকে সরাসরি সম্পন্ন করুন।
                  </p>
                </div>

                {/* Quick Action Buttons Group */}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setActiveModal("FEE_PAYMENT")}
                    className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#041F14] font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-lg transition flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>ফি ও রসিদ পরিশোধ</span>
                  </button>

                  <button
                    onClick={() => setActiveModal("RESULT_SEARCH")}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-white/20 shadow transition flex items-center gap-2"
                  >
                    <Award className="w-4 h-4 text-[#D4AF37]" />
                    <span>ফলাফল অনুসন্ধান</span>
                  </button>
                </div>
              </div>

              {/* Instant KPI Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-emerald-800/50">
                <div className="bg-emerald-950/50 rounded-2xl p-3 border border-emerald-800/40">
                  <span className="text-[11px] text-emerald-300 block">মোট শিক্ষার্থী</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#D4AF37] font-mono">
                    {loadingStats ? "..." : (stats?.students || 185)}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">সক্রিয় অধ্যয়নরত</span>
                </div>
                <div className="bg-emerald-950/50 rounded-2xl p-3 border border-emerald-800/40">
                  <span className="text-[11px] text-emerald-300 block">উস্তাদ ও স্টাফ</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                    {loadingStats ? "..." : (stats?.employees || 16)}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">অন-ডিউটি শিক্ষক</span>
                </div>
                <div className="bg-emerald-950/50 rounded-2xl p-3 border border-emerald-800/40">
                  <span className="text-[11px] text-emerald-300 block">জামাত / শ্রেণি</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                    {loadingStats ? "..." : (stats?.classes || 18)}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">নূরানী, হিফজ ও কিতাব</span>
                </div>
                <div className="bg-emerald-950/50 rounded-2xl p-3 border border-emerald-800/40">
                  <span className="text-[11px] text-emerald-300 block">সেশন ২০২৬ আদায়</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#D4AF37] font-mono">
                    ৳ ১৪১,২০০
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">মোট বিলিং: ৳ ৪২৪,০৯৫</span>
                </div>
              </div>
            </div>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { title: "বেতন ও ফি পরিশোধ", subtitle: "ডিজিটাল মানি রিসিট", icon: DollarSign, color: "text-emerald-700 bg-emerald-100", modal: "FEE_PAYMENT" },
                { title: "মার্কশিট ও রেজাল্ট", subtitle: "টার্ম পরীক্ষা ২০২৬", icon: Award, color: "text-amber-700 bg-amber-100", modal: "RESULT_SEARCH" },
                { title: "ভর্তি আবেদন", subtitle: "অনলাইন ফরম দাখিল", icon: GraduationCap, color: "text-blue-700 bg-blue-100", modal: "ADMISSION_APPLY" },
                { title: "দৈনিক ক্লাস হাজিরা", subtitle: "শিক্ষক স্পট চেকিং", icon: Calendar, color: "text-purple-700 bg-purple-100", modal: "ATTENDANCE_SHEET" },
                { title: "নামাজের সময়সূচি", subtitle: "আজকের ৫ ওয়াক্ত", icon: Clock, color: "text-teal-700 bg-teal-100", modal: "PRAYER_SCHEDULE" },
                { title: "স্টুডেন্ট আইডি কার্ড", subtitle: "QR ভেরিফাইড ব্যাজ", icon: QrCode, color: "text-indigo-700 bg-indigo-100", modal: "ID_CARD_PREVIEW" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveModal(item.modal)}
                    className="bg-white rounded-2xl p-4 border border-gray-200/80 hover:border-emerald-500 shadow-sm hover:shadow-md transition text-left flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-emerald-800 transition">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Synchronized Prayer Schedule Section */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-[#0D5C3A]">
                  <Clock className="w-5 h-5 stroke-[2.5]" />
                  <h3 className="text-base font-extrabold">দৈনিক নামাজের ওয়াক্ত ও জামাতের সময়সূচি</h3>
                </div>
                <span className="text-[11px] text-gray-500 font-medium">কুমিল্লা স্থানীয় সময়</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {prayers.map((p, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-3.5 border transition ${
                      p.active
                        ? "bg-emerald-50 border-emerald-400 text-emerald-950 shadow-sm"
                        : "bg-gray-50/60 border-gray-200/60 text-gray-700"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold">{p.name}</span>
                      {p.active && (
                        <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded-full">
                          চলমান
                        </span>
                      )}
                    </div>
                    <span className="text-sm sm:text-base font-extrabold font-mono text-gray-900">
                      {p.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: STUDENTS DIRECTORY
        ========================================================= */}
        {activeTab === "STUDENTS" && (
          <div className="space-y-4">
            {/* Search and Filters Header */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="ছাত্রের নাম বা আইডি দিয়ে খুঁজুন..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchModuleData("STUDENTS")}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="text-xs py-2 px-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="ALL">সকল বিভাগ ও শ্রেণি</option>
                  {moduleData.classes?.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameBn}</option>
                  ))}
                </select>

                <button
                  onClick={() => fetchModuleData("STUDENTS")}
                  className="bg-[#0D5C3A] text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>ফিল্টার</span>
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#0D5C3A]">
                  <Users className="w-5 h-5 stroke-[2.5]" />
                  <h3 className="text-base font-extrabold">অধ্যয়নরত শিক্ষার্থী ডিরেক্টরি (১৮৫ জন)</h3>
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  প্রদর্শিত: {moduleData.students?.length || 0} জন
                </span>
              </div>

              {loadingModule ? (
                <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>শিক্ষার্থীদের তালিকা লোড হচ্ছে...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 text-[11px]">
                      <tr>
                        <th className="p-3">আইডি / রোল</th>
                        <th className="p-3">শিক্ষার্থীর নাম</th>
                        <th className="p-3">বিভাগ / শ্রেণি</th>
                        <th className="p-3">অভিভাবক ও মোবাইল</th>
                        <th className="p-3 text-center">আবাসন ধরন</th>
                        <th className="p-3 text-right">কার্যক্রম</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {moduleData.students?.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50 transition">
                          <td className="p-3 font-mono font-bold text-emerald-900">{s.studentId}</td>
                          <td className="p-3">
                            <div className="font-bold text-gray-900">{s.nameBn}</div>
                            <div className="text-[10px] text-gray-500">{s.nameEn}</div>
                          </td>
                          <td className="p-3">
                            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[11px] font-medium">
                              {s.className}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="text-gray-900">{s.fatherName}</div>
                            <div className="text-[10px] font-mono text-gray-500">{s.guardianPhone}</div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.residentialStatus === "RESIDENTIAL"
                                ? "bg-purple-100 text-purple-900"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {s.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedStudentProfile(s)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>প্রোফাইল</span>
                              </button>
                              <button
                                onClick={() => setActiveModal("ID_CARD_PREVIEW")}
                                className="bg-emerald-800 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1"
                              >
                                <QrCode className="w-3 h-3" />
                                <span>আইডি কার্ড</span>
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
          </div>
        )}

        {/* =========================================================
            TAB 3: FEES & FINANCE
        ========================================================= */}
        {activeTab === "FEES" && (
          <div className="space-y-4">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
                <span className="text-xs text-gray-500 font-bold block">মোট নির্ধারিত বিলিং</span>
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-mono">
                  ৳ {(moduleData.financeSummary?.totalInvoiced || 424095).toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">৩৮৫টি ইনভয়েস অন্তর্ভুক্ত</span>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-sm bg-emerald-50/40">
                <span className="text-xs text-emerald-800 font-bold block">মোট সংগৃহীত ফি</span>
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-800 font-mono">
                  ৳ {(moduleData.financeSummary?.totalCollected || 141200).toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">ব্যাংক ও স্পট কালেকশন</span>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-sm bg-amber-50/40">
                <span className="text-xs text-amber-800 font-bold block">অবশিষ্ট মোট বকেয়া</span>
                <span className="text-xl sm:text-2xl font-extrabold text-amber-900 font-mono">
                  ৳ {(moduleData.financeSummary?.totalDue || 282895).toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5">আদায় প্রক্রিয়াধীন</span>
              </div>
            </div>

            {/* Filter and Invoices Table */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[#0D5C3A]">
                  <DollarSign className="w-5 h-5 stroke-[2.5]" />
                  <h3 className="text-base font-extrabold">শিক্ষার্থী ফি ইনভয়েস ও রসিদ রেজিস্টার</h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 p-0.5 rounded-xl text-xs font-bold">
                    {["ALL", "PAID", "UNPAID"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFeeStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          feeStatusFilter === st
                            ? "bg-white text-emerald-950 shadow-sm"
                            : "text-gray-600 hover:text-black"
                        }`}
                      >
                        {st === "ALL" ? "সকল" : st === "PAID" ? "পরিশোধিত" : "বকেয়া"}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveModal("FEE_PAYMENT")}
                    className="bg-[#0D5C3A] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ফি আদায় করুন</span>
                  </button>
                </div>
              </div>

              {loadingModule ? (
                <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>ইনভয়েস তালিকা লোড হচ্ছে...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 text-[11px]">
                      <tr>
                        <th className="p-3">ইনভয়েস নং</th>
                        <th className="p-3">শিক্ষার্থী ও বিভাগ</th>
                        <th className="p-3">ফি’র বিবরণ</th>
                        <th className="p-3 text-right">নিট প্রদেয়</th>
                        <th className="p-3 text-right">পরিশোধিত</th>
                        <th className="p-3 text-right">বকেয়া</th>
                        <th className="p-3 text-center">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {moduleData.invoices?.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50 transition">
                          <td className="p-3 font-mono font-bold text-emerald-900">{inv.invoiceNumber}</td>
                          <td className="p-3">
                            <div className="font-bold text-gray-900">{inv.studentName}</div>
                            <div className="text-[10px] text-gray-500">{inv.className}</div>
                          </td>
                          <td className="p-3 text-gray-700">{inv.title}</td>
                          <td className="p-3 text-right font-mono font-bold">৳ {inv.netAmount.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono text-emerald-700 font-bold">৳ {inv.paidAmount.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono text-amber-800 font-bold">৳ {inv.dueAmount.toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.status === "PAID"
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-amber-100 text-amber-900"
                            }`}>
                              {inv.status === "PAID" ? "পরিশোধিত" : "বকেয়া"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: ATTENDANCE MANAGEMENT
        ========================================================= */}
        {activeTab === "ATTENDANCE" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[#0D5C3A]">
                <Calendar className="w-5 h-5 stroke-[2.5]" />
                <h3 className="text-base font-extrabold">দৈনিক ডিজিটাল ক্লাসরুম হাজিরা শিট</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllPresent}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold px-3 py-1.5 rounded-xl transition"
                >
                  সকল উপস্থিত
                </button>
                <button
                  onClick={saveAttendanceSheet}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{attendanceSaved ? "সংরক্ষিত ✓" : "হাজিরা সেভ করুন"}</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {attendanceRoster.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 hover:bg-gray-50 text-xs transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-gray-100 text-gray-800 font-mono font-bold flex items-center justify-center text-xs">
                        {item.roll}
                      </span>
                      <span className="font-bold text-gray-900">{item.name}</span>
                    </div>

                    <button
                      onClick={() => toggleAttendanceStatus(item.id)}
                      className={`px-3 py-1 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                        item.status === "PRESENT"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : item.status === "ABSENT"
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      <span>{item.status === "PRESENT" ? "উপস্থিত" : item.status === "ABSENT" ? "অনুপস্থিত" : "ছুটি"}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 5: EXAMS & RESULTS
        ========================================================= */}
        {activeTab === "EXAMS" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[#0D5C3A]">
                <Award className="w-5 h-5 stroke-[2.5]" />
                <h3 className="text-base font-extrabold">পরীক্ষা মূল্যায়ন ও ফলাফল সেন্টার</h3>
              </div>
              <button
                onClick={() => setActiveModal("RESULT_SEARCH")}
                className="bg-[#0D5C3A] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Search className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>অনলাইন মার্কশিট খুঁজুন</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {moduleData.exams?.map((e) => (
                <div key={e.id} className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">{e.nameBn}</h4>
                      <p className="text-[11px] text-gray-500">{e.nameEn}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {e.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 flex justify-between pt-2 border-t border-gray-100">
                    <span>সময়কাল: {e.startDate} হতে {e.endDate}</span>
                    <span className="font-bold text-emerald-900 font-mono">নম্বর এন্ট্রি: {e.marksCount}টি</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 6: ADMISSION APPLICATIONS
        ========================================================= */}
        {activeTab === "ADMISSIONS" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[#0D5C3A]">
                <GraduationCap className="w-5 h-5 stroke-[2.5]" />
                <h3 className="text-base font-extrabold">অনলাইন ভর্তি আবেদন রেজিস্টার</h3>
              </div>
              <button
                onClick={() => setActiveModal("ADMISSION_APPLY")}
                className="bg-[#0D5C3A] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>নতুন আবেদন দাখিল</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 text-[11px]">
                    <tr>
                      <th className="p-3">ট্র্যাকিং কোড</th>
                      <th className="p-3">শিক্ষার্থী ও অভিভাবক</th>
                      <th className="p-3">আবেদনের শ্রেণি</th>
                      <th className="p-3">মোবাইল নম্বর</th>
                      <th className="p-3 text-center">স্ট্যাটাস</th>
                      {currentUser?.role === "ADMIN" && <th className="p-3 text-right">অ্যাডমিন অ্যাকশন</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {moduleData.applications?.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 transition">
                        <td className="p-3 font-mono font-bold text-emerald-900">{app.trackingCode}</td>
                        <td className="p-3">
                          <div className="font-bold text-gray-900">{app.studentName}</div>
                          <div className="text-[10px] text-gray-500">অভিভাবক: {app.guardianName}</div>
                        </td>
                        <td className="p-3 text-gray-700">{app.desiredClass}</td>
                        <td className="p-3 font-mono text-gray-600">{app.guardianPhone}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            app.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        {currentUser?.role === "ADMIN" && (
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateAdmissionStatus(app.id, "APPROVED")}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-1 rounded text-[10px] font-bold"
                              >
                                অনুমোদন
                              </button>
                              <button
                                onClick={() => handleUpdateAdmissionStatus(app.id, "REJECTED")}
                                className="bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded text-[10px] font-bold"
                              >
                                বাতিল
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 7: NOTICES & CIRCULARS
        ========================================================= */}
        {activeTab === "NOTICES" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0D5C3A]">
                <Bell className="w-5 h-5 stroke-[2.5]" />
                <h3 className="text-base font-extrabold">প্রাতিষ্ঠানিক নোটিশ বোর্ড</h3>
              </div>
              <div className="flex bg-gray-100 p-0.5 rounded-xl text-xs font-bold">
                {["ALL", "EXAM", "HOLIDAY", "GENERAL"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNoticeCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      noticeCategoryFilter === cat ? "bg-white text-emerald-950 shadow-sm" : "text-gray-600"
                    }`}
                  >
                    {cat === "ALL" ? "সকল" : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {moduleData.notices?.map((n) => (
                <div key={n.id} className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{n.title}</h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      {n.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs line-clamp-2">{n.content}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-[10px] text-gray-500">
                    <span>তারিখ: {n.date}</span>
                    <button
                      onClick={() => setSelectedNoticeDetail(n)}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      বিস্তারিত পড়ুন →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 8: GATEPASS MANAGEMENT
        ========================================================= */}
        {activeTab === "GATEPASS" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0D5C3A]">
                <DoorOpen className="w-5 h-5 stroke-[2.5]" />
                <h3 className="text-base font-extrabold">ক্যাম্পাস গেটপাস ও প্রস্থান লগ</h3>
              </div>
              {["ADMIN", "TEACHER", "PRINCIPAL"].includes(currentUser?.role) && (
                <button
                  onClick={() => setActiveModal("GATEPASS_ISSUE")}
                  className="bg-[#0D5C3A] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow"
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>গেটপাস ইস্যু</span>
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 text-[11px]">
                  <tr>
                    <th className="p-3">পাস নম্বর</th>
                    <th className="p-3">শিক্ষার্থী</th>
                    <th className="p-3">গন্তব্য ও কারণ</th>
                    <th className="p-3">প্রস্থানের তারিখ</th>
                    <th className="p-3 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {moduleData.gatepasses?.map((gp) => (
                    <tr key={gp.id} className="hover:bg-gray-50 transition">
                      <td className="p-3 font-mono font-bold text-emerald-900">{gp.passNumber}</td>
                      <td className="p-3 font-bold text-gray-900">{gp.studentName}</td>
                      <td className="p-3 text-gray-700">{gp.destination} ({gp.reason})</td>
                      <td className="p-3 font-mono text-gray-600">{gp.issuedAt}</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {gp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 9: SYSTEM SETTINGS & REPORTS
        ========================================================= */}
        {activeTab === "SETTINGS" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[#0D5C3A] pb-3 border-b border-gray-100">
                <Sliders className="w-5 h-5 stroke-[2.5]" />
                <h3 className="text-base font-extrabold">সিস্টেম কনফিগারেশন ও ডাটাবেস স্ট্যাটাস</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                  <span className="text-gray-500 font-bold block">প্রাতিষ্ঠানিক পরিচয়</span>
                  <div className="font-extrabold text-sm text-gray-900">{INSTITUTION_INFO.nameBn}</div>
                  <div className="text-gray-600">{INSTITUTION_INFO.addressBn}</div>
                  <div className="text-gray-600">যোগাযোগ: {INSTITUTION_INFO.phones?.join(", ") || "০১৮১১-৯৯৯৯৯৯"}</div>
                </div>

                <div className="p-4 bg-emerald-50/60 rounded-2xl space-y-2 border border-emerald-200/60">
                  <span className="text-emerald-800 font-bold block">সক্রিয় ডাটাবেস নোড</span>
                  <div className="font-mono font-extrabold text-emerald-950 text-sm">Port 3000 SQLite Master (Active)</div>
                  <div className="text-gray-600">মোট শিক্ষার্থী: ১৮৫ জন • ইনভয়েস: ৩৮৫টি</div>
                  <div className="text-emerald-700 font-bold">স্ট্যাটাস: শতভাগ ডেটা অক্ষুণ্ণ ও সিঙ্কড ✓</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* =========================================================
          MODALS SECTION (Interactive Actions)
      ========================================================= */}

      {/* MODAL 1: FEE PAYMENT & VOUCHER GENERATOR */}
      {activeModal === "FEE_PAYMENT" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setActiveModal(null);
                setFeeReceipt(null);
              }}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
            >
              ✕
            </button>

            {!feeReceipt ? (
              <div>
                <div className="flex items-center gap-2 mb-4 text-[#0D5C3A]">
                  <DollarSign className="w-6 h-6 stroke-[2.5]" />
                  <h3 className="text-lg font-bold">বেতন ও ফি পরিশোধ ফরম</h3>
                </div>

                <form onSubmit={handleGenerateReceipt} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      শিক্ষার্থীর নাম
                    </label>
                    <input
                      type="text"
                      value={feeForm.studentName}
                      onChange={(e) => setFeeForm({ ...feeForm, studentName: e.target.value })}
                      required
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        রোল / আইডি
                      </label>
                      <input
                        type="text"
                        value={feeForm.rollNumber}
                        onChange={(e) => setFeeForm({ ...feeForm, rollNumber: e.target.value })}
                        required
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        টাকার পরিমাণ (BDT)
                      </label>
                      <input
                        type="number"
                        value={feeForm.amount}
                        onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                        required
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      ফি’র ধরন
                    </label>
                    <select
                      value={feeForm.feeType}
                      onChange={(e) => setFeeForm({ ...feeForm, feeType: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-white"
                    >
                      <option value="মাসিক বেতন ও খোরাকি ফি">মাসিক বেতন ও খোরাকি ফি</option>
                      <option value="ভর্তি ও সেশন ফি ২০২৬">ভর্তি ও সেশন ফি ২০২৬</option>
                      <option value="বার্ষিক পরীক্ষা ও ফরম পূরণ ফি">বার্ষিক পরীক্ষা ও ফরম পূরণ ফি</option>
                      <option value="লিল্লাহ বোর্ডিং ও এতিমখানা অনুদান">লিল্লাহ বোর্ডিং ও এতিমখানা অনুদান</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      পরিশোধের মাধ্যম
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["BKASH", "NAGAD", "CASH"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFeeForm({ ...feeForm, paymentMethod: m })}
                          className={`py-2 text-xs font-bold rounded-xl border transition ${
                            feeForm.paymentMethod === m
                              ? "bg-emerald-800 text-white border-emerald-900"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {feeForm.paymentMethod !== "CASH" && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        ট্রানজ্যাকশন আইডি (TrxID) *
                      </label>
                      <input
                        type="text"
                        value={feeForm.trxId}
                        onChange={(e) => setFeeForm({ ...feeForm, trxId: e.target.value })}
                        required
                        placeholder="উদাঃ 9H8K2P1L"
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 font-mono uppercase"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        * বিকাশ বা নগদে ফি পরিশোধের পর প্রেরিত TrxID প্রদান করুন।
                      </p>
                    </div>
                  )}

                  {feeError && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{feeError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={feeLoading}
                    className="w-full bg-[#0D5C3A] hover:bg-emerald-800 text-white font-bold text-xs py-3 rounded-xl shadow transition mt-2 flex items-center justify-center gap-2"
                  >
                    {feeLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />}
                    <span>পেমেন্ট নিশ্চিত করুন ও রসিদ তৈরি করুন</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center pb-3 border-b border-gray-100">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    feeReceipt.status === "PENDING_VERIFICATION"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {feeReceipt.status === "PENDING_VERIFICATION" ? (
                      <Clock className="w-6 h-6 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    {feeReceipt.status === "PENDING_VERIFICATION"
                      ? "পেমেন্ট তথ্য জমা হয়েছে (যাচাইকরণাধীন)"
                      : "পেমেন্ট সফল — ডিজিটাল মানি রিসিট"}
                  </h3>
                  <p className="text-[11px] text-gray-500">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদরাসা</p>
                  {feeReceipt.notice && (
                    <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-xl mt-2 text-left">
                      {feeReceipt.notice}
                    </p>
                  )}
                </div>

                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/60 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">রসিদ / ট্র্যাকিং নম্বর:</span>
                    <span className="font-mono font-bold text-emerald-900">{feeReceipt.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ছাত্রের নাম:</span>
                    <span className="font-bold text-gray-900">{feeReceipt.studentName} (রোল: {feeReceipt.rollNumber})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ফি’র বিবরণ:</span>
                    <span className="text-gray-900">{feeReceipt.feeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">পরিশোধিত টাকা:</span>
                    <span className="font-bold text-emerald-800 text-sm">৳ {feeReceipt.amount.toLocaleString()} BDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">মাধ্যম ও ট্রানজেকশন:</span>
                    <span className="font-mono text-gray-700">{feeReceipt.paymentMethod} • {feeReceipt.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">পেমেন্ট স্ট্যাটাস:</span>
                    <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${
                      feeReceipt.status === "SUCCESSFUL"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {feeReceipt.status === "SUCCESSFUL" ? "VERIFIED (পরিশোধিত)" : "PENDING (যাচাইকরণাধীন)"}
                    </span>
                  </div>
                </div>

                {feeReceipt.qrCode && (
                  <div className="flex flex-col items-center justify-center p-3 bg-white border border-gray-100 rounded-2xl">
                    <Image
                      src={feeReceipt.qrCode}
                      alt="Verified Receipt QR"
                      width={120}
                      height={120}
                      className="rounded"
                    />
                    <span className="text-[10px] text-gray-500 mt-1">কেন্দ্রীয় ডাটাবেস ভেরিফাইড রসিদ</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-[#0D5C3A] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>রসিদ প্রিন্ট করুন</span>
                  </button>
                  <button
                    onClick={() => setFeeReceipt(null)}
                    className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl"
                  >
                    নতুন এন্ট্রি
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: RESULT SEARCH & MARKSHEET */}
      {activeModal === "RESULT_SEARCH" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setActiveModal(null);
                setSearchResultData(null);
              }}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4 text-[#0D5C3A]">
              <Award className="w-6 h-6 stroke-[2.5]" />
              <h3 className="text-lg font-bold">অনলাইন ফলাফল ও মার্কশিট</h3>
            </div>

            <form onSubmit={handleSearchResult} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    শ্রেণি / বিভাগ
                  </label>
                  <select
                    value={resultClass}
                    onChange={(e) => setResultClass(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="HIFZ">হিফজুল কুরআন বিভাগ</option>
                    <option value="NOORANI">নূরানী বিভাগ</option>
                    <option value="KITAB">কিতাব বিভাগ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    রোল বা স্টুডেন্ট আইডি
                  </label>
                  <input
                    type="text"
                    value={resultRoll}
                    onChange={(e) => setResultRoll(e.target.value)}
                    required
                    placeholder="উদাঃ EHRJ-2026-0001"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resultLoading}
                className="w-full bg-[#0D5C3A] hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                {resultLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>মার্কশিট অনুসন্ধান করুন</span>
              </button>
            </form>

            {resultError && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4" />
                <span>{resultError}</span>
              </div>
            )}

            {searchResultData && searchResultData.student && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div className="bg-emerald-50 p-3 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-emerald-950 text-sm">
                      {searchResultData.student.nameBn}
                    </h4>
                    <p className="text-gray-600 text-[11px]">
                      রোল: {searchResultData.student.rollNumber} • {searchResultData.student.className}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-700 font-bold block">প্রাপ্ত ফলাফল</span>
                    <span className="text-base font-extrabold text-emerald-900 font-mono">
                      {searchResultData.result?.letterGrade || "মুমতাজ (A+)"}
                    </span>
                  </div>
                </div>

                {searchResultData.result?.subjects?.length > 0 && (
                  <div className="border border-gray-100 rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-600 text-[11px]">
                        <tr>
                          <th className="p-2">বিষয়</th>
                          <th className="p-2 text-center">পূর্ণমান</th>
                          <th className="p-2 text-center">প্রাপ্ত নম্বর</th>
                          <th className="p-2 text-right">গ্রেড</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {searchResultData.result.subjects.map((s: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-2 font-medium">{s.name}</td>
                            <td className="p-2 text-center font-mono">{s.fullMarks}</td>
                            <td className="p-2 text-center font-bold text-emerald-800 font-mono">{s.obtained}</td>
                            <td className="p-2 text-right font-bold font-mono">{s.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-[#0D5C3A] text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>মার্কশিট প্রিন্ট</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK ADMISSION APPLICATION */}
      {activeModal === "ADMISSION_APPLY" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setActiveModal(null);
                setAdmResult(null);
              }}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
            >
              ✕
            </button>

            {!admResult ? (
              <div>
                <div className="flex items-center gap-2 mb-4 text-[#0D5C3A]">
                  <GraduationCap className="w-6 h-6 stroke-[2.5]" />
                  <h3 className="text-lg font-bold">অনলাইন ভর্তি আবেদন ২০২৬</h3>
                </div>

                <form onSubmit={handleQuickAdmission} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      শিক্ষার্থীর পূর্ণ নাম (বাংলায়)
                    </label>
                    <input
                      type="text"
                      value={admForm.studentNameBn}
                      onChange={(e) => setAdmForm({ ...admForm, studentNameBn: e.target.value })}
                      required
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      অভিভাবকের নাম
                    </label>
                    <input
                      type="text"
                      value={admForm.guardianName}
                      onChange={(e) => setAdmForm({ ...admForm, guardianName: e.target.value })}
                      required
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        অভিভাবকের মোবাইল
                      </label>
                      <input
                        type="tel"
                        value={admForm.guardianPhone}
                        onChange={(e) => setAdmForm({ ...admForm, guardianPhone: e.target.value })}
                        required
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        আবেদনের শ্রেণি
                      </label>
                      <select
                        value={admForm.desiredClass}
                        onChange={(e) => setAdmForm({ ...admForm, desiredClass: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-white"
                      >
                        <option value="হিফজুল কুরআন বিভাগ">হিফজুল কুরআন বিভাগ</option>
                        <option value="নূরানী ও নাজেরা বিভাগ">নূরানী ও নাজেরা বিভাগ</option>
                        <option value="কিতাব ও দাওরায়ে হাদিস">কিতাব ও দাওরায়ে হাদিস</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={admLoading}
                    className="w-full bg-[#0D5C3A] hover:bg-emerald-800 text-white font-bold text-xs py-3 rounded-xl shadow transition mt-2 flex items-center justify-center gap-1.5"
                  >
                    {admLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-[#D4AF37]" />}
                    <span>আবেদনপত্র দাখিল করুন</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    ভর্তি আবেদন সফলভাবে গৃহীত হয়েছে
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    আপনার ট্র্যাকিং কোড সংরক্ষণ করুন এবং ইন্টারভিউয়ের সময় উপস্থিত থাকুন।
                  </p>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ট্র্যাকিং কোড:</span>
                    <span className="font-mono font-extrabold text-[#0D5C3A] text-sm">
                      {admResult.trackingCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">শিক্ষার্থী:</span>
                    <span className="font-bold text-gray-900">{admResult.application.studentNameBn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ইন্টারভিউ তারিখ:</span>
                    <span className="font-bold text-amber-800">{admResult.application.interviewDate}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link
                    href={`/admission/track?code=${admResult.trackingCode}`}
                    className="flex-1 bg-[#0D5C3A] text-white text-xs font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-1"
                  >
                    <span>স্ট্যাটাস ট্র্যাক করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => setAdmResult(null)}
                    className="px-4 bg-gray-100 text-gray-700 text-xs font-bold py-2.5 rounded-xl"
                  >
                    আরেকটি আবেদন
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: CLASS ATTENDANCE MATRIX */}
      {activeModal === "ATTENDANCE_SHEET" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#0D5C3A]">
                <Calendar className="w-6 h-6 stroke-[2.5]" />
                <h3 className="text-lg font-bold">দৈনিক হাজিরা শিট (উস্তাদ)</h3>
              </div>
              <button
                onClick={markAllPresent}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 rounded-xl transition"
              >
                সকল উপস্থিত
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {attendanceRoster.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 hover:bg-gray-50 text-xs transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-800 font-mono font-bold flex items-center justify-center text-xs">
                      {item.roll}
                    </span>
                    <span className="font-bold text-gray-900">{item.name}</span>
                  </div>

                  <button
                    onClick={() => toggleAttendanceStatus(item.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                      item.status === "PRESENT"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : item.status === "ABSENT"
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    <span>{item.status === "PRESENT" ? "উপস্থিত" : item.status === "ABSENT" ? "অনুপস্থিত" : "ছুটি"}</span>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={saveAttendanceSheet}
              className="w-full bg-[#0D5C3A] hover:bg-emerald-800 text-white font-bold text-xs py-3 rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-[#D4AF37]" />
              <span>{attendanceSaved ? "হাজিরা সংরক্ষিত ও সিঙ্কড ✓" : "হাজিরা শিট সেভ করুন"}</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: PRAYER TIMETABLE */}
      {activeModal === "PRAYER_SCHEDULE" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4 text-[#0D5C3A]">
              <Clock className="w-6 h-6 stroke-[2.5]" />
              <h3 className="text-lg font-bold">নামাজের সময়সূচি (দাউদকান্দি)</h3>
            </div>

            <div className="space-y-2.5">
              {prayers.map((p, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between items-center p-3 rounded-2xl border ${
                    p.active ? "bg-emerald-50 border-emerald-400" : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <span className="font-bold text-xs text-gray-800">{p.name}</span>
                  <span className="font-mono font-bold text-emerald-900 text-sm">{p.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: DIGITAL ID CARD PREVIEW */}
      {activeModal === "ID_CARD_PREVIEW" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="text-center pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-extrabold text-gray-900">ডিজিটাল স্টুডেন্ট আইডি কার্ড</h3>
              <p className="text-[11px] text-gray-500">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদরাসা</p>
            </div>

            {/* CR80 Card Front Preview */}
            <div className="bg-gradient-to-br from-[#041F14] to-[#0D5C3A] text-white rounded-2xl p-4 shadow-lg border border-[#D4AF37]/40 relative overflow-hidden">
              <div className="flex items-center gap-3 pb-3 border-b border-emerald-800/80">
                <div className="w-10 h-10 rounded-full bg-white relative overflow-hidden flex-shrink-0">
                  <Image src="/images/logo.jpg" alt="Logo" fill className="object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">{INSTITUTION_INFO.nameBn}</h4>
                  <span className="text-[9px] text-[#D4AF37]">শিক্ষাবর্ষ ২০২৬</span>
                </div>
              </div>

              <div className="flex items-center gap-4 py-3">
                <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0 border-2 border-[#D4AF37] overflow-hidden relative">
                  <Image src="/images/logo.jpg" alt="Photo" fill className="object-cover" />
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <div className="font-extrabold text-white text-xs">মুহাম্মদ আব্দুল্লাহ আল মামুন</div>
                  <div className="text-emerald-200">আইডি: EHRJ-2026-0001</div>
                  <div className="text-emerald-200">বিভাগ: নূরানী ও নাযেরা</div>
                  <div className="text-emerald-200">রক্তের গ্রুপ: O+</div>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-800/80 flex justify-between items-center text-[10px]">
                <span className="text-emerald-300">ভেরিফায়েড কার্ড</span>
                <span className="font-mono text-[#D4AF37]">VALID 2026</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-[#0D5C3A] text-white text-xs font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>আইডি কার্ড প্রিন্ট</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: STUDENT PROFILE DETAIL */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedStudentProfile(null)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4 text-[#0D5C3A]">
              <Users className="w-6 h-6 stroke-[2.5]" />
              <div>
                <h3 className="text-lg font-bold">{selectedStudentProfile.nameBn}</h3>
                <p className="text-xs text-gray-500">{selectedStudentProfile.nameEn}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">স্টুডেন্ট আইডি:</span>
                <span className="font-mono font-bold text-emerald-950">{selectedStudentProfile.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">শ্রেণি / বিভাগ:</span>
                <span className="font-bold text-gray-900">{selectedStudentProfile.className}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">পিতার নাম:</span>
                <span className="font-bold text-gray-900">{selectedStudentProfile.fatherName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">অভিভাবকের মোবাইল:</span>
                <span className="font-mono font-bold text-emerald-800">{selectedStudentProfile.guardianPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">আবাসিক স্ট্যাটাস:</span>
                <span className="font-bold text-purple-900">{selectedStudentProfile.residentialStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">রক্তের গ্রুপ:</span>
                <span className="font-mono font-bold text-gray-900">{selectedStudentProfile.bloodGroup}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setSelectedStudentProfile(null);
                  setActiveModal("ID_CARD_PREVIEW");
                }}
                className="w-full bg-[#0D5C3A] text-white text-xs font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>আইডি কার্ড ভিউ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: NOTICE DETAIL */}
      {selectedNoticeDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedNoticeDetail(null)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="space-y-3">
              <div className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                {selectedNoticeDetail.category}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">{selectedNoticeDetail.title}</h3>
              <p className="text-xs text-gray-500">প্রকাশের তারিখ: {selectedNoticeDetail.date}</p>
              <div className="pt-3 border-t border-gray-100 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                {selectedNoticeDetail.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: ISSUE GATEPASS */}
      {activeModal === "GATEPASS_ISSUE" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4 text-[#0D5C3A]">
              <DoorOpen className="w-6 h-6 stroke-[2.5]" />
              <h3 className="text-lg font-bold">নতুন ক্যাম্পাস গেটপাস ইস্যু</h3>
            </div>

            <form onSubmit={handleIssueGatepass} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">শিক্ষার্থী নির্বাচন *</label>
                <select
                  value={gpForm.studentId}
                  onChange={(e) => setGpForm({ ...gpForm, studentId: e.target.value })}
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-white"
                >
                  <option value="">শিক্ষার্থী বাছাই করুন...</option>
                  {moduleData.students?.map((s) => (
                    <option key={s.id} value={s.id}>{s.nameBn} ({s.studentId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">প্রস্থানের কারণ *</label>
                <input
                  type="text"
                  value={gpForm.reason}
                  onChange={(e) => setGpForm({ ...gpForm, reason: e.target.value })}
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">গন্তব্যস্থল</label>
                <input
                  type="text"
                  value={gpForm.destination}
                  onChange={(e) => setGpForm({ ...gpForm, destination: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">প্রত্যাশিত প্রত্যাবর্তনের সময় (ঘণ্টা)</label>
                <input
                  type="number"
                  value={gpForm.expectedReturnHours}
                  onChange={(e) => setGpForm({ ...gpForm, expectedReturnHours: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={gpLoading}
                className="w-full bg-[#0D5C3A] hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl shadow transition mt-2 flex items-center justify-center gap-1.5"
              >
                {gpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />}
                <span>গেটপাস অনুমোদন ও প্রিন্ট টোকেন</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
