"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeaderBanner from "@/components/PageHeaderBanner";
import Link from "next/link";
import {
  Download,
  FileText,
  Calendar,
  BookOpen,
  FileCheck,
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function DownloadsPage() {
  const [downloadItems, setDownloadItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const FALLBACK_DOWNLOADS = [
    {
      title: "নতুন ছাত্র ভর্তি আবেদন ফরম (অফলাইন কপি)",
      category: "ভর্তি",
      size: "১.২ মেগাবাইট",
      type: "PDF",
      date: "২০২৬ শিক্ষাবর্ষ",
      description: "মাদরাসা অফিসে সরাসরি জমা দেওয়ার জন্য প্রিন্ট উপযোগী অফিসিয়াল ভর্তি আবেদন ফরম।",
      fileUrl: "/downloads/admission_form_2026.pdf",
    },
    {
      title: "হিফজুল কুরআন ও কিতাব বিভাগের বার্ষিক সিলেবাস",
      category: "সিলেবাস",
      size: "২.৫ মেগাবাইট",
      type: "PDF",
      date: "২০২৫-২০২৬",
      description: "নূরানী, হিফজুল কুরআন ও কিতাব অনুষদের পরীক্ষা ও পাঠ্যসূচির পূর্ণ বিবরণ ও বিষয় বিন্যাস।",
      fileUrl: "/downloads/syllabus_2025_2026.pdf",
    },
    {
      title: "দৈনন্দিন ক্লাস ও সবক রুটিন (পূর্ণ সময়সূচি)",
      category: "রুটিন",
      size: "৮৫০ কিলোবাইট",
      type: "PDF",
      date: "২০২৬ শিক্ষাবর্ষ",
      description: "ফজর থেকে এশা পর্যন্ত তাহাজ্জুদ, তেলাওয়াত, সবক ও সাধারণ পাঠদানের সুশৃঙ্খল রুটিন।",
      fileUrl: "/downloads/daily_routine_2026.pdf",
    },
    {
      title: "বার্ষিক ছুটির তালিকা ও প্রাতিষ্ঠানিক ক্যালেন্ডার",
      category: "ক্যালেন্ডার",
      size: "১.১ মেগাবাইট",
      type: "PDF",
      date: "২০২৬",
      description: "রমজান, দুই ঈদ এবং জাতীয় দিবস সমূহের সরকারি ও দ্বীনি ছুটির অনুমোদিত ক্যালেন্ডার।",
      fileUrl: "/downloads/academic_calendar_2026.pdf",
    },
    {
      title: "মাদরাসা পরিচিতি ও প্রসপেক্টাস (ব্রোশার)",
      category: "পরিচিতি",
      size: "৪.০ মেগাবাইট",
      type: "PDF",
      date: "২০২৬ সংস্করণ",
      description: "মাদরাসার ইতিহাস, অবকাঠামো, সুযোগ-সুবিধা ও লিল্লাহ তহবিলের সচিত্র তথ্যাবলি।",
      fileUrl: "/downloads/prospectus_2026.pdf",
    },
  ];

  useEffect(() => {
    fetch("/api/public/content/downloads")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.downloads?.length > 0) {
          const apiItems = data.downloads.map((d: any) => ({
            title: d.titleBn,
            category: d.category,
            size: d.fileSizeDisplay,
            type: d.fileType,
            date: d.versionString,
            description: d.descriptionBn,
            fileUrl: d.fileUrl,
          }));
          setDownloadItems(apiItems);
          setFilteredItems(apiItems);
        } else {
          setDownloadItems(FALLBACK_DOWNLOADS);
          setFilteredItems(FALLBACK_DOWNLOADS);
        }
      })
      .catch(() => {
        setDownloadItems(FALLBACK_DOWNLOADS);
        setFilteredItems(FALLBACK_DOWNLOADS);
      });
  }, []);

  useEffect(() => {
    let result = downloadItems;
    if (activeCategory !== "ALL") {
      result = result.filter((item) => item.category === activeCategory);
    }
    if (searchQuery.trim()) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredItems(result);
  }, [activeCategory, searchQuery, downloadItems]);

  const handleDownload = (item: any) => {
    setDownloadToast(`"${item.title}" ফাইলটি ডাউনলোড হচ্ছে...`);
    setTimeout(() => setDownloadToast(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      {/* 1. OFFICIAL PAGE HEADER BANNER WITH BREADCRUMB */}
      <PageHeaderBanner
        title="ডাউনলোড কর্নার ও প্রাতিষ্ঠানিক প্রকাশনা"
        subtitle="মাদরাসার অফলাইন ভর্তি ফরম, একাডেমিক রুটিন, সিলেবাস এবং প্রয়োজনীয় নথিপত্র এক ক্লিকে ডাউনলোড করুন"
        badge="অফিসিয়াল রিসোর্স ও পাবলিকেশন কর্নার"
        breadcrumbs={[{ label: "ডাউনলোড কর্নার" }]}
      />

      {/* 2. MAIN SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1 w-full">
        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {[
              { id: "ALL", label: "সকল ফাইল" },
              { id: "ভর্তি", label: "ভর্তি ফরম" },
              { id: "সিলেবাস", label: "সিলেবাস" },
              { id: "রুটিন", label: "ক্লাস রুটিন" },
              { id: "ক্যালেন্ডার", label: "ছুটির তালিকা" },
              { id: "পরিচিতি", label: "প্রসপেক্টাস" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeCategory === cat.id
                    ? "bg-[#0D5C3A] text-white shadow-md shadow-emerald-950/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ফাইলের নাম লিখে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-slate-50/50"
            />
          </div>
        </div>

        {/* Download Toast Notification */}
        {downloadToast && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{downloadToast}</span>
          </div>
        )}

        {/* Download Items List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-2 text-xs text-slate-500">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">কোনো ফাইল পাওয়া যায়নি।</p>
              <p className="text-slate-400">অনুগ্রহ করে অন্য কোনো ক্যাটাগরি বা অনুসন্ধানী শব্দ দিয়ে চেষ্টা করুন।</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-5 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-[#0D5C3A] group-hover:text-white transition duration-300 shadow-inner">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-[#0D5C3A] transition">
                        {item.title}
                      </h3>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-amber-300">
                        {item.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-0.5">
                      <span className="text-[#0D5C3A] font-bold">বিভাগ: {item.category}</span>
                      <span>•</span>
                      <span>সাইজ: {item.size}</span>
                      <span>•</span>
                      <span>সংস্করণ: {item.date}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={item.fileUrl || "/downloads/prospectus_2026.pdf"}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleDownload(item)}
                  className="btn-gold px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>ডাউনলোড করুন</span>
                </a>
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
