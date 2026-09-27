"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Bookmark,
  Building,
  ShieldCheck,
  ChevronRight,
  Layers,
  Info,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function PublicLibraryCatalogPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBook, setSelectedBook] = useState<any | null>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (selectedCategory) query.set("categoryId", selectedCategory);
      const res = await fetch(`/api/public/library/books?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setBooks(data.books || []);
        if (data.categories) setCategories(data.categories);
      }
    } catch (err) {
      console.error("Public catalog fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col text-[#0B1914]">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-[#083B25] to-[#0D5C3A] text-white py-12 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto text-center space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/30 text-emerald-200 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" /> কেন্দ্রীয় দারুল কুতুব ও ই-লাইব্রেরি ক্যাটালগ
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold font-display">
            ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা লাইব্রেরি
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            কুরআন, হাদীস, ফিক্বহ, তাফসীর, আরবি সাহিত্য ও জেনারেল শিক্ষার সমৃদ্ধ কিতাব সম্ভার। শিক্ষক, শিক্ষার্থী ও গবেষকদের জন্য উন্মুক্ত ক্যাটালগ অনুসন্ধান।
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className="flex items-center bg-white rounded-xl shadow-lg p-1.5 border border-emerald-600/30">
              <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="কিতাবের নাম, লেখক, বিষয় বা প্রকাশনী দিয়ে অনুসন্ধান করুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchCatalog()}
                className="w-full px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none placeholder-gray-400"
              />
              <button
                onClick={fetchCatalog}
                className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition shrink-0"
              >
                অনুসন্ধান
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full space-y-6">
        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition shrink-0 ${
              !selectedCategory
                ? "bg-[#0D5C3A] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            সকল বিষয়
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition shrink-0 ${
                selectedCategory === c.id
                  ? "bg-[#0D5C3A] text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {c.nameBn}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400">ক্যাটালগ লোড হচ্ছে...</div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {books.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBook(b)}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {b.category?.nameBn}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.isAvailable
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {b.isAvailable ? "উপলব্ধ" : "ধার নেওয়া আছে"}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{b.titleBn}</h3>
                  <p className="text-gray-400 text-[11px] mt-0.5 line-clamp-1">{b.titleEn}</p>
                  <p className="text-emerald-700 text-xs font-semibold mt-2">{b.author?.nameBn}</p>
                  {b.publisher?.name && (
                    <p className="text-gray-500 text-[11px] mt-0.5">প্রকাশনী: {b.publisher.name}</p>
                  )}
                </div>

                <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between text-[11px] text-gray-500">
                  <span>তাক: {b.shelfLocation || "নির্ধারিত তাক"}</span>
                  <span className="font-semibold text-gray-700">উপলব্ধ: {b.availableCopies}টি</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-xs text-gray-500">
            অনুসন্ধানের ভিত্তিতে কোনো কিতাব পাওয়া যায়নি। ভিন্ন কি-ওয়ার্ড দিয়ে চেষ্টা করুন।
          </div>
        )}

        {/* Public Privacy Assurance */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>
              <strong>গোপনীয়তা সুরক্ষা:</strong> এই ক্যাটালগে কেবলমাত্র সাধারণ বইয়ের ক্যাটালগ ও উপলব্ধতা প্রদর্শিত হয়। শিক্ষার্থী বা গ্রহীতার কোনো ব্যক্তিগত তথ্য পাবলিকলি প্রদর্শিত হয় না।
            </span>
          </div>
          <Link
            href="/portal"
            className="text-[11px] font-bold text-[#0D5C3A] hover:underline whitespace-nowrap"
          >
            অভিভাবক পোর্টাল &rarr;
          </Link>
        </div>
      </main>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {selectedBook.category?.nameBn}
                </span>
                <h3 className="font-bold text-base text-gray-900 mt-1">{selectedBook.titleBn}</h3>
                <p className="text-gray-500 text-xs">{selectedBook.titleEn}</p>
              </div>
              <button onClick={() => setSelectedBook(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">লেখক:</span>
                <span className="font-semibold text-gray-900">{selectedBook.author?.nameBn}</span>
              </div>
              {selectedBook.publisher?.name && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-500">প্রকাশনী:</span>
                  <span className="font-semibold text-gray-900">{selectedBook.publisher.name}</span>
                </div>
              )}
              {selectedBook.edition && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-500">সংস্করণ:</span>
                  <span className="font-semibold text-gray-900">{selectedBook.edition}</span>
                </div>
              )}
              {selectedBook.isbn && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-500">ISBN:</span>
                  <span className="font-mono text-gray-900">{selectedBook.isbn}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">তাক / অবস্থান:</span>
                <span className="font-semibold text-emerald-700">{selectedBook.shelfLocation || "নির্ধারিত তাকে সংরক্ষিত"}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">বর্তমান উপলব্ধতা:</span>
                <span className="font-bold text-emerald-700">
                  {selectedBook.availableCopies}টি উপলব্ধ (মোট {selectedBook.totalCopies}টি কপির মধ্যে)
                </span>
              </div>
              {selectedBook.description && (
                <div className="pt-2 text-gray-600 leading-relaxed">
                  <span className="font-bold block text-gray-800 mb-1">সংক্ষিপ্ত বিবরণ:</span>
                  {selectedBook.description}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedBook(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
