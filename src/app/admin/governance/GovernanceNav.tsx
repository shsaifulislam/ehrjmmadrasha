"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface GovernanceNavProps {
  currentTab?: "dashboard" | "risks" | "controls" | "findings" | "actions" | "reviews" | "exceptions";
}

export default function GovernanceNav({ currentTab }: GovernanceNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/governance", labelBn: "ককপিট ড্যাশবোর্ড", labelEn: "Overview", tab: "dashboard" },
    { href: "/admin/governance/risks", labelBn: "ঝুঁকি রেজিস্টার", labelEn: "Risk Register", tab: "risks" },
    { href: "/admin/governance/controls", labelBn: "অভ্যন্তরীণ নিয়ন্ত্রণ", labelEn: "Controls & Tests", tab: "controls" },
    { href: "/admin/governance/findings", labelBn: "পর্যবেক্ষণ ও বিচ্যুতি", labelEn: "Findings", tab: "findings" },
    { href: "/admin/governance/actions", labelBn: "CAPA প্রতিকার ব্যবস্থা", labelEn: "Actions", tab: "actions" },
    { href: "/admin/governance/reviews", labelBn: "গভর্ন্যান্স রিভিউ", labelEn: "Reviews", tab: "reviews" },
    { href: "/admin/governance/exceptions", labelBn: "ব্যত্যয় ও ছাড়পত্র", labelEn: "Exceptions", tab: "exceptions" },
  ];

  return (
    <div className="space-y-4">
      {/* Top Identity Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Phase 42 Assurance
            </span>
            <span className="text-slate-500 text-xs font-mono">EHRJ-AI-2026-PHASE42</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            প্রাতিষ্ঠানিক ঝুঁকি ব্যবস্থাপনা, অভ্যন্তরীণ নিয়ন্ত্রণ ও সুশাসন নিশ্চয়তা ইঞ্জিন (Governance Assurance)
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/governance/risks/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/30 transition flex items-center gap-1.5"
          >
            <span>+</span> নতুন ঝুঁকি নথিভুক্ত করুন
          </Link>
          <a
            href="/api/admin/governance/reports?type=RISK_REGISTER"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
          >
            <span>📄</span> প্রাতিষ্ঠানিক রিপোর্ট
          </a>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin border-b border-slate-800/80">
        {navItems.map((item) => {
          const isActive =
            currentTab === item.tab ||
            pathname === item.href ||
            (item.tab === "risks" && pathname.startsWith("/admin/governance/risks")) ||
            (item.tab === "controls" && pathname.startsWith("/admin/governance/controls")) ||
            (item.tab === "findings" && pathname.startsWith("/admin/governance/findings")) ||
            (item.tab === "actions" && pathname.startsWith("/admin/governance/actions")) ||
            (item.tab === "reviews" && pathname.startsWith("/admin/governance/reviews")) ||
            (item.tab === "exceptions" && pathname.startsWith("/admin/governance/exceptions"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <span>{item.labelBn}</span>
              <span className="text-[10px] opacity-60 font-mono hidden sm:inline">({item.labelEn})</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
