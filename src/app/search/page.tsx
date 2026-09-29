"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, BookOpen, FileText, CheckCircle, Tag, ArrowRight, HelpCircle, AlertCircle, Clock } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  sourceType: string;
  sourceTier: number;
  category: string;
  version?: string;
  effectiveDate?: string;
  score: number;
  citation: string;
}

export default function GlobalSearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [conflictNotice, setConflictNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const q = encodeURIComponent(query.trim());
      const knowledgeUrl = `/api/search?q=${q}${
        category !== "ALL" ? `&category=${encodeURIComponent(category)}` : ""
      }`;
      const publicUrl = `/api/public/search?q=${q}`;

      const [kRes, pRes] = await Promise.all([
        fetch(knowledgeUrl).then((r) => r.json()).catch(() => null),
        fetch(publicUrl).then((r) => r.json()).catch(() => null),
      ]);

      const combined: SearchResult[] = [];

      // 1. Add Public Content Results (Notices, Events, FAQs, Downloads)
      if (pRes?.success && pRes.results) {
        for (const pr of pRes.results) {
          combined.push({
            id: pr.id,
            title: pr.title,
            snippet: pr.snippet,
            sourceType: pr.entityType,
            sourceTier: 1,
            category: pr.badge,
            score: 1.0,
            citation: `[পাবলিক পোর্টাল: ${pr.badge}]`,
            effectiveDate: pr.date,
          });
        }
      }

      // 2. Add Knowledge Document Results
      if (kRes?.success && kRes.results) {
        combined.push(...kRes.results);
        setConflictNotice(kRes.conflictNotice || null);
      }

      setResults(combined);
      setLatencyMs((kRes?.latencyMs || 0) + (pRes?.latencyMs || 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Perform search on query change or initial popular suggestions
  const runSuggestedSearch = (suggested: string) => {
    setQuery(suggested);
    setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(suggested)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setResults(d.results || []);
            setConflictNotice(d.conflictNotice || null);
            setLatencyMs(d.latencyMs || 0);
            setHasSearched(true);
          }
        });
    }, 50);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F3]">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-[#0D5C3A] px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
            <BookOpen className="w-3.5 h-3.5" />
            প্রাতিষ্ঠানিক জ্ঞানভান্ডার অনুসন্ধান
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            ইলিয়টগঞ্জ মাদরাসা তথ্য ও নীতিমালা সার্চ
          </h1>
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">
            ভর্তি নির্দেশিকা, ফি নীতিমালা, হোস্টেল আচরণবিধি, অ্যাকাডেমিক ক্যালেন্ডার ও অফিসিয়াল নোটিশ নির্ভরযোগ্য উৎসসহ খুঁজে নিন।
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-md border border-emerald-100 space-y-3">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="কী জানতে চান? (যেমন: ভর্তি ফি কত? অথবা ছুটির নিয়মাবলী কী?)..."
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-3 border border-gray-200 rounded-xl text-xs font-semibold bg-gray-50 focus:outline-none"
            >
              <option value="ALL">সকল বিভাগ</option>
              <option value="ADMISSION">ভর্তি ও আবেদন</option>
              <option value="FINANCE">ফি ও আর্থিক নীতিমালা</option>
              <option value="ACADEMIC">উপস্থিতি ও অ্যাকাডেমিক</option>
              <option value="RESIDENTIAL">আবাসিক হোস্টেল</option>
              <option value="NOTICE">অফিসিয়াল নোটিশ</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? "খোঁজা হচ্ছে..." : "অনুসন্ধান"}
            </button>
          </form>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-500">
            <span className="font-semibold text-gray-600">জনপ্রিয় অনুসন্ধান:</span>
            {[
              "২০২৬ ভর্তি নীতিমালা",
              "ভর্তি ফি কত",
              "উপস্থিতি ও ছুটির নিয়ম",
              "আবাসিক হোস্টেল নীতিমালা",
              "ফি মওকুফ ও লিল্লাহ সহায়তা",
            ].map((s) => (
              <button
                key={s}
                onClick={() => runSuggestedSearch(s)}
                className="bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] px-2.5 py-1 rounded-lg border border-emerald-100 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Conflict Notice if any */}
        {conflictNotice && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">সতর্কবার্তা:</span> {conflictNotice}
            </div>
          </div>
        )}

        {/* Results Section */}
        {hasSearched && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>মোট {results.length}টি ফলাফল পাওয়া গেছে</span>
              <span>অনুসন্ধান গতি: {latencyMs} ms</span>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 space-y-2">
                <HelpCircle className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="font-bold text-gray-800 text-base">কোনো তথ্য পাওয়া যায়নি</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  আপনার অনুসন্ধানকৃত শব্দের সাথে কোনো অনুমোদিত প্রাতিষ্ঠানিক রেকর্ড মেলেনি। অন্য শব্দ দিয়ে চেষ্টা করুন অথবা মাদরাসার হেল্পডেস্কে যোগাযোগ করুন।
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 bg-white rounded-2xl shadow-sm border border-emerald-100/80 hover:border-emerald-300 transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {item.category}
                      </span>
                      {item.version && (
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          সংস্করণ {item.version}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-gray-900 hover:text-[#0D5C3A] transition">
                      {item.title}
                    </h2>

                    <p className="text-sm text-gray-700 leading-relaxed">{item.snippet}</p>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-mono text-[11px] flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        {item.citation}
                      </span>
                      {item.effectiveDate && (
                        <span className="text-gray-400 text-[10px]">
                          কার্যকর: {new Date(item.effectiveDate).toLocaleDateString("bn-BD")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
