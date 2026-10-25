"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  GraduationCap,
  CalendarCheck,
  DollarSign,
  FileCheck2,
  FileText,
  Bell,
  HelpCircle,
  Home,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import EhrjBreadcrumb, { BreadcrumbItem } from "@/components/ui/EhrjBreadcrumb";

export interface GuardianShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  activeStudentId?: string;
  onChildSwitch?: (studentId: string) => void;
}

interface StudentOption {
  id: string;
  studentNameBn: string;
  studentId: string;
  class?: { nameBn: string };
  section?: { nameBn: string };
  roll?: string;
}

export function GuardianShell({
  children,
  title,
  subtitle,
  breadcrumbs,
  actions,
  activeStudentId,
  onChildSwitch,
}: GuardianShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [guardianUser, setGuardianUser] = useState<{ name: string; phone?: string } | null>(null);
  const [childrenList, setChildrenList] = useState<StudentOption[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>(activeStudentId || "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 1. Fetch guardian profile
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setGuardianUser(data.user);
        }
      })
      .catch(() => {});

    // 2. Fetch linked children
    fetch("/api/portal/children")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.children && data.children.length > 0) {
          setChildrenList(data.children);
          if (!selectedChildId) {
            const firstId = data.children[0].id;
            setSelectedChildId(firstId);
            if (onChildSwitch) onChildSwitch(firstId);
          }
        }
      })
      .catch(() => {});
  }, [selectedChildId, onChildSwitch]);

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
    if (onChildSwitch) onChildSwitch(childId);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const navLinks = [
    { label: "হোম ড্যাশবোর্ড", href: "/portal", icon: <Home className="w-4 h-4" /> },
    { label: "সন্তানের তথ্য", href: "/portal/children", icon: <Users className="w-4 h-4" /> },
    { label: "উপস্থিতি", href: "/portal/attendance", icon: <CalendarCheck className="w-4 h-4" /> },
    { label: "ফি ও পেমেন্ট", href: "/portal/finance", icon: <DollarSign className="w-4 h-4" /> },
    { label: "ফলাফল", href: "/portal/results", icon: <FileCheck2 className="w-4 h-4" /> },
    { label: "সনদ ও নথি", href: "/portal/documents", icon: <FileText className="w-4 h-4" /> },
    { label: "নোটিশ", href: "/portal/notifications", icon: <Bell className="w-4 h-4" /> },
    { label: "হেল্পডেস্ক", href: "/portal/helpdesk", icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const currentChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#0D5C3A] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#041F14] text-white border-b border-[#D4AF37]/50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Mobile Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/portal" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white border border-[#D4AF37] p-0.5 overflow-hidden flex-shrink-0">
                <Image src="/images/logo.jpg" alt="EHRJ Logo" width={34} height={34} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white font-display">অভিভাবক পোর্টাল</span>
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded font-mono">
                    GUARDIAN
                  </span>
                </div>
                <p className="text-[10px] text-[#D4AF37] font-arabic leading-none">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</p>
              </div>
            </Link>
          </div>

          {/* Child Switcher (Desktop) */}
          {childrenList.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/15">
              <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs text-slate-300">সন্তান:</span>
              <select
                value={selectedChildId}
                onChange={(e) => handleChildSelect(e.target.value)}
                className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer pr-2"
              >
                {childrenList.map((c) => (
                  <option key={c.id} value={c.id} className="text-slate-900">
                    {c.studentNameBn} ({c.class?.nameBn || "ক্লাস"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* User info & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-white block truncate max-w-[130px]">
                {guardianUser?.name || "সম্মানিত অভিভাবক"}
              </span>
              <span className="text-[10px] text-amber-300 block">{guardianUser?.phone || "নিবন্ধিত অভিভাবক"}</span>
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
      </header>

      {/* Navigation Subheader (Desktop) */}
      <div className="hidden lg:block bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <nav className="flex items-center gap-1 py-2 overflow-x-auto">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    active ? "bg-[#0D5C3A] text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span className={active ? "text-white" : "text-emerald-700"}>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-sm flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="w-72 bg-white h-full shadow-2xl p-4 flex flex-col space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-800 font-display">অভিভাবক মেনু</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Child Switcher on Mobile */}
            {childrenList.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 block">সন্তান নির্বাচন করুন:</span>
                <select
                  value={selectedChildId}
                  onChange={(e) => {
                    handleChildSelect(e.target.value);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none"
                >
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.studentNameBn} ({c.class?.nameBn || "ক্লাস"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1 flex-1 overflow-y-auto">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      active ? "bg-[#0D5C3A] text-white" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className={active ? "text-white" : "text-emerald-700"}>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {(title || breadcrumbs || actions) && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
            <div className="space-y-1">
              {breadcrumbs && <EhrjBreadcrumb items={breadcrumbs} homeHref="/portal" />}
              {title && <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">{title}</h1>}
              {subtitle && <p className="text-xs text-slate-500 font-sans">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

export default GuardianShell;
