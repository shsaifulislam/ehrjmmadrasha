"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  FileCheck2,
  Calendar,
  Users,
  LogOut,
  Bell,
  BookOpen,
  Briefcase,
  Home,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import EhrjBreadcrumb, { BreadcrumbItem } from "@/components/ui/EhrjBreadcrumb";

export interface TeacherShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function TeacherShell({ children, title, subtitle, breadcrumbs, actions }: TeacherShellProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navLinks = [
    { label: "ড্যাশবোর্ড", href: "/teacher", icon: <Home className="w-4 h-4" /> },
    { label: "উপস্থিতি গ্রহণ", href: "/teacher/attendance", icon: <CalendarCheck className="w-4 h-4" /> },
    { label: "নম্বর এন্ট্রি", href: "/teacher/exams", icon: <FileCheck2 className="w-4 h-4" /> },
    { label: "ক্লাস রুটিন", href: "/teacher/routine", icon: <Calendar className="w-4 h-4" /> },
    { label: "আমার ছাত্রগণ", href: "/teacher/students", icon: <Users className="w-4 h-4" /> },
    { label: "নোটিশ", href: "/teacher/notices", icon: <Bell className="w-4 h-4" /> },
    { label: "ছুটির আবেদন", href: "/teacher/leave", icon: <Briefcase className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#0D5C3A] selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#041F14] text-white border-b border-[#D4AF37]/50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/teacher" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white border border-[#D4AF37] p-0.5 overflow-hidden flex-shrink-0">
                <Image src="/images/logo.jpg" alt="EHRJ Logo" width={34} height={34} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white font-display">শিক্ষক প্যানেল</span>
                  <span className="text-[10px] bg-emerald-700 text-emerald-100 font-bold px-1.5 py-0.2 rounded font-mono">
                    TEACHER
                  </span>
                </div>
                <p className="text-[10px] text-[#D4AF37] font-arabic leading-none">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</p>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    active ? "bg-[#0D5C3A] text-white shadow-xs" : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-white block truncate max-w-[140px]">
                {currentUser?.name || "সম্মানিত শিক্ষক"}
              </span>
              <span className="text-[10px] text-emerald-300 block">কার্যরত শিক্ষক</span>
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-slate-950/60 backdrop-blur-sm flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="w-64 bg-white h-full shadow-2xl p-4 flex flex-col space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-800 font-display">শিক্ষক মেনু</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {(title || breadcrumbs || actions) && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
            <div className="space-y-1">
              {breadcrumbs && <EhrjBreadcrumb items={breadcrumbs} homeHref="/teacher" />}
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

export default TeacherShell;
