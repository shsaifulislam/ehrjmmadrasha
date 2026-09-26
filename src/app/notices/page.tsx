"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, Calendar, Search, AlertCircle, ArrowRight } from "lucide-react";
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
          n.titleBn.toLowerCase().includes(search.toLowerCase()) ||
          n.contentBn.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredNotices(result);
  }, [category, search, notices]);

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <Navbar />

      <section className="bg-gradient-to-b from-[#083B25] to-[#0D5C3A] text-white py-14 px-4 border-b-4 border-[#C59B27] text-center">
        <div className="max-w-6xl mx-auto">
          <span className="bg-[#C59B27]/20 text-amber-200 border border-[#C59B27]/40 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block mb-3">
            সার্কুলার ও বিজ্ঞপ্তি
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-white mb-3">
            নোটিশ বোর্ড ও জরুরি ঘোষণা
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            মাদরাসার ছুটির তালিকা, পরীক্ষার সময়সূচি, ভর্তি ও প্রাতিষ্ঠানিক নির্দেশনাবলি।
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-6 flex-1 w-full">
        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {["ALL", "GENERAL", "EXAM", "ADMISSION", "HOLIDAY"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  category === cat
                    ? "bg-[#0D5C3A] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat === "ALL" && "সকল নোটিশ"}
                {cat === "GENERAL" && "সাধারণ"}
                {cat === "EXAM" && "পরীক্ষা"}
                {cat === "ADMISSION" && "ভর্তি"}
                {cat === "HOLIDAY" && "ছুটি"}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নোটিশ খুঁজুন..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
            />
          </div>
        </div>

        {/* Notices Feed */}
        {loading ? (
          <p className="text-center text-xs text-gray-500 py-16">নোটিশ লোড হচ্ছে...</p>
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">কোনো নোটিশ পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotices.map((n) => (
              <div
                key={n.id}
                className={`bg-white rounded-xl border p-5 shadow-sm transition hover:shadow-md ${
                  n.isUrgent ? "border-l-4 border-l-red-600 border-gray-200" : "border-gray-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100 mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm sm:text-base text-gray-900">{n.titleBn}</h2>
                    {n.isUrgent && (
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        জরুরি
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                    {new Date(n.publishedAt).toLocaleDateString("bn-BD")}
                  </div>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{n.contentBn}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
