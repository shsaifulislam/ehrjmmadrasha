"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Award,
  FileSpreadsheet,
  Bell,
  User,
  Send,
  Building,
  Boxes,
  KeyRound,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
  MapPin,
  ExternalLink,
  HelpCircle,
  BookmarkCheck,
  CheckSquare,
  ShieldCheck,
  BookOpenCheck,
  CreditCard,
  DoorOpen,
  Bus,
  CalendarDays,
  Trophy,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
import TeacherAttendanceManager from "@/components/attendance/TeacherAttendanceManager";
import TeacherMarksEntry from "@/components/exams/TeacherMarksEntry";
import PortalNotificationsViewer from "@/components/communication/PortalNotificationsViewer";
import TeacherLibraryViewer from "@/components/library/TeacherLibraryViewer";
import TeacherHostelViewer from "@/components/hostel/TeacherHostelViewer";
import TeacherInventoryViewer from "@/components/inventory/TeacherInventoryViewer";
import TeacherRoutineViewer from "@/components/calendar/TeacherRoutineViewer";
import TeacherClassesViewer from "@/components/teacher/TeacherClassesViewer";
import TeacherLeaveManager from "@/components/teacher/TeacherLeaveManager";
import TeacherExamViewer from "@/components/teacher/TeacherExamViewer";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import UserGuideModal from "@/components/common/UserGuideModal";

import TeacherHifzTracker from "@/components/hifz/TeacherHifzTracker";
import StudentIdCardHub from "@/components/idcard/StudentIdCardHub";
import GatePassManager from "@/components/gatepass/GatePassManager";
import TeacherPayrollViewer from "@/components/teacher/TeacherPayrollViewer";
import TeacherLessonPlanManager from "@/components/teacher/TeacherLessonPlanManager";
import TeacherTransportViewer from "@/components/transport/TeacherTransportViewer";
import TeacherCalendarViewer from "@/components/calendar/TeacherCalendarViewer";
import TeacherEventsViewer from "@/components/events/TeacherEventsViewer";
import { Banknote, BookMarked } from "lucide-react";

type TeacherTabType =
  | "DASHBOARD"
  | "CLASSES"
  | "ATTENDANCE"
  | "RESULTS"
  | "HIFZ"
  | "IDCARDS"
  | "GATEPASS"
  | "ROUTINE"
  | "LESSON_PLAN"
  | "EXAM"
  | "CALENDAR"
  | "EVENTS"
  | "NOTICES"
  | "PAYROLL"
  | "TRANSPORT"
  | "PROFILE"
  | "LEAVE"
  | "LIBRARY"
  | "HOSTEL"
  | "INVENTORY"
  | "NOTES";

