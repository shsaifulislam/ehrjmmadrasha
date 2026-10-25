"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeaderBanner from "@/components/PageHeaderBanner";
import Image from "next/image";
import { Camera, Image as ImageIcon, Sparkles, X, Maximize2, Tag, ArrowRight } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [photos, setPhotos] = useState<any[]>([]);
  const [activeLightbox, setActiveLightbox] = useState<any | null>(null);

  const FALLBACK_PHOTOS = [
    {
      src: "/images/campus-entrance.jpg",
      title: "মাদরাসা প্রবেশদ্বার ও সাইনবোর্ড সংলগ্ন পথ",
      category: "CAMPUS",
      categoryBn: "ক্যাম্পাস",
      description: "হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার মূল প্রবেশদ্বার ও পৃথক বালক-বালিকা শাখা সংলগ্ন রাস্তা।",
    },
    {
      src: "/images/students-class.jpg",
      title: "নূরানী ও নাযেরা বিভাগের শ্রেণিকক্ষ",
      category: "CLASSROOM",
      categoryBn: "শ্রেণিকক্ষ",
      description: "শৃঙ্খলাবদ্ধ পোশাকে ডিজিটাল আইডি কার্ড পরিহিত কোমলমতি শিক্ষার্থীরা ক্লাসে গভীর মনোযোগে পাঠগ্রহণ করছে।",
    },
    {
      src: "/images/students-celebration.jpg",
      title: "জাতীয় ও দ্বীনি দিবসের বিশেষ সমাবেশ",
      category: "EVENTS",
      categoryBn: "অনুষ্ঠান",
      description: "জাতীয় পতাকা ও কুরআনের বাগানে আপনাকে স্বাগতম ব্যানারের সামনে মাদরাসা প্রাঙ্গণে আনন্দঘন ছাত্র সমাবেশ।",
    },
    {
      src: "/images/student-banner.jpg",
      title: "মাদরাসা ক্যাম্পাস ও সুসজ্জিত শিক্ষার্থী",
      category: "CAMPUS",
      categoryBn: "ক্যাম্পাস",
      description: "মাদরাসার অফিসিয়াল ব্যানার ও লোগোর সামনে সুশৃঙ্খল শিক্ষার্থী।",
    },
    {
      src: "/images/principal.jpg",
      title: "প্রতিষ্ঠাতা মুহতামিম ও পরিচালক",
      category: "ADMIN",
      categoryBn: "প্রশাসন",
      description: "মুহতামিম মাওলানা মহা. আবুল কালাম সরকার (হাফিজাহুল্লাহ)।",
    },
    {
      src: "/images/logo.jpg",
      title: "মাদরাসার প্রাতিষ্ঠানিক সিল ও মনোগ্রাম",
      category: "ADMIN",
      categoryBn: "মনোগ্রাম",
      description: "স্থাপিত ২০২১ইং সম্বলিত কুরআনুল কারীমের বাণী ধারণকৃত অফিসিয়াল মনোগ্রাম।",
    },
  ];

  useEffect(() => {
    fetch("/api/public/content/gallery")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.items?.length > 0) {
          const apiPhotos = data.items.map((item: any) => ({
            src: item.imageUrl,
            title: item.titleBn,
            category: item.category,
            categoryBn: item.category === "CAMPUS" ? "ক্যাম্পাস" : item.category === "CLASSROOM" ? "শ্রেণিকক্ষ" : "অনুষ্ঠান",
            description: item.descriptionBn || item.altText,
          }));
          setPhotos([FALLBACK_PHOTOS[0], ...apiPhotos]);
        } else {
          setPhotos(FALLBACK_PHOTOS);
        }
      })
      .catch(() => setPhotos(FALLBACK_PHOTOS));
  }, []);

  const filteredPhotos =
    activeCategory === "ALL"
      ? photos
      : photos.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      {/* 1. OFFICIAL PAGE HEADER BANNER WITH BREADCRUMB */}
      <PageHeaderBanner
        title="ক্যাম্পাস ফটো গ্যালারি ও স্থিরচিত্র"
        subtitle={`${INSTITUTION_INFO.nameBn}-এর প্রাত্যহিক পাঠদান, জাতীয় ও ইসলামি অনুষ্ঠান, হিফজ সমাপন এবং ক্যাম্পাসের জীবন্ত মুহূর্ত`}
        badge="অফিসিয়াল ফটো অ্যালবাম • স্থাপিত ২০২১"
        breadcrumbs={[{ label: "ফটো গ্যালারি" }]}
      />

      {/* 2. MAIN GALLERY SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 flex-1 w-full">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {[
            { id: "ALL", label: "সকল ছবি" },
            { id: "CAMPUS", label: "ক্যাম্পাস ও প্রবেশদ্বার" },
            { id: "CLASSROOM", label: "শ্রেণিকক্ষ ও পাঠদান" },
            { id: "EVENTS", label: "অনুষ্ঠান ও সমাবেশ" },
            { id: "ADMIN", label: "প্রশাসন ও মনোগ্রাম" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? "bg-[#0D5C3A] text-white shadow-md shadow-emerald-950/20"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo, idx) => (
            <div
              key={idx}
              onClick={() => setActiveLightbox(photo)}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                <Image
                  src={photo.src}
                  alt={photo.title}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition duration-300" />
                
                <span className="absolute top-3 left-3 text-[10px] font-bold text-amber-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#D4AF37]" />
                  <span>{photo.categoryBn || photo.category}</span>
                </span>

                <span className="absolute bottom-3 right-3 text-white bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/20 opacity-0 group-hover:opacity-100 transition duration-300">
                  <Maximize2 className="w-4 h-4 text-amber-300" />
                </span>
              </div>

              <div className="p-5 space-y-1.5 bg-white">
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#0D5C3A] transition">
                  {photo.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {photo.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 3. LIGHTBOX MODAL */}
      {activeLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveLightbox(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveLightbox(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-black transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black">
              <Image
                src={activeLightbox.src}
                alt={activeLightbox.title}
                fill
                className="object-contain"
              />
            </div>

            <div className="p-6 bg-slate-900/95 border-t border-white/10 text-white space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                  {activeLightbox.categoryBn || activeLightbox.category}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {activeLightbox.title}
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeLightbox.description}
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
