"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ComplianceNavProps {
  currentTab?:
    | "dashboard"
    | "requirements"
    | "obligations"
    | "evidence"
    | "reviews"
    | "exceptions"
    | "remediation"
    | "reports";
}

export default function ComplianceNav({ currentTab }: ComplianceNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/compliance", labelBn: "ককপিট ড্যাশবোর্ড", labelEn: "Overview", tab: "dashboard" },
    { href: "/admin/compliance/requirements", labelBn: "প্রয়োজনীয়তা রেজিস্টার", labelEn: "Requirements", tab: "requirements" },
    { href: "/admin/compliance/obligations", labelBn: "দায় ও অঙ্গীকার কিউ", labelEn: "Obligations", tab: "obligations" },
    { href: "/admin/compliance/evidence", labelBn: "প্রমাণপত্র ও যাচাই", labelEn: "Evidence", tab: "evidence" },
    { href: "/admin/compliance/reviews", labelBn: "কমপ্লায়েন্স পর্যালোচনা", labelEn: "Reviews", tab: "reviews" },
    { href: "/admin/compliance/exceptions", labelBn: "ব্যতিক্রম ও রেয়াত", labelEn: "Exceptions", tab: "exceptions" },
    { href: "/admin/compliance/remediation", labelBn: "ঘাটতি প্রতিকার (CAPA)", labelEn: "Remediation", tab: "remediation" },
    { href: "/admin/compliance/reports", labelBn: "প্রাতিষ্ঠানিক প্রতিবেদন", labelEn: "Reports", tab: "reports" },
  ];

  return (
    <div className="space-y-4">
      {/* Top Identity Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Phase 43 Compliance
            </span>
            <span className="text-slate-500 text-xs font-mono">EHRJ-AI-2026-PHASE43</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            প্রাতিষ্ঠানিক কমপ্লায়েন্স বাধ্যবাধকতা, শর্তাবলী ট্র্যাকিং ও নিশ্চয়তা ইঞ্জিন (Compliance Assurance)
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/compliance/requirements/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/30 transition flex items-center gap-1.5"
          >
            <span>+</span> নতুন বাধ্যবাধকতা যুক্ত করুন
          </Link>
          <Link
            href="/admin/compliance/reports"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
          >
            <span>📄</span> ১২টি প্রাতিষ্ঠানিক রিপোর্ট
          </Link>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800/80 scrollbar-thin">
        {navItems.map((item) => {
          const isActive = currentTab ? currentTab === item.tab : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <span>{item.labelBn}</span>
              <span className="text-[10px] opacity-60 font-mono hidden sm:inline">
                ({item.labelEn})
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
