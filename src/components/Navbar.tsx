"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, Menu, X, User, Heart, GraduationCap, FileText, Home, LogOut, Search } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

interface UserProfile {
  name: string;
  role: string;
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

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
    if (user.role === "TEACHER") return "/teacher";
    return "/login";
  };

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* 1. Top Utility Header */}
      <div className="bg-[#0B1914] text-gray-300 text-xs py-1.5 px-4 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Contact Details */}
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
              পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-gray-300">
              <Phone className="w-3.5 h-3.5 text-[#C59B27]" />
              {INSTITUTION_INFO.primaryPhone}
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-gray-300">
              <Mail className="w-3.5 h-3.5 text-[#C59B27]" />
              {INSTITUTION_INFO.email}
            </span>
          </div>

          {/* Right: Language switch & Portal quick CTA */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border border-emerald-900 rounded px-1.5 py-0.5 bg-emerald-950/40 text-[11px]">
              <span className="text-[#C59B27] font-semibold cursor-pointer">বাংলা</span>
              <span className="text-gray-600">|</span>
              <span className="hover:text-white cursor-pointer transition">English</span>
              <span className="text-gray-600">|</span>
              <Link href="/search" className="text-gray-300 hover:text-white flex items-center gap-1 cursor-pointer transition">
                <Search className="w-3.5 h-3.5 text-[#C59B27]" />
                সার্চ
              </Link>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={getDashboardLink()}
                  className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-2.5 py-0.5 rounded text-[11px] font-medium transition"
                >
                  {user.name} ({user.role})
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-400 transition"
                  title="লগআউট"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-[#C59B27] hover:text-amber-300 flex items-center gap-1 text-[11px] font-semibold transition"
              >
                <User className="w-3 h-3" />
                পোর্টাল / রেজাল্ট অনুসন্ধান
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Institutional Navbar */}
      <nav className="bg-[#0D5C3A] text-white px-4 py-3 border-b-2 border-[#C59B27]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full bg-white border-2 border-[#C59B27] overflow-hidden shadow-md flex-shrink-0 flex items-center justify-center">
              <Image
                src="/images/logo.jpg"
                alt="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা লোগো"
                width={48}
                height={48}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <div className="font-arabic text-amber-200 text-xs leading-none mb-0.5">
                الجامعة الإسلامية رحمة الله إليوت غنج
              </div>
              <h1 className="font-display font-bold text-base sm:text-lg md:text-xl text-white tracking-tight leading-tight">
                {INSTITUTION_INFO.nameBn}
              </h1>
              <p className="text-[11px] text-emerald-200 hidden sm:block">
                কওমি ও হাফিজিয়া মাদ্রাসা, লিল্লাহ বোর্ডিং ও এতিমখানা কমপ্লেক্স (স্থাপিত: {INSTITUTION_INFO.established}ইং)
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden xl:flex items-center gap-4 text-xs font-semibold">
            <Link href="/" className="text-emerald-100 hover:text-[#C59B27] transition">
              মূল পাতা
            </Link>
            <Link href="/about" className="text-emerald-100 hover:text-[#C59B27] transition">
              পরিচিতি
            </Link>
            <Link href="/academic" className="text-emerald-100 hover:text-[#C59B27] transition">
              শিক্ষা বিভাগ
            </Link>
            <Link href="/admission" className="text-emerald-100 hover:text-[#C59B27] transition">
              ভর্তি
            </Link>
            <Link
              href="/search"
              className="text-emerald-100 hover:text-[#C59B27] flex items-center gap-1 transition"
            >
              <Search className="w-3.5 h-3.5 text-amber-300" />
              অনুসন্ধান
            </Link>
            <button
              onClick={() => {
                const event = new KeyboardEvent("keydown", {
                  key: "k",
                  ctrlKey: true,
                  bubbles: true,
                });
                window.dispatchEvent(event);
              }}
              className="bg-black/30 hover:bg-black/40 border border-emerald-700/60 text-emerald-100 hover:text-white px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 transition"
              title="কমান্ড প্যালেট চালু করুন (Ctrl + K)"
            >
              <Search className="w-3 h-3 text-[#C59B27]" />
              <span>সার্চ</span>
              <kbd className="bg-emerald-950/80 px-1 py-0.2 rounded text-[10px] text-gray-300 border border-emerald-800">
                Ctrl K
              </kbd>
            </button>
            <Link href="/notices" className="text-emerald-100 hover:text-[#C59B27] transition">
              নোটিশ
            </Link>
            <Link href="/results" className="text-emerald-100 hover:text-[#C59B27] transition">
              ফলাফল
            </Link>
            <Link href="/gallery" className="text-emerald-100 hover:text-[#C59B27] transition">
              গ্যালারি
            </Link>
            <Link href="/downloads" className="text-emerald-100 hover:text-[#C59B27] transition">
              ডাউনলোড
            </Link>
            <Link href="/verify" className="text-emerald-100 hover:text-[#C59B27] transition">
              সনদ যাচাই
            </Link>
            <Link href="/contact" className="text-emerald-100 hover:text-[#C59B27] transition">
              যোগাযোগ
            </Link>
            <Link
              href="/portal"
              className="bg-[#158052] hover:bg-[#126b44] text-white px-2.5 py-1 rounded font-semibold transition shadow-sm"
            >
              ছাত্র পোর্টাল
            </Link>
            <Link
              href="/login"
              className="border border-[#C59B27] text-amber-300 hover:bg-[#C59B27] hover:text-[#0B1914] px-2.5 py-1 rounded font-semibold transition shadow-sm"
            >
              লগইন
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-md hover:bg-[#158052] transition text-emerald-100"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden mt-3 pt-3 border-t border-emerald-800 grid grid-cols-2 gap-2 pb-2 text-xs">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded hover:bg-[#158052] transition"
            >
              মূল পাতা (Home)
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded hover:bg-[#158052] transition"
            >
              মাদরাসার পরিচিতি
            </Link>
            <Link
              href="/academic"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded hover:bg-[#158052] transition"
            >
              শিক্ষা বিভাগসমূহ
            </Link>
            <Link
              href="/admission"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded hover:bg-[#158052] transition"
            >
              ভর্তি আবেদন
            </Link>
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded hover:bg-[#158052] flex items-center gap-2 transition"
            >
              <Search className="w-4 h-4 text-amber-300" />
              তথ্য ও নীতিমালা অনুসন্ধান
            </Link>
            <Link
              href="/notices"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded hover:bg-[#158052] transition"
            >
              নোটিশ ও সার্কুলার
            </Link>
            <Link
              href="/results"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded hover:bg-[#158052] transition"
            >
              রেজাল্ট ও মার্কশিট
            </Link>
            <Link
              href="/gallery"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded hover:bg-[#158052] transition"
            >
              ফটো গ্যালারি
            </Link>
            <Link
              href="/downloads"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded hover:bg-[#158052] transition"
            >
              ডাউনলোড কর্নার
            </Link>
            <Link
              href="/verify"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded hover:bg-[#158052] transition"
            >
              সনদপত্র যাচাই
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded hover:bg-[#158052] transition"
            >
              যোগাযোগ
            </Link>
            <Link
              href="/portal"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-[#158052] text-white py-2 px-3 rounded font-semibold text-center col-span-2"
            >
              শিক্ষার্থী ও অভিভাবক পোর্টাল (/portal)
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-[#C59B27] text-[#0B1914] py-2 px-3 rounded font-bold text-center col-span-2"
            >
              অফিসিয়াল লগইন (/login)
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
