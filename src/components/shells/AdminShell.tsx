"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  DollarSign,
  CalendarCheck,
  FileCheck2,
  BookOpen,
  Building,
  Bus,
  Boxes,
  Briefcase,
  HelpCircle,
  ShieldCheck,
  Settings,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Sliders,
  FileText,
  UserCheck,
  Layers,
  ChevronRight,
  TrendingUp,
  CreditCard,
  DoorOpen,
  Heart,
} from "lucide-react";
import EhrjBreadcrumb, { BreadcrumbItem } from "@/components/ui/EhrjBreadcrumb";
import CommandPalette from "@/components/search/CommandPalette";

export interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  tabKey?: string;
}

export function AdminShell({ children, title, subtitle, breadcrumbs, actions }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null);

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

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: "মূল ড্যাশবোর্ড ও শিক্ষার্থী",
      items: [
        { label: "ককপিট ড্যাশবোর্ড", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: "শিক্ষার্থী তালিকা", href: "/admin/students", icon: <GraduationCap className="w-4 h-4" /> },
        { label: "ডিজিটাল আইডি কার্ড", href: "/admin/idcards", icon: <CreditCard className="w-4 h-4" /> },
        { label: "ভর্তি আবেদন", href: "/admin/admissions", icon: <UserCheck className="w-4 h-4" /> },
        { label: "অভিভাবক ডাটাবেজ", href: "/admin/guardians", icon: <Users className="w-4 h-4" /> },
      ],
    },
    {
      title: "একাডেমিক ও পাঠদান",
      items: [
        { label: "উপস্থিতি নিয়ন্ত্রণ", href: "/admin?tab=ATTENDANCE", tabKey: "ATTENDANCE", icon: <CalendarCheck className="w-4 h-4" /> },
        { label: "পরীক্ষা ও ফলাফল", href: "/admin/exams", icon: <FileCheck2 className="w-4 h-4" /> },
        { label: "সনদ ও প্রত্যয়ন", href: "/admin?tab=DOCUMENTS", tabKey: "DOCUMENTS", icon: <FileText className="w-4 h-4" /> },
      ],
    },
    {
      title: "অর্থায়ন, সংগ্রহ ও বাজেট",
      items: [
        { label: "ফি ও আর্থিক হিসাব", href: "/admin?tab=FINANCE", tabKey: "FINANCE", icon: <DollarSign className="w-4 h-4" /> },
        { label: "দান ও মাহফিল তহবিল", href: "/admin/donations", icon: <Heart className="w-4 h-4" /> },
        { label: "সরবরাহ ও প্রকিউরমেন্ট", href: "/admin/procurement", icon: <Boxes className="w-4 h-4" /> },
        { label: "বাজেট ও তহবিল", href: "/admin/budgets", icon: <TrendingUp className="w-4 h-4" /> },
      ],
    },
    {
      title: "ক্যাম্পাস ও অপারেশন",
      items: [
        { label: "সিকিউরিটি গেটপাস", href: "/admin/gatepass", icon: <DoorOpen className="w-4 h-4" /> },
        { label: "আবাসিক ছাত্রাবাস", href: "/admin?tab=HOSTEL", tabKey: "HOSTEL", icon: <Building className="w-4 h-4" /> },
        { label: "পরিবহন সেবা", href: "/admin?tab=TRANSPORT", tabKey: "TRANSPORT", icon: <Bus className="w-4 h-4" /> },
        { label: "কিতাবাগার / লাইব্রেরি", href: "/admin?tab=LIBRARY", tabKey: "LIBRARY", icon: <BookOpen className="w-4 h-4" /> },
        { label: "সম্পদ ও ইনভেন্টরি", href: "/admin?tab=INVENTORY", tabKey: "INVENTORY", icon: <Sliders className="w-4 h-4" /> },
        { label: "মানবসম্পদ ও শিক্ষক", href: "/admin?tab=HR", tabKey: "HR", icon: <Briefcase className="w-4 h-4" /> },
        { label: "নোটিশ ও যোগাযোগ", href: "/admin/notices", icon: <Bell className="w-4 h-4" /> },
        { label: "হেল্পডেস্ক টিকেট", href: "/admin?tab=HELPDESK", tabKey: "HELPDESK", icon: <HelpCircle className="w-4 h-4" /> },
      ],
    },
    {
      title: "সুশাসন ও নিরাপত্তা",
      items: [
        { label: "গভর্ন্যান্স ও কমপ্লায়েন্স", href: "/admin/governance", icon: <ShieldCheck className="w-4 h-4" /> },
        { label: "ডেটা কোয়ালিটি", href: "/admin/data-quality", icon: <Layers className="w-4 h-4" /> },
        { label: "নিরাপত্তা ও অডিট", href: "/admin/security", icon: <ShieldCheck className="w-4 h-4" /> },
        { label: "সিস্টেম ইউজার", href: "/admin/users", icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  const isNavActive = (item: NavItem) => {
    if (typeof window === "undefined") {
      return pathname === item.href;
    }
    if (item.href === "/admin") {
      return pathname === "/admin" && !window.location.search;
    }
    if (item.tabKey) {
      return pathname === "/admin" && window.location.search.includes(`tab=${item.tabKey}`);
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#0D5C3A] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#041F14] text-white border-b border-[#D4AF37]/50 shadow-md">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle + Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
              aria-label="নেভিগেশন মেনু"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white border border-[#D4AF37] p-0.5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                <Image
                  src="/images/logo.jpg"
                  alt="EHRJ Logo"
                  width={34}
                  height={34}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white font-display">ইলিয়টগঞ্জ মাদরাসা</span>
                  <span className="text-[10px] bg-[#D4AF37] text-slate-900 font-bold px-1.5 py-0.2 rounded font-mono">
                    ERP
                  </span>
                </div>
                <p className="text-[11px] text-[#D4AF37] font-arabic leading-none">الجامعة الإسلامية رحمة الله</p>
              </div>
            </Link>
          </div>

          {/* Center: Command Palette Trigger */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-300 text-xs flex items-center justify-between transition group shadow-inner"
            >
              <span className="flex items-center gap-2 text-slate-300 group-hover:text-white">
                <Search className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>মডিউল বা শিক্ষার্থী খুঁজুন...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono text-slate-400 border border-white/10">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right: Actions + User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
              aria-label="অনুসন্ধান"
            >
              <Search className="w-5 h-5 text-[#D4AF37]" />
            </button>

            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-slate-200 font-medium transition"
              title="পাবলিক ওয়েবসাইট দেখুন"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>মূল সাইট</span>
            </Link>

            {/* User Dropdown / Info */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/15">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white truncate max-w-[120px]">
                  {currentUser?.name || "অ্যাডমিনিস্ট্রেটর"}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
                  {currentUser?.role || "ADMIN"}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/50 transition"
                title="লগআউট"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/90 shadow-xs flex-shrink-0">
          <div className="p-3.5 overflow-y-auto flex-1 space-y-6">
            {navSections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block">
                  {sec.title}
                </span>
                <div className="space-y-0.5">
                  {sec.items.map((item, iIdx) => {
                    const active = isNavActive(item);
                    return (
                      <Link
                        key={iIdx}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition select-none ${
                          active
                            ? "bg-[#0D5C3A] text-white shadow-sm shadow-emerald-950/15"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={active ? "text-white" : "text-emerald-700"}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 flex items-center justify-between">
            <span>সংস্করণ: ২.০ (২০২৬)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="সিস্টেম সচল" />
          </div>
        </aside>

        {/* Mobile Drawer (Sidebar) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-sm animate-fadeIn flex"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="w-72 bg-white h-full shadow-2xl flex flex-col animate-slideRight"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="font-bold text-sm text-slate-800 font-display">ইআরপি নেভিগেশন</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 overflow-y-auto flex-1 space-y-6">
                {navSections.map((sec, sIdx) => (
                  <div key={sIdx} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block">
                      {sec.title}
                    </span>
                    <div className="space-y-0.5">
                      {sec.items.map((item, iIdx) => {
                        const active = isNavActive(item);
                        return (
                          <Link
                            key={iIdx}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition select-none ${
                              active
                                ? "bg-[#0D5C3A] text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={active ? "text-white" : "text-emerald-700"}>{item.icon}</span>
                              <span>{item.label}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {/* Action / Breadcrumb Subheader */}
          {(title || breadcrumbs || actions) && (
            <div className="p-4 sm:p-6 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                {breadcrumbs && <EhrjBreadcrumb items={breadcrumbs} homeHref="/admin" />}
                {title && (
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
                    {title}
                  </h1>
                )}
                {subtitle && <p className="text-xs sm:text-sm text-slate-500 font-sans">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
            </div>
          )}

          {/* Child Page Content */}
          <div className="p-4 sm:p-6 flex-1">{children}</div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </div>
  );
}

export default AdminShell;
