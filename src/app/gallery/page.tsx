"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { Camera, Image as ImageIcon } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [photos, setPhotos] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/public/content/gallery")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.items?.length > 0) {
          setPhotos(
            data.items.map((item: any) => ({
              src: item.imageUrl,
              title: item.titleBn,
              category: item.category,
              description: item.descriptionBn || item.altText,
            }))
          );
        } else {
          setPhotos(FALLBACK_PHOTOS);
        }
      })
      .catch(() => setPhotos(FALLBACK_PHOTOS));
  }, []);

  const FALLBACK_PHOTOS = [
    {
      src: "/images/students-class.jpg",
      title: "নূরানী ও নাযেরা বিভাগের শ্রেণিকক্ষ",
      category: "CLASSROOM",
      description: "শৃঙ্খলাবদ্ধ পোশাকে আইডি কার্ড পরিহিত কোমলমতি শিক্ষার্থীরা ক্লাসে পাঠগ্রহণ করছে।",
    },
    {
      src: "/images/students-celebration.jpg",
      title: "জাতীয় ও দ্বীনি দিবসের বিশেষ সমাবেশ",
      category: "EVENTS",
      description: "জাতীয় পতাকা হাতে মাদরাসা প্রাঙ্গণে আনন্দঘন পরিবেশে ছাত্রদের সমাবেশ।",
    },
    {
      src: "/images/student-banner.jpg",
      title: "মাদরাসা ক্যাম্পাস ও সুসজ্জিত শিক্ষার্থী",
      category: "CAMPUS",
      description: "মাদরাসার অফিসিয়াল ব্যানার ও লোগোর সামনে সুশৃঙ্খল শিক্ষার্থী।",
    },
    {
      src: "/images/principal.jpg",
      title: "প্রতিষ্ঠাতা মুহতামিম ও পরিচালক",
      category: "ADMIN",
      description: "মুহতামিম মাওলানা মহা. আবুল কালাম সরকার (হাফিজাহুল্লাহ)।",
    },
    {
      src: "/images/logo.jpg",
      title: "মাদরাসার প্রাতিষ্ঠানিক সিল ও মনোগ্রাম",
      category: "ADMIN",
      description: "স্থাপিত ২০২১ইং সম্বলিত কুরআনুল কারীমের বাণী ধারণকৃত অফিসিয়াল সিল।",
    },
  ];

  const filteredPhotos =
    activeCategory === "ALL" ? photos : photos.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <Navbar />

      <section className="bg-gradient-to-b from-[#083B25] to-[#0D5C3A] text-white py-14 px-4 border-b-4 border-[#C59B27] text-center">
        <div className="max-w-6xl mx-auto">
          <span className="bg-[#C59B27]/20 text-amber-200 border border-[#C59B27]/40 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block mb-3">
            ছবি ও মুহূর্ত
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-white mb-3">
            মাদরাসা ক্যাম্পাস ফটো গ্যালারি
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            {INSTITUTION_INFO.nameBn}-এর পাঠদান, অনুষ্ঠান ও দৈনন্দিন জীবনের জীবন্ত স্থিরচিত্র।
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-8 flex-1 w-full">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "ALL", label: "সকল ছবি" },
            { id: "CLASSROOM", label: "শ্রেণিকক্ষ ও পাঠদান" },
            { id: "EVENTS", label: "অনুষ্ঠান ও সমাবেশ" },
            { id: "CAMPUS", label: "ক্যাম্পাস প্রাঙ্গণ" },
            { id: "ADMIN", label: "প্রশাসন ও মনোগ্রাম" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                activeCategory === cat.id
                  ? "bg-[#0D5C3A] text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition group"
            >
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                <Image
                  src={photo.src}
                  alt={photo.title}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-bold text-sm text-[#083B25]">{photo.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{photo.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
