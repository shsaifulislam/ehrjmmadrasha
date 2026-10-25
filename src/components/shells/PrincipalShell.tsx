"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Eye,
  FileText,
  Award,
  Bell,
  AlertTriangle,
  Database,
  Activity,
  LogOut,
  Menu,
  X,
  KeyRound,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Printer,
  RefreshCw,
  Send,
  CheckCircle2,
  ChevronRight,
  Shield,
  Sparkles,
  Users,
  GraduationCap,
  UserCheck,
  Utensils,
  BookOpen,
  CalendarDays,
  HeartHandshake,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import UserGuideModal from "@/components/common/UserGuideModal";
import EhrjBreadcrumb, { BreadcrumbItem } from "@/components/ui/EhrjBreadcrumb";

export type PrincipalTabType =
  | "DASHBOARD"
  | "OVERVIEW"
  | "ACADEMICS"
  | "TEACHERS_STAFF"
  | "ADMISSIONS"
  | "LEAVE_MANAGEMENT"
  | "MESSAGE"
  | "SIGNATURE"
  | "NOTICES"
  | "ISSUES"
  | "HOSTEL_LILLAH"
  | "CERTIFICATES"
  | "FEE_CONCESSION"
  | "REPORTS"
  | "OPERATIONS";

export interface PrincipalShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  activeTab?: PrincipalTabType;
  onTabChange?: (tab: PrincipalTabType) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function PrincipalShell({
  children,
  title,
  subtitle,
  breadcrumbs,
  actions,
  activeTab = "DASHBOARD",
  onTabChange,
  onRefresh,
  isRefreshing = false,
}: PrincipalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const navGroups = [
    {
      groupTitle: "নির্বাহী গভর্ন্যান্স (Executive)",
      items: [
        {
          id: "DASHBOARD" as PrincipalTabType,
          label: "ড্যাশবোর্ড ও কমান্ড সেন্টার",
          subtitle: "এক নজরে সকল সূচক",
          icon: LayoutDashboard,
        },
        {
          id: "OVERVIEW" as PrincipalTabType,
          label: "সার্বিক পর্যবেক্ষণ ও পরিসংখ্যান",
          subtitle: "ছাত্র, শিক্ষক ও তহবিল",
          icon: Eye,
        },
        {
          id: "MESSAGE" as PrincipalTabType,
          label: "অফিসিয়াল বাণী ও বার্তা",
          subtitle: "ওয়েবসাইটে প্রদর্শিত বক্তব্য",
          icon: FileText,
        },
        {
          id: "SIGNATURE" as PrincipalTabType,
          label: "ডিজিটাল সিল ও স্বাক্ষর",
          subtitle: "অফিসিয়াল ডকুমেন্টে সিল ও দস্তখত",
          icon: Award,
        },
      ],
    },
    {
      groupTitle: "তা'লীম ও শিক্ষা তদারকি (Academic)",
      items: [
        {
          id: "ACADEMICS" as PrincipalTabType,
          label: "জামাত ও পরীক্ষা নিয়ন্ত্রণ",
          subtitle: "কুরআন, হিফজ ও কিতাব বিভাগ",
          icon: BookOpen,
        },
        {
          id: "TEACHERS_STAFF" as PrincipalTabType,
          label: "উস্তাদ ও শিক্ষক পরিষদ",
          subtitle: "শিক্ষক তালিকা ও দায়িত্ব বণ্টন",
          icon: Users,
        },
        {
          id: "ADMISSIONS" as PrincipalTabType,
          label: "ভর্তি আবেদন ও কোটা",
          subtitle: "নতুন শিক্ষার্থী যাচাই ও অনুমোদন",
          icon: UserCheck,
        },
        {
          id: "LEAVE_MANAGEMENT" as PrincipalTabType,
          label: "ছুটি ও অবকাশ নিয়ন্ত্রণ",
          subtitle: "ছাত্র ও শিক্ষক ছুটি মঞ্জুরি",
          icon: CalendarDays,
        },
      ],
    },
    {
      groupTitle: "নির্দেশনা ও বিজ্ঞপ্তি (Directives)",
      items: [
        {
          id: "NOTICES" as PrincipalTabType,
          label: "জরুরি নোটিশ ও সার্কুলার",
          subtitle: "লাইভ নোটিশ বোর্ডে প্রকাশ",
          icon: Bell,
        },
        {
          id: "ISSUES" as PrincipalTabType,
          label: "প্রশাসনিক নির্দেশ ট্র্যাকিং",
          subtitle: "অ্যাডমিন সমাধান পর্যবেক্ষণ",
          icon: AlertTriangle,
        },
      ],
    },
    {
      groupTitle: "ক্যাম্পাস ও ছাত্রাবাস (Campus Services)",
      items: [
        {
          id: "HOSTEL_LILLAH" as PrincipalTabType,
          label: "লিল্লাহ বোর্ডিং ও মেস খানা",
          subtitle: "দৈনিক খাবার মান ও সিট বণ্টন",
          icon: Utensils,
        },
        {
          id: "CERTIFICATES" as PrincipalTabType,
          label: "সনদ ও প্রত্যয়ন অনুমোদন",
          subtitle: "চারিত্রিক ও হিফজ সনদপত্র",
          icon: CheckCircle2,
        },
        {
          id: "FEE_CONCESSION" as PrincipalTabType,
          label: "বেতন ছাড় ও এতিম তহবিল",
          subtitle: "কাস্টম বেতন ও ১০০% মওকুফ",
          icon: HeartHandshake,
        },
      ],
    },
    {
      groupTitle: "নিরীক্ষা ও প্রতিবেদন (Audit)",
      items: [
        {
          id: "REPORTS" as PrincipalTabType,
          label: "ক্যাশবুক ও মেধা তালিকা",
          subtitle: "৫-তহবিল খতিয়ান ও রেজাল্ট",
          icon: Database,
        },
      ],
    },
    {
      groupTitle: "সিস্টেম ও পরিকাঠামো (Operations)",
      items: [
        {
          id: "OPERATIONS" as PrincipalTabType,
          label: "সিস্টেম স্বাস্থ্য ও ব্যাকআপ",
          subtitle: "ক্লাউড ও ডেটাবেজ নিরাপত্তা",
          icon: Activity,
        },
      ],
    },
  ];

  // Helper for tab label
  const getTabLabel = (tab: PrincipalTabType) => {
    switch (tab) {
      case "DASHBOARD":
        return "ড্যাশবোর্ড ও কমান্ড সেন্টার";
      case "OVERVIEW":
        return "সার্বিক প্রাতিষ্ঠানিক পর্যবেক্ষণ";
      case "ACADEMICS":
        return "তা'লীমী অনুষদ ও জামাত তদারকি";
      case "TEACHERS_STAFF":
        return "উস্তাদ ও শিক্ষক পরিষদ পরিচালনা";
      case "ADMISSIONS":
        return "ভর্তি আবেদন ও কোটা তদারকি";
      case "LEAVE_MANAGEMENT":
        return "ছুটি ও অবকাশ নিয়ন্ত্রণ কেন্দ্র (Student & Staff Leaves)";
      case "FEE_CONCESSION":
        return "বেতন ছাড় ও এতিম ছাত্র কল্যাণ (Custom Tuition & Orphan Waivers)";
      case "MESSAGE":
        return "মুহতামিমের অফিসিয়াল বাণী";
      case "SIGNATURE":
        return "মুহতামিমের সিল ও ডিজিটাল স্বাক্ষর";
      case "NOTICES":
        return "জরুরি নোটিশ ও সার্কুলার";
      case "ISSUES":
        return "প্রশাসনিক নির্দেশ ট্র্যাকিং";
      case "HOSTEL_LILLAH":
        return "লিল্লাহ বোর্ডিং ও মেস খানা তদারকি";
      case "CERTIFICATES":
        return "সনদ ও প্রত্যয়নপত্র অনুমোদন কেন্দ্র";
      case "REPORTS":
        return "৫-তহবিল ক্যাশবুক ও মেধা তালিকা";
      case "OPERATIONS":
        return "সিস্টেম অপারেশন ও স্বাস্থ্য";
      default:
        return "মুহতামিম তদারকি প্যানেল";
    }
  };

  const handleSelectTab = (tab: PrincipalTabType) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      router.push(`/principal?tab=${tab}`);
    }
    setMobileMenuOpen(false);
  };

  const formattedDate = new Intl.DateTimeFormat("bn-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  // Render Sidebar Content (Shared between Desktop & Mobile Drawer)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full text-slate-100">
      {/* 1. Institutional Brand Header */}
      <div className="p-5 border-b border-emerald-800/40 bg-[#03180F]/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        <Link href="/principal" className="flex items-center gap-3 group relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white p-1 border-2 border-[#D4AF37] shadow-lg flex-shrink-0 relative group-hover:scale-105 transition duration-300">
            <Image
              src="/images/logo.jpg"
              alt="EHRJ Logo"
              fill
              sizes="48px"
              className="object-contain p-0.5 rounded-xl"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base text-white font-display tracking-tight leading-tight block truncate">
                মুহতামিম কার্যালয়
              </span>
            </div>
            <p className="text-[11px] text-[#D4AF37] font-semibold truncate leading-tight mt-0.5">
              {INSTITUTION_INFO.nameBn}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] bg-amber-400/20 text-[#D4AF37] font-bold px-1.5 py-0.5 rounded border border-amber-400/30 font-mono">
                স্থাপিত: ২০২১ ইং
              </span>
              <span className="text-[9px] bg-emerald-900/60 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-700/40">
                গভর্ন্যান্স
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* 2. Principal Profile & Authority Status Card */}
      <div className="p-4 border-b border-emerald-800/30 bg-[#042115]/50">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/70 to-[#062c1d] border border-emerald-700/30 shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-amber-200 text-slate-950 font-bold flex items-center justify-center text-sm shadow-md flex-shrink-0">
              <Shield className="w-5 h-5 text-emerald-950" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block truncate">
                {currentUser?.name || "মাওলানা মহা. আবুল কালাম সরকার"}
              </span>
              <span className="text-[10px] text-[#D4AF37] font-semibold block truncate">
                প্রতিষ্ঠাতা ও মুহতামিম (প্রধান অভিভাবক)
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-emerald-800/40 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span className="font-medium">সর্বোচ্চ তদারকি সক্রিয়</span>
            </div>
            <span className="text-[9px] text-amber-300/80 font-mono font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
              READ-ONLY & DIRECTIVES
            </span>
          </div>
        </div>
      </div>

      {/* 3. Categorized Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-emerald-800/40 scrollbar-track-transparent">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>{group.groupTitle}</span>
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  data-tab-id={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left group relative ${
                    isActive
                      ? "bg-gradient-to-r from-[#D4AF37] to-amber-500 text-slate-950 shadow-md font-extrabold translate-x-1"
                      : "text-slate-300 hover:bg-emerald-900/40 hover:text-white"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                      isActive
                        ? "bg-slate-950/20 text-slate-950"
                        : "bg-emerald-950/60 text-emerald-300 group-hover:text-amber-300 group-hover:bg-emerald-900/60"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate">{item.label}</span>
                    <span
                      className={`text-[9px] block truncate font-normal ${
                        isActive ? "text-slate-900/80" : "text-emerald-400/60 group-hover:text-emerald-300/80"
                      }`}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-4 bg-slate-950 rounded-full flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 4. Bottom Utilities & Shortcuts */}
      <div className="p-3 border-t border-emerald-800/40 bg-[#03180F]/90 space-y-1">
        <button
          type="button"
          onClick={() => setShowGuideModal(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 hover:text-white transition"
        >
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>মুহতামিম গাইড ও সহায়িকা</span>
        </button>

        <button
          type="button"
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 hover:text-white transition"
        >
          <KeyRound className="w-4 h-4 text-emerald-400" />
          <span>পাসওয়ার্ড পরিবর্তন</span>
        </button>

        <Link
          href="/"
          target="_blank"
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 hover:text-white transition"
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            <span>মূল ওয়েবসাইট</span>
          </div>
          <span className="text-[10px] text-emerald-500">ভিউ</span>
        </Link>

        <div className="pt-1">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-bold transition shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট করুন</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex font-sans selection:bg-[#0D5C3A] selection:text-white text-[#0B1914]">
      {/* DESKTOP FIXED LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-72 bg-gradient-to-b from-[#041F14] via-[#06281B] to-[#02130C] border-r border-[#D4AF37]/30 shadow-2xl h-screen sticky top-0 z-40">
        <div className="absolute inset-0 bg-islamic-pattern opacity-10 pointer-events-none" />
        {renderSidebarContent()}
      </aside>

      {/* MOBILE SLIDE-OVER DRAWER BACKDROP & DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Pane */}
          <div className="relative w-72 max-w-[85vw] bg-gradient-to-b from-[#041F14] via-[#06281B] to-[#02130C] border-r border-[#D4AF37]/30 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-emerald-950/60 text-emerald-200 hover:text-white border border-emerald-700/50 z-20"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute inset-0 bg-islamic-pattern opacity-10 pointer-events-none" />
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {/* TOP EXECUTIVE APP BAR */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Left: Mobile Toggle & Dynamic Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition"
                title="মেনু খুলুন"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <Link href="/principal" className="hover:text-emerald-800 transition">
                    মুহতামিম কার্যালয়
                  </Link>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="text-emerald-900 font-bold truncate max-w-[160px] sm:max-w-none">
                    {getTabLabel(activeTab)}
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 font-display flex items-center gap-2 truncate">
                  <span>{title || getTabLabel(activeTab)}</span>
                  {subtitle && (
                    <span className="hidden md:inline text-xs font-normal text-slate-400 border-l border-slate-200 pl-2">
                      {subtitle}
                    </span>
                  )}
                </h1>
              </div>
            </div>

            {/* Right: Live Date, Quick Action Shortcuts & Refresh */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Live Bengali Date */}
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-emerald-900 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>{formattedDate}</span>
              </div>

              {/* Quick Action: Issue Directive */}
              <button
                type="button"
                onClick={() => handleSelectTab("ISSUES")}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-bold transition shadow-2xs"
                title="নতুন প্রশাসনিক নির্দেশ জারি করুন"
              >
                <Send className="w-3.5 h-3.5 text-amber-700" />
                <span>+ নির্দেশ দিন</span>
              </button>

              {/* Quick Action: Publish Notice */}
              <button
                type="button"
                onClick={() => handleSelectTab("NOTICES")}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs"
                title="জরুরি নোটিশ জারি করুন"
              >
                <Bell className="w-3.5 h-3.5 text-amber-300" />
                <span>+ নোটিশ জারি</span>
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={() => window.print()}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition shadow-2xs flex items-center gap-1.5"
                title="প্রিন্ট বা PDF সংরক্ষণ"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden md:inline">প্রিন্ট</span>
              </button>

              {/* Refresh Button */}
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs"
                  title="তথ্য রিফ্রেশ করুন"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-700" : ""}`} />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
          {children}
        </main>
      </div>

      {/* USER GUIDE MODAL */}
      <UserGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        role="PRINCIPAL"
      />

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

export default PrincipalShell;
