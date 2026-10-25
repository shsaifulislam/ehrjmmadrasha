"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  User,
  Users,
  Search,
  LogOut,
  ChevronDown,
  ExternalLink,
  GraduationCap,
  ShieldCheck,
  Award,
  Sparkles,
  BookOpen,
  ArrowRight,
  PhoneCall,
  Calendar,
  Clock,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
import { useLanguage } from "@/context/LanguageContext";

interface UserProfile {
  name: string;
  role: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const { language, setLanguage, t } = useLanguage();

  // Dropdown states for mobile and desktop
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "ADMIN") return "/admin";
    if (user.role === "PRINCIPAL") return "/principal";
    if (user.role === "TEACHER") return "/teacher";
    if (user.role === "GUARDIAN") return "/portal";
    return "/login";
  };

  const triggerCommandPalette = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  return (
    <header className="w-full z-50 bg-white shadow-sm transition-all duration-300">
      
      {/* =========================================================
          1. TOP UTILITY STRIP (DSKM / DU STYLE)
      ========================================================= */}
      <div className="bg-[#041F14] text-emerald-100 text-[11px] py-1 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/60 font-sans">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Institutional Identifiers */}
          <div className="flex items-center gap-3 sm:gap-4 text-emerald-200/90 font-medium">
            <span className="hidden sm:inline bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60 text-[#D4AF37] font-semibold text-[10px]">
              {t("স্থাপিত: ২০২১ ইং", "Est: 2021")}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#D4AF37]" />
              <span>{t("ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা", "Eliotgonj, Daudkandi, Cumilla")}</span>
            </span>
            <span className="hidden md:flex items-center gap-1 font-mono text-emerald-300">
              <Phone className="w-3 h-3 text-[#D4AF37]" />
              <span>{INSTITUTION_INFO.primaryPhone}</span>
            </span>
          </div>

          {/* Right Tools: Result, Search, Language */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={triggerCommandPalette}
              className="hidden md:flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 px-2.5 py-0.5 rounded-full text-[11px] font-mono transition cursor-pointer"
            >
              <Search className="w-3 h-3 text-[#D4AF37]" />
              <span>{t("অনুসন্ধান", "Search")}</span>
              <kbd className="bg-emerald-900 px-1 py-0.2 rounded text-[10px] text-amber-200 font-mono">
                Ctrl K
              </kbd>
            </button>

            <Link
              href="/results"
              className="text-amber-300 hover:text-amber-200 flex items-center gap-1 font-semibold text-[11px] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full transition"
            >
              <Award className="w-3 h-3 text-[#D4AF37]" />
              <span>{t("রেজাল্ট যাচাই", "Verify Result")}</span>
            </Link>

            <div className="flex items-center bg-black/40 border border-emerald-700/60 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setLanguage("bn")}
                className={`px-1.5 py-0.2 rounded-full transition ${
                  language === "bn" ? "bg-[#0D5C3A] text-amber-300 font-black" : "text-emerald-300/80 hover:text-white"
                }`}
              >
                বাংলা
              </button>
              <span className="text-emerald-700 px-0.5">•</span>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-1.5 py-0.2 rounded-full transition ${
                  language === "en" ? "bg-[#0D5C3A] text-amber-300 font-black" : "text-emerald-300/80 hover:text-white"
                }`}
              >
                EN
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================
          2. GRAND INSTITUTIONAL BANNER (PRESTIGIOUS HEADER)
      ========================================================= */}
      <div className="bg-gradient-to-b from-white via-slate-50/50 to-white py-3 sm:py-4 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Crest + Grand Typography */}
          <Link href="/" className="flex items-center gap-3.5 sm:gap-4 group text-center md:text-left">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 border-[#D4AF37] p-1 bg-white shadow-md flex-shrink-0 group-hover:scale-105 transition duration-300">
              <Image
                src="/images/logo.jpg"
                alt="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা লোগো"
                width={80}
                height={80}
                className="w-full h-full object-cover rounded-full"
                priority
              />
            </div>
            <div>
              <div className="font-arabic text-[#D4AF37] text-xs sm:text-sm font-semibold leading-none mb-1">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
              <span className="block text-lg sm:text-2xl md:text-3xl font-extrabold text-[#0D5C3A] font-serif-bn tracking-tight leading-tight group-hover:text-emerald-800 transition">
                {INSTITUTION_INFO.nameBn}
              </span>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium font-sans">
                {INSTITUTION_INFO.nameEn}
              </p>
              <div className="hidden sm:flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.2 rounded border border-emerald-200 font-serif-bn">
                  স্থাপিত: {INSTITUTION_INFO.established}ইং
                </span>
                <span className="text-slate-400">•</span>
                <span>নূরানী, হিফজুল কুরআন ও কিতাব বিভাগ</span>
                <span className="text-slate-400">•</span>
                <span>লিল্লাহ বোর্ডিং ও এতিমখানা</span>
              </div>
            </div>
          </Link>

          {/* Right Action Callouts */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 font-medium">ভর্তি সংক্রান্ত হেল্পলাইন</div>
              <a
                href={`tel:${INSTITUTION_INFO.primaryPhone}`}
                className="text-base font-extrabold text-[#0D5C3A] font-mono hover:underline flex items-center justify-end gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{INSTITUTION_INFO.primaryPhone}</span>
              </a>
            </div>
            <Link
              href="/admission"
              className="bg-[#D4AF37] hover:bg-amber-500 text-slate-950 px-4 py-2 rounded font-bold text-xs shadow transition hover:shadow-md flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4" />
              <span>অনলাইনে ভর্তি আবেদন</span>
            </Link>
          </div>

          {/* Mobile & Tablet Menu Toggle Button */}
          <div className="flex lg:hidden items-center justify-between w-full pt-1 border-t border-slate-100">
            <span className="text-xs font-semibold text-emerald-800 font-serif-bn">
              মেনু ব্রাউজ করুন
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* =========================================================
          3. MAIN HORIZONTAL NAVIGATION RIBBON (MENU BAR)
      ========================================================= */}
      <nav className="bg-[#0D5C3A] text-white border-y border-emerald-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden lg:flex items-center justify-between">
            
            {/* Primary Navigation Links */}
            <div className="flex items-center font-serif-bn text-sm font-semibold">
              <Link
                href="/"
                className={`px-3.5 py-2.5 transition border-b-2 ${
                  pathname === "/" ? "bg-[#083E26] border-[#D4AF37] text-amber-300" : "border-transparent hover:bg-emerald-800 text-white"
                }`}
              >
                প্রচ্ছদ
              </Link>

              {/* পরিচিতি (About Dropdown) */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown("about")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href="/about"
                  className={`px-3.5 py-2.5 flex items-center gap-1 transition border-b-2 ${
                    pathname.startsWith("/about") ? "bg-[#083E26] border-[#D4AF37] text-amber-300" : "border-transparent hover:bg-emerald-800 text-white"
                  }`}
                >
                  <span>পরিচিতি</span>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
                </Link>
                <div className="absolute top-full left-0 w-52 bg-white text-slate-800 shadow-xl rounded-b-md border border-slate-200 py-1.5 z-50 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-150">
                  <Link href="/about" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    এক নজরে মাদরাসা
                  </Link>
                  <Link href="/about#principal" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    অধ্যক্ষের বাণী ও পরিচিতি
                  </Link>
                  <Link href="/about#history" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    মাদরাসার ইতিহাস ও লক্ষ্য
                  </Link>
                  <Link href="/about#committee" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    পরিচালনা পর্ষদ
                  </Link>
                </div>
              </div>

              {/* একাডেমিক (Academic Dropdown) */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown("academic")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href="/academic"
                  className={`px-3 py-2.5 flex items-center gap-1 transition border-b-2 ${
                    pathname.startsWith("/academic") ? "bg-[#083E26] border-[#D4AF37] text-amber-300" : "border-transparent hover:bg-emerald-800 text-white"
                  }`}
                >
                  <span>একাডেমিক</span>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
                </Link>
                <div className="absolute top-full left-0 w-56 bg-white text-slate-800 shadow-xl rounded-b-md border border-slate-200 py-1.5 z-50 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-150">
                  <Link href="/academic#noorani" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    নূরানী ও নাজেরা বিভাগ
                  </Link>
                  <Link href="/academic#hifz" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    তাহফিজুল কুরআন বিভাগ
                  </Link>
                  <Link href="/academic#kitab" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    কিতাব ও দাওরায়ে হাদিস
                  </Link>
                  <Link href="/calendar" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    ক্লাস ও পরীক্ষার রুটিন
                  </Link>
                  <Link href="/library" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    কিতাবখানা ও ই-লাইব্রেরি
                  </Link>
                  <Link href="/transport" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    ছাত্র পরিবহন ও রুট সুবিধা
                  </Link>
                </div>
              </div>

              {/* ভর্তি তথ্য (Admission Dropdown) */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown("admission")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href="/admission"
                  className={`px-3 py-2.5 flex items-center gap-1 transition border-b-2 ${
                    pathname.startsWith("/admission") ? "bg-[#083E26] border-[#D4AF37] text-amber-300" : "border-transparent hover:bg-emerald-800 text-white"
                  }`}
                >
                  <span>ভর্তি তথ্য</span>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
                </Link>
                <div className="absolute top-full left-0 w-56 bg-white text-slate-800 shadow-xl rounded-b-md border border-slate-200 py-1.5 z-50 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-150">
                  <Link href="/admission" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    ভর্তি নির্দেশিকা ও নিয়মাবলী
                  </Link>
                  <Link href="/admission#form" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    অনলাইনে ভর্তি ফরম
                  </Link>
                  <Link href="/admission/track" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    আবেদনের অবস্থা অনুসন্ধান
                  </Link>
                  <Link href="/downloads" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    ভর্তি ফরম ও প্রসপেক্টাস ডাউনলোড
                  </Link>
                </div>
              </div>

              <Link
                href="/results"
                className={`px-3 py-2.5 transition border-b-2 ${
                  pathname === "/results" ? "bg-[#083E26] border-[#D4AF37] text-amber-300" : "border-transparent hover:bg-emerald-800 text-white"
                }`}
              >
                ফলাফল
              </Link>

              <Link
                href="/notices"
                className={`px-3 py-2.5 transition border-b-2 ${
                  pathname.startsWith("/notices") ? "bg-[#083E26] border-[#D4AF37] text-amber-300" : "border-transparent hover:bg-emerald-800 text-white"
                }`}
              >
                নোটিশ
              </Link>

              {/* ক্যালেন্ডার ও ইভেন্ট (Calendar & Events Dropdown) */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown("events")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  className={`px-3 py-2.5 flex items-center gap-1 transition border-b-2 ${
                    pathname.startsWith("/calendar") || pathname.startsWith("/events") || pathname.startsWith("/alumni") ? "bg-[#083E26] border-[#D4AF37] text-amber-300" : "border-transparent hover:bg-emerald-800 text-white"
                  }`}
                >
                  <span>ক্যালেন্ডার ও ইভেন্ট</span>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
                </button>
                <div className="absolute top-full left-0 w-56 bg-white text-slate-800 shadow-xl rounded-b-md border border-slate-200 py-1.5 z-50 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-150">
                  <Link href="/calendar" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    প্রাতিষ্ঠানিক ও একাডেমিক ক্যালেন্ডার
                  </Link>
                  <Link href="/events" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    প্রতিযোগিতা ও অনুষ্ঠানমালা
                  </Link>
                  <Link href="/alumni" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                    প্রাক্তন শিক্ষার্থী ফোরাম (Alumni)
                  </Link>
                </div>
              </div>

              <Link
                href="/downloads"
                className={`px-3 py-2.5 transition border-b-2 ${
                  pathname === "/downloads" ? "bg-[#083E26] border-[#D4AF37] text-amber-300" : "border-transparent hover:bg-emerald-800 text-white"
                }`}
              >
                ডাউনলোড
              </Link>

              <Link
                href="/gallery"
                className={`px-3 py-2.5 transition border-b-2 ${
                  pathname === "/gallery" ? "bg-[#083E26] border-[#D4AF37] text-amber-300" : "border-transparent hover:bg-emerald-800 text-white"
                }`}
              >
                গ্যালারি
              </Link>

              <Link
                href="/donate"
                className={`px-3 py-2.5 transition border-b-2 ${
                  pathname === "/donate" ? "bg-[#083E26] border-[#D4AF37] text-amber-300" : "border-transparent hover:bg-emerald-800 text-white"
                }`}
              >
                দান ও যাকাত
              </Link>

              <Link
                href="/verify"
                className={`px-3 py-2.5 transition border-b-2 ${
                  pathname.startsWith("/verify") ? "bg-[#083E26] border-[#D4AF37] text-amber-300" : "border-transparent hover:bg-emerald-800 text-white"
                }`}
              >
                যাচাই
              </Link>

              <Link
                href="/contact"
                className={`px-3 py-2.5 transition border-b-2 ${
                  pathname === "/contact" ? "bg-[#083E26] border-[#D4AF37] text-amber-300" : "border-transparent hover:bg-emerald-800 text-white"
                }`}
              >
                যোগাযোগ
              </Link>
            </div>

            {/* Quick Web App Mode Action Button */}
            <Link
              href="/app"
              className="hidden lg:flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-[#D4AF37] to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 px-3.5 py-1 rounded text-xs font-extrabold transition shadow-md border border-amber-300 group"
              title="সম্পূর্ণ ডিজিটাল ক্যাম্পাস ওয়েব অ্যাপ খুলুন"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-950 group-hover:rotate-12 transition-transform" />
              <span>📱 ওয়েব অ্যাপ</span>
            </Link>

            {/* Portal Login Dropdown */}
            <div className="relative group py-1.5">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={getDashboardLink()}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{user.name || "ড্যাশবোর্ড"}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-1 text-emerald-200 hover:text-white"
                    title="লগআউট"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center">
                  <Link
                    href="/login"
                    className="bg-[#083E26] hover:bg-[#052b1a] text-amber-300 border border-emerald-600 px-3.5 py-1 rounded text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>লগইন পোর্টাল</span>
                    <ChevronDown className="w-3 h-3" />
                  </Link>
                  <div className="absolute top-full right-0 w-48 bg-white text-slate-800 shadow-xl rounded-b-md border border-slate-200 py-1.5 z-50 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-150">
                    <Link href="/login?tab=guardian" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                      👨‍👩‍👦 অভিভাবক পোর্টাল
                    </Link>
                    <Link href="/login?tab=teacher" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                      👨‍🏫 শিক্ষক লগইন
                    </Link>
                    <Link href="/login?tab=admin" className="block px-4 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-[#0D5C3A] transition">
                      🔐 প্রশাসন ও পরিচালনা
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Mobile & Tablet Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-3 space-y-1 font-serif-bn border-t border-emerald-800 text-sm">
              <Link
                href="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-[#D4AF37] text-slate-950 font-bold shadow mb-2"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#041F14]" />
                  <span>📱 সম্পূর্ণ ওয়েব অ্যাপ (App Mode)</span>
                </span>
                <span className="text-[10px] bg-[#041F14] text-white px-2 py-0.5 rounded-full font-sans">
                  PRO
                </span>
              </Link>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                প্রচ্ছদ
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                মাদরাসা পরিচিতি
              </Link>
              <Link
                href="/academic"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                একাডেমিক বিভাগসমূহ
              </Link>
              <Link
                href="/admission"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                ভর্তি নির্দেশিকা ও ফরম
              </Link>
              <Link
                href="/results"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                পরীক্ষার ফলাফল
              </Link>
              <Link
                href="/calendar"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                📅 ক্লাস ও পরীক্ষার ক্যালেন্ডার
              </Link>
              <Link
                href="/events"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                🏆 প্রতিযোগিতা ও অনুষ্ঠানমালা
              </Link>
              <Link
                href="/downloads"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                📥 ডাউনলোড হাব ও সিলেবাস
              </Link>
              <Link
                href="/library"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                📚 কিতাবখানা ও ই-লাইব্রেরি
              </Link>
              <Link
                href="/transport"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                🚌 ছাত্র পরিবহন সেবা
              </Link>
              <Link
                href="/alumni"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                🎓 প্রাক্তন শিক্ষার্থী ফোরাম
              </Link>
              <Link
                href="/verify"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                🔍 সনদপত্র ও আইডি যাচাই
              </Link>
              <Link
                href="/notices"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                নোটিশ বোর্ড
              </Link>
              <Link
                href="/gallery"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                ফটো গ্যালারি
              </Link>
              <Link
                href="/donate"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                দান ও যাকাত
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-emerald-800 transition"
              >
                যোগাযোগ
              </Link>
              <div className="pt-2 border-t border-emerald-800">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded bg-amber-400 text-slate-950 font-bold text-center"
                >
                  পোর্টাল লগইন
                </Link>
              </div>
            </div>
          )}

        </div>
      </nav>

    </header>
  );
}
