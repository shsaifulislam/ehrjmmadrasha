"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, GraduationCap, DollarSign, Award, Calendar, LogOut, ArrowRight, HeartHandshake, CheckCircle } from "lucide-react";

interface ChildData {
  id: string;
  name: string;
  studentId: string;
  jamat: string;
  roll: number;
  residentialStatus: string;
  attendanceRate: string;
  dueAmount: number;
}

export default function GuardianPortalPage() {
  const [childrenList] = useState<ChildData[]>([
    {
      id: "child-1",
      name: "মুহাম্মদ আব্দুল্লাহ আল মামুন",
      studentId: "EHRJ-000012",
      jamat: "নাহবেমীর জামাত",
      roll: 5,
      residentialStatus: "অনাবাসিক (Non-Residential)",
      attendanceRate: "৯৬%",
      dueAmount: 800,
    },
    {
      id: "child-2",
      name: "মুহাম্মদ আব্দুর রহমান",
      studentId: "EHRJ-000045",
      jamat: "তাহফীজুল কুরআন (হিফজ)",
      roll: 12,
      residentialStatus: "আবাসিক (Residential)",
      attendanceRate: "৯৮%",
      dueAmount: 0,
    },
  ]);

  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const currentChild = childrenList[selectedChildIndex];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col text-[#0B1914]">
      {/* Header */}
      <header className="bg-[#083B25] text-white px-6 py-4 border-b-2 border-[#C59B27] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C59B27] text-[#083B25] font-arabic font-bold flex items-center justify-center text-sm shadow">
            ولي
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg font-display leading-tight">
              অভিভাবক পোর্টাল (Guardian Portal)
            </h1>
            <p className="text-xs text-emerald-200">
              সন্তানের হাজিরা, ফি ও ফলাফল ডেক্স — ইলিয়টগঞ্জ হাজী রহমত উল্লাহ জামিয়া মাদ্রাসা
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-emerald-200 hover:text-white px-2 py-1 rounded transition hidden sm:inline"
          >
            মূল সাইট
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            লগআউট
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Child Switcher (Phase 8 Multi-child requirement) */}
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-gray-700">সন্তান পরিবর্তন করুন (Child Switcher):</span>
          <div className="flex items-center gap-2">
            {childrenList.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => setSelectedChildIndex(idx)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                  selectedChildIndex === idx
                    ? "bg-[#0D5C3A] text-white shadow"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {c.name} ({c.jamat})
              </button>
            ))}
          </div>
        </div>

        {/* Selected Child Summary Card */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 mb-6 gap-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#E7F3EC] border-2 border-[#0D5C3A] flex items-center justify-center font-bold text-lg text-[#0D5C3A]">
                {currentChild.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">{currentChild.name}</h2>
                <p className="text-xs text-gray-500 font-mono">
                  আইডি: <span className="text-[#0D5C3A] font-bold">{currentChild.studentId}</span> | জামাত: {currentChild.jamat} (রোল: {currentChild.roll})
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{currentChild.residentialStatus}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded">
                উপস্থিতির হার: {currentChild.attendanceRate}
              </span>
            </div>
          </div>

          {/* Quick Metrics for Child */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1">বকেয়া বেতন / ফি</span>
              <span className="text-lg font-bold font-mono text-red-600">
                {currentChild.dueAmount > 0 ? `৳ ${currentChild.dueAmount}` : "পরিশোধিত (No Due)"}
              </span>
              {currentChild.dueAmount > 0 && (
                <p className="text-[11px] text-gray-400 mt-1">বিকাশ/নগদ বা অফিসে পরিশোধ করুন</p>
              )}
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1">সর্বশেষ পরীক্ষার রেজাল্ট</span>
              <span className="text-sm font-bold text-[#0D5C3A] block">
                মুমতাজ (Mumtaz - A+)
              </span>
              <p className="text-[11px] text-gray-400 mt-1">১ম সাময়িক মূল্যায়ন ২০২৬</p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1">হিফজ / দরস প্রগ্রেস</span>
              <span className="text-sm font-bold text-gray-800 block">
                নিয়মিত ও সন্তোষজনক
              </span>
              <p className="text-[11px] text-gray-400 mt-1">সবক ও সবকী নিয়মিত আদায় হচ্ছে</p>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100 text-xs">
            <button
              onClick={() => alert("ছুটির আবেদন ফরম শীঘ্রই সক্রিয় হবে।")}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold transition"
            >
              ছুটির আবেদন করুন
            </button>
            <button
              onClick={() => alert("আর্থিক সহায়তা আবেদন বিবেচনা সাপেক্ষে অ্যাডমিন দ্বারা নিরীক্ষণ করা হবে।")}
              className="px-4 py-2 rounded border border-[#C59B27] text-amber-900 bg-amber-50 hover:bg-amber-100 font-semibold transition flex items-center gap-1.5"
            >
              <HeartHandshake className="w-4 h-4 text-[#C59B27]" />
              আর্থিক সহায়তা (Waiver) আবেদন
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
