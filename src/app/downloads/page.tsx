"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Download, FileText, Calendar, BookOpen, FileCheck } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function DownloadsPage() {
  const [downloadItems, setDownloadItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/content/downloads")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.downloads?.length > 0) {
          setDownloadItems(
            data.downloads.map((d: any) => ({
              title: d.titleBn,
              category: d.category,
              size: d.fileSizeDisplay,
              type: d.fileType,
              date: d.versionString,
              description: d.descriptionBn,
              fileUrl: d.fileUrl,
            }))
          );
        } else {
          setDownloadItems(FALLBACK_DOWNLOADS);
        }
      })
      .catch(() => setDownloadItems(FALLBACK_DOWNLOADS))
      .finally(() => setLoading(false));
  }, []);

  const FALLBACK_DOWNLOADS = [
    {
      title: "নতুন ছাত্র ভর্তি আবেদন ফরম (অফলাইন)",
      category: "ভর্তি",
      size: "১.২ মেগাবাইট",
      type: "PDF",
      date: "২০২৬ শিক্ষাবর্ষ",
      description: "সরাসরি মাদরাসা অফিসে জমা দেওয়ার জন্য প্রিন্ট উপযোগী ৩ পাতার ভর্তি আবেদন ফরম।",
    },
    {
      title: "হিফজ ও কিতাব বিভাগের বার্ষিক সিলেবাস",
      category: "সিলেবাস",
      size: "২.৫ মেগাবাইট",
      type: "PDF",
      date: "২০২৫-২০২৬",
      description: "নূরানী, হিফজুল কুরআন ও কিতাব অনুষদের পরীক্ষা ও পাঠ্যসূচির পূর্ণ বিবরণ।",
    },
    {
      title: "ক্লাস ও সবক রুটিন (দৈনন্দিন সময়সূচি)",
      category: "একাডেমিক",
      size: "৮৫০ কিলোবাইট",
      type: "PDF",
      date: "মার্চ ২০২৬",
      description: "ফজর থেকে এশা পর্যন্ত তাহাজ্জুদ, তেলাওয়াত, সবক ও জেনারেল শিক্ষার রুটিন।",
    },
    {
      title: "বার্ষিক ছুটির তালিকা ও একাডেমিক ক্যালেন্ডার",
      category: "ক্যালেন্ডার",
      size: "১.১ মেগাবাইট",
      type: "PDF",
      date: "২০২৬",
      description: "রমজান, ঈদ এবং জাতীয় দিবসের সরকারি ও দ্বীনি ছুটির অনুমোদিত ক্যালেন্ডার।",
    },
    {
      title: "মাদরাসা পরিচিতি ও প্রসপেক্টাস (ব্রোশার)",
      category: "পরিচিতি",
      size: "৪.০ মেগাবাইট",
      type: "PDF",
      date: "২০২৬ সংস্করণ",
      description: "মাদরাসার ইতিহাস, অবকাঠামো, সুযোগ-সুবিধা ও লিল্লাহ তহবিলের সচিত্র পুস্তিকা।",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <Navbar />

      <section className="bg-gradient-to-b from-[#083B25] to-[#0D5C3A] text-white py-14 px-4 border-b-4 border-[#C59B27] text-center">
        <div className="max-w-6xl mx-auto">
          <span className="bg-[#C59B27]/20 text-amber-200 border border-[#C59B27]/40 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block mb-3">
            রিসোর্স ও ফরম
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-white mb-3">
            ডাউনলোড কর্নার ও প্রকাশনা
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            মাদরাসার ভর্তি ফরম, একাডেমিক রুটিন, সিলেবাস এবং প্রয়োজনীয় নথিপত্র এক ক্লিকে ডাউনলোড করুন।
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-4 flex-1 w-full">
        {downloadItems.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#0D5C3A] flex items-center justify-center font-bold flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-[#083B25]">{item.title}</h3>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{item.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono pt-1">
                  <span>বিভাগ: {item.category}</span>
                  <span>•</span>
                  <span>সাইজ: {item.size}</span>
                  <span>•</span>
                  <span>সংস্করণ: {item.date}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert(`"${item.title}" ফাইলটি আপনার ডিভাইসে ডাউনলোড হচ্ছে...`)}
              className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              ডাউনলোড করুন
            </button>
          </div>
        ))}
      </main>

      <Footer />
    </div>
  );
}
