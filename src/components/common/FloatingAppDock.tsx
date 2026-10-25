"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Smartphone,
  X,
  Sparkles,
  DollarSign,
  Award,
  GraduationCap,
  Calendar,
  Users,
  Search,
  ExternalLink,
  CheckCircle2,
  ChevronUp,
} from "lucide-react";

export default function FloatingAppDock() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<string>("PUBLIC");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user?.role) {
          setActiveRole(data.user.role);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Don't show redundant dock if already on the /app page
  if (pathname === "/app") return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end">
      {/* Expanded Quick Action Sheet */}
      {isOpen && (
        <div className="mb-3 w-72 sm:w-80 bg-white/95 backdrop-blur-xl border border-emerald-900/15 rounded-3xl shadow-2xl p-4 text-gray-800 space-y-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-extrabold text-emerald-950 font-bangla">
                ওয়েব অ্যাপ কুইক লঞ্চার
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs transition"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/app"
              onClick={() => setIsOpen(false)}
              className="col-span-2 bg-gradient-to-r from-[#041F14] to-[#0D5C3A] text-white p-3 rounded-2xl flex items-center justify-between shadow hover:opacity-95 transition"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-[#D4AF37]" />
                <div className="text-left">
                  <span className="font-bold block text-sm">সম্পূর্ণ ওয়েব অ্যাপ</span>
                  <span className="text-[10px] text-emerald-200">সকল ফিচার এক স্ক্রিনে</span>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </Link>

            <Link
              href="/app"
              onClick={() => setIsOpen(false)}
              className="p-2.5 rounded-xl border border-gray-100 hover:bg-emerald-50 hover:border-emerald-200 transition flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4 text-emerald-700" />
              <span className="font-medium text-gray-900">ফি ও রসিদ</span>
            </Link>

            <Link
              href="/results"
              onClick={() => setIsOpen(false)}
              className="p-2.5 rounded-xl border border-gray-100 hover:bg-amber-50 hover:border-amber-200 transition flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-amber-700" />
              <span className="font-medium text-gray-900">ফলাফল যাচাই</span>
            </Link>

            <Link
              href="/admission"
              onClick={() => setIsOpen(false)}
              className="p-2.5 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-blue-700" />
              <span className="font-medium text-gray-900">ভর্তি আবেদন</span>
            </Link>

            <Link
              href="/verify"
              onClick={() => setIsOpen(false)}
              className="p-2.5 rounded-xl border border-gray-100 hover:bg-purple-50 hover:border-purple-200 transition flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-purple-700" />
              <span className="font-medium text-gray-900">কেন্দ্রীয় যাচাই</span>
            </Link>
          </div>

          {/* Quick Role Portal Shortcuts */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-500">পোর্টাল লগইন:</span>
            <div className="flex gap-2 font-bold">
              <Link href="/admin" onClick={() => setIsOpen(false)} className="text-emerald-800 hover:underline">
                এডমিন
              </Link>
              <span>•</span>
              <Link href="/teacher" onClick={() => setIsOpen(false)} className="text-blue-800 hover:underline">
                শিক্ষক
              </Link>
              <span>•</span>
              <Link href="/portal" onClick={() => setIsOpen(false)} className="text-amber-800 hover:underline">
                অভিভাবক
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Glowing Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#041F14] via-[#0D5C3A] to-[#041F14] text-white px-4 py-3 rounded-full shadow-2xl border-2 border-[#D4AF37] hover:scale-105 active:scale-95 transition-all duration-300"
        title="ওয়েব অ্যাপ লঞ্চার"
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#D4AF37]"></span>
        </span>

        <Smartphone className="w-5 h-5 text-[#D4AF37] animate-bounce" />
        <span className="text-xs font-extrabold tracking-tight font-bangla hidden sm:inline">
          {isOpen ? "বন্ধ করুন" : "📱 ওয়েব অ্যাপ (App Mode)"}
        </span>
      </button>
    </div>
  );
}
