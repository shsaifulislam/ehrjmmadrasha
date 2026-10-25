"use client";

import React from "react";
import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";

interface NoticeItem {
  id: string;
  titleBn: string;
  category?: string;
}

interface NoticeTickerProps {
  notices: NoticeItem[];
}

export default function NoticeTicker({ notices }: NoticeTickerProps) {
  return (
    <section className="bg-white border-b border-slate-200 overflow-hidden shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        {/* Ticker Label Badge */}
        <div className="bg-[#B91C1C] text-white font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2 flex items-center gap-1.5 flex-shrink-0 shadow-xs z-10 font-serif-bn">
          <Bell className="w-3.5 h-3.5 text-amber-300" />
          <span>জরুরী নোটিশঃ</span>
        </div>

        {/* Marquee Content */}
        <div className="flex-1 overflow-hidden px-4 py-2 text-xs sm:text-sm text-slate-800 font-medium whitespace-nowrap">
          <div className="animate-marquee cursor-pointer inline-flex items-center">
            {notices.length === 0 ? (
              <span className="text-slate-500">এখন কোনো জরুরি নোটিশ নেই।</span>
            ) : notices.map((notice, idx) => (
              <span key={notice.id || idx} className="inline-flex items-center mr-8">
                <Link
                  href={`/notices/${notice.id}`}
                  className="hover:text-[#0D5C3A] transition underline-offset-4 hover:underline"
                >
                  📢 {notice.titleBn}
                </Link>
                <span className="mx-3 text-[#B91C1C] font-bold">॥</span>
              </span>
            ))}
          </div>
        </div>

        {/* View All Notices Link */}
        <Link
          href="/notices"
          className="hidden sm:flex items-center gap-1 text-[11px] sm:text-xs text-[#0D5C3A] hover:text-emerald-900 font-semibold flex-shrink-0 px-3 py-2 transition font-serif-bn border-l border-slate-200"
        >
          <span>সকল নোটিশ</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
