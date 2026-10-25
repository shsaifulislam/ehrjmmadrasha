"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeaderBanner from "@/components/PageHeaderBanner";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Search,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Pin,
  Clock,
  Download,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<any[]>([]);
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notices")
      .then((res) => res.json())
      .then((data) => {
        if (data.notices) {
          setNotices(data.notices);
          setFilteredNotices(data.notices);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = notices;
    if (category !== "ALL") {
      result = result.filter((n) => n.category === category);
    }
    if (search.trim()) {
      result = result.filter(
        (n) =>
          n.titleBn?.toLowerCase().includes(search.toLowerCase()) ||
          n.contentBn?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredNotices(result);
  }, [category, search, notices]);

  const categoryLabels: Record<string, string> = {
    ALL: "সকল নোটিশ",
    GENERAL: "সাধারণ",
    EXAM: "পরীক্ষা সংক্রান্ত",
    ADMISSION: "ভর্তি বিজ্ঞপ্তি",
    HOLIDAY: "ছুটির তালিকা",
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      {/* 1. OFFICIAL PAGE HEADER BANNER WITH BREADCRUMB */}
      <PageHeaderBanner
        title="অফিসিয়াল নোটিশ বোর্ড ও সার্কুলার"
        subtitle="মাদরাসার ছুটির তালিকা, পরীক্ষা সূচি, ভর্তি বিজ্ঞপ্তি এবং প্রশাসনিক নির্দেশনা সার্বক্ষণিক হালনাগাদ করা হয়"
        badge="সর্বশেষ প্রাতিষ্ঠানিক প্রজ্ঞাপন"
        breadcrumbs={[{ label: "নোটিশ বোর্ড" }]}
      />

      {/* 2. MAIN NOTICES SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1 w-full">
        {/* 2.0 OFFICIAL PANORAMIC NOTICE BOARD BANNER */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-emerald-600/30 shadow-lg bg-emerald-950">
          <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full">
            <Image
              src="/images/banners/official-notice-banner.png"
              alt="নোটিশ - সকল গুরুত্বপূর্ণ তথ্য ও ঘোষণা | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {Object.entries(categoryLabels).map(([catId, label]) => (
              <button
                key={catId}
                onClick={() => setCategory(catId)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  category === catId
                    ? "bg-[#0D5C3A] text-white shadow-md shadow-emerald-950/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="শিরোনাম বা বিষয়বস্তু দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-slate-50/50"
            />
          </div>
        </div>

        {/* Notices Feed */}
        {loading ? (
          <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-2 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            নোটিশ লোড হচ্ছে...
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-600 font-bold">এই ক্যাটাগরিতে কোনো নোটিশ পাওয়া যায়নি।</p>
            <p className="text-xs text-slate-400">অনুগ্রহ করে অন্য কোনো ফিল্টার বা অনুসন্ধান শব্দ ব্যবহার করুন।</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured Official Admission Poster Notice Card */}
            {(category === "ALL" || category === "ADMISSION") && !search && (
              <div className="bg-gradient-to-r from-emerald-950 via-[#0D5C3A] to-emerald-900 rounded-3xl p-6 sm:p-7 border-2 border-[#D4AF37] shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-[#D4AF37] shadow-lg flex-shrink-0 bg-slate-900">
                    <Image
                      src="/images/banners/admission-notice-poster.jpg"
                      alt="ভর্তি চলছে ব্যানার পোস্টার - ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full font-serif-bn">
                      <Pin className="w-3 h-3" />
                      <span>জরুরী সার্কুলার • ভর্তি চলছে ২০২৬</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-serif-bn text-white">
                      নূরানী, নাজেরা, হিফজ ও কিতাব বিভাগে নতুন ভর্তি বিজ্ঞপ্তি
                    </h3>
                    <p className="text-xs text-emerald-100 max-w-xl font-sans leading-relaxed">
                      অভিজ্ঞ ও নিষ্ঠাবান ওস্তাদদের তত্ত্বাবধানে দ্বীনি ও আদর্শ শিক্ষার সুশৃঙ্খল পরিবেশ। সীমিত আসনে দ্রুত আবেদন সম্পন্ন করুন।
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-2.5 flex-shrink-0 w-full sm:w-auto">
                  <Link
                    href="/admission"
                    className="btn-gold px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow w-full text-center"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ভর্তি নির্দেশিকা</span>
                  </Link>
                  <Link
                    href="/images/banners/admission-notice-poster.jpg"
                    target="_blank"
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition w-full text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ব্যানার দেখুন</span>
                  </Link>
                </div>
              </div>
            )}

            {filteredNotices.map((n) => {
              const pDate = new Date(n.publishDate || n.createdAt || Date.now());
              const dayStr = pDate.toLocaleDateString("bn-BD", { day: "numeric" });
              const monthStr = pDate.toLocaleDateString("bn-BD", { month: "short" });
              const yearStr = pDate.toLocaleDateString("bn-BD", { year: "numeric" });

              return (
                <div
                  key={n.id}
                  className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group ${
                    n.isUrgent
                      ? "border-l-8 border-l-red-600 border-slate-200"
                      : "border-slate-200 hover:border-emerald-500/50"
                  }`}
                >
                  {/* Left: Date Badge & Title Content */}
                  <div className="flex items-start gap-4 sm:gap-5 flex-1">
                    {/* University Date Stamp Badge */}
                    <div className="w-16 h-18 rounded-2xl bg-gradient-to-b from-[#063321] to-[#0D5C3A] text-white flex-shrink-0 flex flex-col items-center justify-center p-2 text-center shadow-md border border-[#D4AF37]/50">
                      <span className="font-mono text-xl font-black leading-none text-[#FDF6E2]">
                        {dayStr}
                      </span>
                      <span className="text-[11px] font-bold text-amber-300 mt-1">
                        {monthStr}
                      </span>
                      <span className="text-[9px] text-emerald-200/80 font-mono">
                        {yearStr}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {n.isUrgent && (
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                            জরুরি বিজ্ঞপ্তি
                          </span>
                        )}
                        <span className="bg-emerald-50 text-[#0D5C3A] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {categoryLabels[n.category] || n.category}
                        </span>
                        {n.attachmentUrl && (
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                            <Download className="w-2.5 h-2.5" />
                            সংযুক্ত ফাইল
                          </span>
                        )}
                      </div>

                      <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 group-hover:text-[#0D5C3A] transition">
                        {n.titleBn}
                      </h2>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {n.contentBn}
                      </p>
                    </div>
                  </div>

                  {/* Right: CTA Link */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <Link
                      href={`/notices/${n.id}`}
                      className="px-4 py-2 rounded-xl bg-slate-100 group-hover:bg-[#0D5C3A] text-slate-700 group-hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <span>বিস্তারিত দেখুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