export default function TeacherPanelPage() {
  const [activeTab, setActiveTab] = useState<TeacherTabType>("DASHBOARD");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [teacherAnalytics, setTeacherAnalytics] = useState<any | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Daily Quick Notes for Teachers
  const [notes, setNotes] = useState<string[]>([
    "হিফজুল কুরআন শাখার সাপ্তাহিক সবক তদারকি",
    "দাওরায়ে হাদীস জামাতের পরীক্ষার উত্তরপত্র মূল্যায়ন",
    "আজকের ক্লাসের শিক্ষার্থীদের নিয়মিত উপস্থিতি রেকর্ড সংরক্ষণ",
  ]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    fetch("/api/teacher/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) setTeacherAnalytics(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        const upper = tabParam.toUpperCase();
        const validTabs: TeacherTabType[] = [
          "DASHBOARD",
          "CLASSES",
          "ATTENDANCE",
          "RESULTS",
          "HIFZ",
          "IDCARDS",
          "GATEPASS",
          "ROUTINE",
          "LESSON_PLAN",
          "EXAM",
          "CALENDAR",
          "EVENTS",
          "NOTICES",
          "PAYROLL",
          "TRANSPORT",
          "PROFILE",
          "LEAVE",
          "LIBRARY",
          "HOSTEL",
          "INVENTORY",
          "NOTES",
        ];
        if (validTabs.includes(upper as TeacherTabType)) {
          setActiveTab(upper as TeacherTabType);
        }
      }
    }
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes([...notes, newNote.trim()]);
    setNewNote("");
  };

  const handleRemoveNote = (idx: number) => {
    setNotes(notes.filter((_, i) => i !== idx));
  };

  // Categorized Sidebar Navigation Structure
  const navGroups = [
    {
      groupTitle: "অ্যাকাডেমিক কার্যক্রম (Academic)",
      items: [
        { id: "DASHBOARD" as TeacherTabType, label: "ড্যাশবোর্ড ও সারসংক্ষেপ", icon: LayoutDashboard },
        { id: "CLASSES" as TeacherTabType, label: "আমার ক্লাস ও জামাত", icon: BookOpen },
        { id: "ATTENDANCE" as TeacherTabType, label: "ডিজিটাল হাজিরা ইঞ্জিন", icon: CalendarCheck },
        { id: "RESULTS" as TeacherTabType, label: "পরীক্ষার নম্বর এন্ট্রি", icon: Award },
        { id: "HIFZ" as TeacherTabType, label: "তাহফীজুল কুরআন (হিফজ)", icon: BookOpenCheck },
        { id: "IDCARDS" as TeacherTabType, label: "স্টুডেন্ট আইডি কার্ড", icon: CreditCard },
        { id: "ROUTINE" as TeacherTabType, label: "ক্লাস ও পাঠদান রুটিন", icon: Clock },
        { id: "LESSON_PLAN" as TeacherTabType, label: "পাঠ পরিকল্পনা ও ডায়েরি", icon: BookMarked },
        { id: "EXAM" as TeacherTabType, label: "পরীক্ষা ও সূচি", icon: FileSpreadsheet },
        { id: "CALENDAR" as TeacherTabType, label: "অ্যাকাডেমিক বর্ষপঞ্জি", icon: CalendarDays },
        { id: "EVENTS" as TeacherTabType, label: "প্রতিযোগিতা ও অনুষ্ঠান", icon: Trophy },
      ],
    },
    {
      groupTitle: "প্রাতিষ্ঠানিক সেবা (Campus Services)",
      items: [
        { id: "TRANSPORT" as TeacherTabType, label: "মাদ্রাসা পরিবহন ও রুট", icon: Bus },
        { id: "GATEPASS" as TeacherTabType, label: "সিকিউরিটি গেটপাস", icon: DoorOpen },
        { id: "NOTICES" as TeacherTabType, label: "নোটিশ ও সার্কুলার", icon: Bell },
        { id: "LIBRARY" as TeacherTabType, label: "কিতাব ও লাইব্রেরি", icon: BookOpen },
        { id: "HOSTEL" as TeacherTabType, label: "ছাত্রাবাস ও বোর্ডিং", icon: Building },
        { id: "INVENTORY" as TeacherTabType, label: "সরঞ্জাম ও সম্পদ", icon: Boxes },
      ],
    },
    {
      groupTitle: "ব্যক্তিগত ও সেবা (Personal & Admin)",
      items: [
        { id: "PAYROLL" as TeacherTabType, label: "আমার বেতন ও পে-স্লিপ", icon: Banknote },
        { id: "LEAVE" as TeacherTabType, label: "ছুটির আবেদন ও পর্যালোচনা", icon: Send },
        { id: "NOTES" as TeacherTabType, label: "শিক্ষক নোট ও ডায়েরি", icon: BookMarked },
        { id: "PROFILE" as TeacherTabType, label: "শিক্ষক প্রোফাইল ও নিরাপত্তা", icon: User },
      ],
    },
  ];

  // Active Tab details for header
  const getTabLabel = (tab: TeacherTabType) => {
    for (const g of navGroups) {
      const found = g.items.find((i) => i.id === tab);
      if (found) return found.label;
    }
    return "ড্যাশবোর্ড";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ===================== LEFT SIDEBAR ===================== */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-[#041c12] via-[#072d1c] to-[#041c12] text-white flex flex-col border-r-2 border-[#D4AF37]/40 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Background Islamic Watermark */}
        <div className="absolute inset-0 bg-islamic-pattern opacity-10 pointer-events-none" />

        {/* 1. Sidebar Top Header */}
        <div className="p-5 border-b border-emerald-800/60 relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-stone-950 font-arabic font-extrabold flex items-center justify-center text-base shadow-lg shadow-amber-950/40 border border-amber-200 flex-shrink-0 card-3d">
              أستاذ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-sm font-display tracking-tight text-white leading-tight">
                  উস্তাদ ককপিট
                </h1>
                <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-[#D4AF37]/50 font-bold px-1.5 py-0.2 rounded-full font-mono">
                  ৩.০
                </span>
              </div>
              <p className="text-[10px] text-emerald-200/80 truncate max-w-[150px] leading-tight mt-0.5">
                {INSTITUTION_INFO.nameBn}
              </p>
              <span className="inline-block text-[9px] font-bold text-amber-300/90 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/60 mt-1">
                স্থাপিত: {INSTITUTION_INFO.established} ইং
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/50 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Teacher Profile Mini Card */}
        <div className="px-4 py-3 border-b border-emerald-800/40 relative z-10 bg-emerald-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-800 text-amber-300 border border-amber-400/40 flex items-center justify-center font-bold text-xs shadow-inner flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-white truncate block">
                  {currentUser?.name || "মাওলানা আহমাদ উল্লাহ"}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-300 font-semibold truncate">
                  সিনিয়র উস্তাদ • অন-ডিউটি
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Categorized Nav Links (Scrollable) */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 relative z-10 scrollbar-none">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider px-3 block mb-1.5 font-display">
                {group.groupTitle}
              </span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 text-left ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-800 to-[#0D5C3A] text-white shadow-md border-l-4 border-amber-400 font-extrabold translate-x-1"
                        : "text-emerald-100/90 hover:text-white hover:bg-emerald-900/40 hover:translate-x-0.5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive ? "text-amber-300" : "text-emerald-400"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* 4. Sidebar Bottom Action Panel */}
        <div className="p-3 border-t border-emerald-800/60 bg-emerald-950/60 relative z-10 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/50 text-[11px] font-bold text-emerald-200 hover:text-white transition"
              title="ব্যবহার নির্দেশিকা"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>নির্দেশিকা</span>
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/50 text-[11px] font-bold text-emerald-200 hover:text-white transition"
              title="পাসওয়ার্ড পরিবর্তন"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>পাসওয়ার্ড</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-700/40 text-[11px] font-bold text-emerald-200 hover:text-white transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>মূল সাইট</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white text-[11px] font-bold transition shadow-sm border border-rose-400/40"
              title="লগআউট"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT WRAPPER ===================== */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 w-full max-w-[100vw] overflow-x-hidden">
        {/* Top Header App Bar */}
        <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 lg:hidden flex-shrink-0"
              aria-label="মেনু খুলুন"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb & Active Tab Name */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>উস্তাদ ককপিট</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="text-[#0D5C3A] font-bold truncate">
                  {getTabLabel(activeTab)}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 font-display flex items-center gap-2 truncate mt-0.5">
                <span>{getTabLabel(activeTab)}</span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-sans font-bold">
                  ডিজিটাল অ্যাকাডেমিক ম্যানেজমেন্ট
                </span>
              </h2>
            </div>
          </div>

          {/* Quick Header Stats / Action Shortcuts */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-[#0D5C3A]" />
              <span>আজ: {new Date().toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>

            {activeTab !== "ATTENDANCE" && (
              <button
                onClick={() => setActiveTab("ATTENDANCE")}
                className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">আজকের হাজিরা</span>
              </button>
            )}

            {activeTab !== "RESULTS" && (
              <button
                onClick={() => setActiveTab("RESULTS")}
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
              >
                <Award className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">নম্বর এন্ট্রি</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* ==================== 1. DASHBOARD TAB ==================== */}
          {activeTab === "DASHBOARD" && (
            <div className="space-y-6">
              {/* Teacher Welcome Hero Card in 3D Perspective */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#041c12] via-[#083823] to-[#0D5C3A] text-white p-6 sm:p-8 border-2 border-[#D4AF37]/50 shadow-2xl card-3d">
                <div className="absolute inset-0 bg-islamic-pattern opacity-15 pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-[#D4AF37]/50 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>স্বাগতম, {currentUser?.name || "মাওলানা আহমাদ উল্লাহ (সিনিয়র উস্তাদ)"}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black font-display tracking-tight text-white">
                      উস্তাদ অ্যাকাডেমিক ড্যাশবোর্ড ও পাঠদান পরিচালনা
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl leading-relaxed">
                      ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদ্রাসার আধুনিক ডিজিটাল ককপিট। বাম পাশের মেনু থেকে জামাতভিত্তিক হাজিরা, নম্বর এন্ট্রি, ক্লাস রুটিন ও প্রাতিষ্ঠানিক কার্যাবলি সম্পাদন করুন।
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      onClick={() => setActiveTab("ATTENDANCE")}
                      className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black px-5 py-3 rounded-2xl text-xs shadow-lg shadow-amber-950/20 flex items-center justify-center gap-2 transition hover:scale-105 active:scale-95 border border-amber-300"
                    >
                      <CalendarCheck className="w-4 h-4 text-stone-950" />
                      <span>আজকের হাজিরা গ্রহণ</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("RESULTS")}
                      className="bg-emerald-950/90 hover:bg-emerald-900 text-emerald-100 font-bold px-5 py-3 rounded-2xl text-xs border border-emerald-600/50 shadow-md flex items-center justify-center gap-2 transition hover:scale-105 active:scale-95"
                    >
                      <Award className="w-4 h-4 text-amber-300" />
                      <span>নম্বর এন্ট্রি প্যানেল</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 perspective-1000">
                <div className="card-3d bg-white p-5 rounded-3xl border-2 border-slate-200/90 hover:border-[#D4AF37] shadow-lg transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 to-teal-500" />
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">অ্যাসাইনকৃত ক্লাস ও শাখা</span>
                  <span className="text-2xl font-black text-slate-900 block mt-2 font-mono">
                    {teacherAnalytics ? `${teacherAnalytics.totalAssignments} টি` : "১ টি"}
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold block mt-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {teacherAnalytics ? `মোট ছাত্র: ${teacherAnalytics.assignedStudentsCount} জন` : "দাওয়ায়ে হাদীস (মাস্টার্স)"}
                  </span>
                </div>

                <div className="card-3d bg-white p-5 rounded-3xl border-2 border-slate-200/90 hover:border-[#D4AF37] shadow-lg transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500" />
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">আজকের উপস্থিতি হার</span>
                  <span className="text-2xl font-black text-blue-700 block mt-2 font-mono">
                    {teacherAnalytics?.todayAttendance?.rate !== undefined ? `${teacherAnalytics.todayAttendance.rate}%` : "০%"}
                  </span>
                  <span className="text-xs text-slate-600 block mt-1.5">
                    {teacherAnalytics?.todayAttendance
                      ? `উপস্থিত: ${teacherAnalytics.todayAttendance.present}, অনুপস্থিত: ${teacherAnalytics.todayAttendance.absent}`
                      : "আজকের রেকর্ড অপেক্ষমান"}
                  </span>
                </div>

                <div className="card-3d bg-white p-5 rounded-3xl border-2 border-slate-200/90 hover:border-[#D4AF37] shadow-lg transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-yellow-500" />
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">দায়িত্বপ্রাপ্ত বিভাগ</span>
                  <span className="text-2xl font-black text-amber-700 block mt-2">শিক্ষা অনুষদ</span>
                  <span className="text-xs text-slate-600 block mt-1.5">হিফজ ও কিতাব বিভাগ</span>
                </div>

                <div className="card-3d bg-white p-5 rounded-3xl border-2 border-slate-200/90 hover:border-[#D4AF37] shadow-lg transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-[#0D5C3A]" />
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">শিক্ষক স্ট্যাটাস</span>
                  <span className="text-2xl font-black text-emerald-700 block mt-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    সক্রিয়
                  </span>
                  <span className="text-xs text-slate-600 block mt-1.5">
                    অন-ডিউটি শিক্ষক • স্থাপিত: {INSTITUTION_INFO.established} ইং
                  </span>
                </div>
              </div>

              {/* Quick Launchpad in 3D Gold Container */}
              <div className="card-3d-gold bg-white p-6 sm:p-7 rounded-3xl border-2 border-[#D4AF37]/50 shadow-xl space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      আজকের দ্রুত কার্যক্রম (Quick Launchpad)
                    </h2>
                    <p className="text-xs text-slate-500">এক ক্লিকে গুরুত্বপূর্ণ শিক্ষাদান ও অ্যাকাডেমিক কার্যাবলি পরিচালনা করুন।</p>
                  </div>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hidden sm:inline-block">
                    দ্রুত এক্সেস
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <button
                    onClick={() => setActiveTab("ATTENDANCE")}
                    className="bg-gradient-to-br from-[#0D5C3A] to-[#083823] hover:from-[#158052] hover:to-[#0D5C3A] text-white p-4 rounded-2xl text-xs font-bold shadow-md shadow-emerald-950/20 flex flex-col items-start gap-2 transition hover:scale-105 active:scale-95 border border-[#D4AF37]/40 text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-black text-sm text-amber-300">ডিজিটাল হাজিরা</span>
                      <span className="text-[11px] text-emerald-200">উপস্থিতি গ্রহণ</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("RESULTS")}
                    className="bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 p-4 rounded-2xl text-xs font-black shadow-md flex flex-col items-start gap-2 transition hover:scale-105 active:scale-95 border border-amber-300 text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-stone-900/10 flex items-center justify-center text-stone-900">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-black text-sm text-stone-950">নম্বর এন্ট্রি</span>
                      <span className="text-[11px] text-stone-800">পরীক্ষার ফলাফল</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("HIFZ")}
                    className="bg-gradient-to-br from-[#063320] to-[#0D5C3A] hover:from-[#0D5C3A] hover:to-[#158052] text-white p-4 rounded-2xl text-xs font-bold shadow-md flex flex-col items-start gap-2 transition hover:scale-105 active:scale-95 border border-amber-400/50 text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-black text-sm text-amber-300">হিফজ ডায়েরি</span>
                      <span className="text-[11px] text-emerald-200">সবক ও আমোক্তা</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("LESSON_PLAN")}
                    className="bg-white hover:bg-slate-50 text-slate-800 p-4 rounded-2xl text-xs font-bold flex flex-col items-start gap-2 transition hover:scale-105 active:scale-95 border-2 border-slate-200 hover:border-[#D4AF37] shadow-sm text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                      <BookMarked className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-black text-sm text-slate-900">পাঠ পরিকল্পনা</span>
                      <span className="text-[11px] text-slate-500">দৈনিক পড়া ও কাজ</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("PAYROLL")}
                    className="bg-white hover:bg-slate-50 text-slate-800 p-4 rounded-2xl text-xs font-bold flex flex-col items-start gap-2 transition hover:scale-105 active:scale-95 border-2 border-slate-200 hover:border-[#D4AF37] shadow-sm text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-[#0D5C3A]">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-black text-sm text-slate-900">বেতন ও পে-স্লিপ</span>
                      <span className="text-[11px] text-slate-500">ভাউচার বিবরণী</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("ROUTINE")}
                    className="bg-white hover:bg-slate-50 text-slate-800 p-4 rounded-2xl text-xs font-bold flex flex-col items-start gap-2 transition hover:scale-105 active:scale-95 border-2 border-slate-200 hover:border-[#D4AF37] shadow-sm text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-black text-sm text-slate-900">ক্লাস রুটিন</span>
                      <span className="text-[11px] text-slate-500">সাপ্তাহিক সূচি</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Two Column Grid: Today's Routine Preview + Daily Notes Checklist */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Today's Routine Widget */}
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-200/90 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-black text-sm text-slate-900 font-display flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#0D5C3A]" />
                      <span>আজকের পাঠদান সূচি (Today's Routine)</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab("ROUTINE")}
                      className="text-xs font-bold text-[#0D5C3A] hover:underline flex items-center gap-1"
                    >
                      <span>সম্পূর্ণ রুটিন</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-900 block">
                          কুরআন মাজীদ ও তাজবীদ
                        </span>
                        <span className="text-[11px] text-slate-600">নূরানী ও হিফজুল কুরআন বিভাগ</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-[#0D5C3A] block">সকাল ৮:০০ - ৯:০০</span>
                        <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          কক্ষ: ১০১
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-900 block">
                          সহীহুল বুখারী (প্রথম খণ্ড)
                        </span>
                        <span className="text-[11px] text-slate-600">দাওরায়ে হাদীস জামাত</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-slate-700 block">সকাল ৯:১৫ - ১০:১৫</span>
                        <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          কক্ষ: ১০২
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Teacher Daily Notes & Checklist Widget */}
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-200/90 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-black text-sm text-slate-900 font-display flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-amber-600" />
                      <span>উস্তাদের দৈনিক নোট ও কর্মতালিকা (Daily Tasks)</span>
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                      ব্যক্তিগত নোট
                    </span>
                  </div>

                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="নতুন কাজ বা নোট লিখুন..."
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                    />
                    <button
                      type="submit"
                      className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      যুক্ত করুন
                    </button>
                  </form>

                  <div className="space-y-2">
                    {notes.map((note, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 text-xs transition"
                      >
                        <span className="text-slate-700 font-medium">{note}</span>
                        <button
                          onClick={() => handleRemoveNote(idx)}
                          className="text-slate-400 hover:text-rose-600 font-bold p-1"
                          title="মুছে ফেলুন"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 2. MY CLASSES ==================== */}
          {activeTab === "CLASSES" && (
            <TeacherClassesViewer
              onSelectAttendance={() => setActiveTab("ATTENDANCE")}
              onSelectResults={() => setActiveTab("RESULTS")}
            />
          )}

          {/* ==================== 3. ATTENDANCE ==================== */}
          {activeTab === "ATTENDANCE" && <TeacherAttendanceManager />}

          {/* ==================== 4. RESULTS ==================== */}
          {activeTab === "RESULTS" && <TeacherMarksEntry />}

          {/* ==================== 4.1 HIFZ TAHFEEZ TRACKER ==================== */}
          {activeTab === "HIFZ" && <TeacherHifzTracker />}

          {/* ==================== 4.2 STUDENT ID CARDS ==================== */}
          {activeTab === "IDCARDS" && <StudentIdCardHub />}

          {/* ==================== 4.3 SECURITY GATE-PASS ==================== */}
          {activeTab === "GATEPASS" && <GatePassManager />}

          {/* ==================== 5. ROUTINE ==================== */}
          {activeTab === "ROUTINE" && <TeacherRoutineViewer />}

          {/* ==================== 5.1 LESSON PLAN & DIARY ==================== */}
          {activeTab === "LESSON_PLAN" && <TeacherLessonPlanManager />}

          {/* ==================== 6. EXAM ==================== */}
          {activeTab === "EXAM" && <TeacherExamViewer />}

          {/* ==================== 7. NOTICES ==================== */}
          {activeTab === "NOTICES" && <PortalNotificationsViewer />}

          {/* ==================== 7.1 TEACHER PAYROLL & PAYSLIPS ==================== */}
          {activeTab === "PAYROLL" && <TeacherPayrollViewer />}

          {/* ==================== 8. MY PROFILE ==================== */}
          {activeTab === "PROFILE" && (
            <div className="card-3d-gold bg-white rounded-3xl border-2 border-[#D4AF37]/50 p-6 sm:p-8 shadow-xl space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                    ব্যক্তিগত পরিচিতি ও সিকিউরিটি
                  </span>
                  <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                    <User className="w-5 h-5 text-[#0D5C3A]" />
                    আমার শিক্ষক প্রোফাইল ও নিরাপত্তা
                  </h2>
                  <p className="text-slate-500 mt-0.5">
                    ব্যক্তিগত তথ্য, শিক্ষাদান দায়িত্ব ও প্রাতিষ্ঠানিক অ্যাকাউন্ট সিকিউরিটি।
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="bg-gradient-to-r from-[#0D5C3A] to-[#083823] hover:from-[#158052] hover:to-[#0D5C3A] text-white px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-md border border-[#D4AF37]/40 transition hover:scale-105 active:scale-95"
                >
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  <span>পাসওয়ার্ড পরিবর্তন করুন</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-[#0D5C3A] block">শিক্ষক বিবরণী</span>
                  <div className="space-y-2 text-slate-700">
                    <p className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-500">নাম:</span>
                      <strong className="text-slate-900">{currentUser?.name || "মাওলানা আহমাদ উল্লাহ"}</strong>
                    </p>
                    <p className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-500">ইমেইল / ব্যবহারকারী নাম:</span>
                      <strong className="text-slate-900 font-mono">
                        {currentUser?.email || currentUser?.username || "teacherehrjmadrasha@gmail.com"}
                      </strong>
                    </p>
                    <p className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-500">পদবি:</span>
                      <strong className="text-slate-900">সিনিয়র উস্তাদ ও বিভাগীয় শিক্ষক</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">স্ট্যাটাস:</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        অফিশিয়ালি অ্যাক্টিভ
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-[#052216] text-white p-5 rounded-2xl border border-emerald-800 shadow-md space-y-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-islamic-pattern opacity-15 pointer-events-none" />
                  <span className="text-xs font-bold text-amber-300 block relative z-10">প্রাতিষ্ঠানিক সংযুক্তি</span>
                  <div className="space-y-2 text-emerald-100 text-xs relative z-10">
                    <p><strong>প্রতিষ্ঠান:</strong> {INSTITUTION_INFO.nameBn}</p>
                    <p><strong>প্রতিষ্ঠিত:</strong> {INSTITUTION_INFO.established} ইং</p>
                    <p><strong>ঠিকানা:</strong> {INSTITUTION_INFO.addressBn}</p>
                    <div className="pt-2 border-t border-emerald-800/80 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-[#D4AF37]/40 text-[10px] font-bold">
                        ডিজিটাল স্মার্ট মাদ্রাসা
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-800/60 text-emerald-200 text-[10px] font-semibold">
                        অনলাইন পোর্টাল ৩.০
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 9. LEAVE ==================== */}
          {activeTab === "LEAVE" && <TeacherLeaveManager />}

          {/* ==================== 10. LIBRARY ==================== */}
          {activeTab === "LIBRARY" && <TeacherLibraryViewer />}

          {/* ==================== 11. HOSTEL ==================== */}
          {activeTab === "HOSTEL" && <TeacherHostelViewer />}

          {/* ==================== 12. INVENTORY ==================== */}
          {activeTab === "INVENTORY" && <TeacherInventoryViewer />}

          {/* ==================== 13. CALENDAR ==================== */}
          {activeTab === "CALENDAR" && <TeacherCalendarViewer />}

          {/* ==================== 14. EVENTS ==================== */}
          {activeTab === "EVENTS" && <TeacherEventsViewer />}

          {/* ==================== 15. TRANSPORT ==================== */}
          {activeTab === "TRANSPORT" && <TeacherTransportViewer />}

          {/* ==================== 16. NOTES & DIARY ==================== */}
          {activeTab === "NOTES" && <TeacherLessonPlanManager />}
        </main>
      </div>

      {/* Change Password Modal for Teacher */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        currentUser={currentUser}
      />

      {/* Interactive Teacher Guide Modal */}
      <UserGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        role="TEACHER"
      />
    </div>
  );
}
