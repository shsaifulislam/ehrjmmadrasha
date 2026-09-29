"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Command,
  ArrowRight,
  User,
  CreditCard,
  FileCheck,
  LifeBuoy,
  Package,
  Layers,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Bell,
  RefreshCw,
} from "lucide-react";
import { SearchResultItem } from "@/lib/search/types";

export default function AdminCommandCenterPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [isAiMode, setIsAiMode] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [shortcuts, setShortcuts] = useState<any[]>([]);
  const [loadingCenter, setLoadingCenter] = useState(true);

  useEffect(() => {
    fetchCommandCenterData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        executeSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, filterType, isAiMode]);

  const fetchCommandCenterData = async () => {
    setLoadingCenter(true);
    try {
      const res = await fetch("/api/admin/command-center");
      const data = await res.json();
      if (res.ok) {
        setPendingTasks(data.pendingTasks || []);
        setShortcuts(data.shortcuts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCenter(false);
    }
  };

  const executeSearch = async (term: string) => {
    setLoadingSearch(true);
    try {
      const url = new URL("/api/global-search", window.location.origin);
      url.searchParams.set("q", term);
      if (filterType !== "ALL") url.searchParams.set("type", filterType);
      if (isAiMode) url.searchParams.set("ai", "true");
      url.searchParams.set("limit", "20");

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok && data.results) {
        setSearchResults(data.results);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] p-4 sm:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-[#0D5C3A] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Command className="w-3.5 h-3.5" />
              কমান্ড ও সার্চ কন্ট্রোল
            </span>
            <span className="text-xs text-gray-500 font-mono">Ctrl + K যেকোনো স্থান থেকে সক্রিয়</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0B1914] mt-2">
            ইলিয়টগঞ্জ মাদরাসা — সার্বজনীন কমান্ড সেন্টার
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            একক স্থান থেকে শিক্ষার্থী, ফি, ভর্তি, প্রত্যয়নপত্র, উস্তাদ ও প্রশাসনিক সকল তথ্যের সার্বিক অনুসন্ধান
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCommandCenterData}
            className="p-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-4 h-4 ${loadingCenter ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/admin"
            className="bg-[#0D5C3A] hover:bg-[#083B25] text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            অ্যাডমিন ড্যাশবোর্ডে ফিরুন
          </Link>
        </div>
      </div>

      {/* Global Universal Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder={
                isAiMode
                  ? "AI ন্যাচারাল সার্চ: যেমন 'বকেয়া ফি আছে এমন ছাত্র' বা 'হিফজ ক্লাসের প্রত্যয়নপত্র'..."
                  : "আইডি (EHRJ-2026-...), শিক্ষার্থীর নাম, ইনভয়েস নং, সনদ নম্বর বা কিতাবের নাম লিখুন..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C3A] text-gray-900"
            />
            <button
              onClick={() => setIsAiMode(!isAiMode)}
              className={`absolute right-2 top-2 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                isAiMode
                  ? "bg-[#0D5C3A] text-white shadow-xs"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              AI Search
            </button>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-xs font-medium text-gray-700 w-full sm:w-auto"
          >
            <option value="ALL">সকল মডিউল</option>
            <option value="STUDENT">শিক্ষার্থী</option>
            <option value="INVOICE">ফি ও ইনভয়েস</option>
            <option value="ADMISSION">ভর্তি আবেদন</option>
            <option value="CERTIFICATE">সনদ ও প্রত্যয়ন</option>
            <option value="EMPLOYEE">শিক্ষক ও কর্মকর্তা</option>
            <option value="HELPDESK">হেল্পডেস্ক টিকিট</option>
            <option value="LIBRARY_BOOK">লাইব্রেরি কিতাব</option>
            <option value="INVENTORY">মালামাল ও সম্পদ</option>
          </select>
        </div>

        {/* Live Search Results */}
        {searchTerm && (
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500 font-semibold px-1">
              <span>অনুসন্ধানের ফলাফল ({searchResults.length} টি)</span>
              {loadingSearch && <span className="text-[#0D5C3A]">অনুসন্ধান চলছে...</span>}
            </div>

            {searchResults.length === 0 && !loadingSearch ? (
              <div className="p-6 text-center text-xs text-gray-400">
                প্রদত্ত তথ্যে কোনো রেকর্ড খুঁজে পাওয়া যায়নি।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {searchResults.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    className="p-3 bg-gray-50/70 hover:bg-emerald-50/60 border border-gray-200 hover:border-emerald-200 rounded-xl transition flex justify-between items-center group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {item.displayTitleBn}
                        </span>
                        {item.matchType === "EXACT_ID" && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1 py-0.2 rounded font-mono font-bold">
                            EXACT
                          </span>
                        )}
                        <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.2 rounded font-medium">
                          {item.sourceModule}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0D5C3A] group-hover:translate-x-0.5 transition shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid: Pending Work Queues & Universal Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Pending Action Items Queue */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              অপেক্ষমান কার্যক্রম ও কিউ (Pending Queues)
            </h2>
          </div>

          <div className="space-y-2">
            {pendingTasks.map((t) => (
              <Link
                key={t.id}
                href={t.url}
                className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 flex items-center justify-between transition text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      t.severity === "HIGH"
                        ? "bg-rose-500 animate-pulse"
                        : t.severity === "WARNING"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span className="font-semibold text-gray-800">{t.titleBn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white border border-gray-200 font-mono font-bold px-2 py-0.5 rounded text-gray-900 shadow-xs">
                    {t.count}
                  </span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 2. Quick Command Shortcuts */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Command className="w-4 h-4 text-[#0D5C3A]" />
              সার্বজনীন দ্রুত নেভিগেশন (Universal Navigation Hub)
            </h2>
            <span className="text-[11px] text-gray-400">অনুমোদিত মডিউলসমূহ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {shortcuts.map((sc) => (
              <Link
                key={sc.id}
                href={sc.url}
                className="p-3 rounded-xl border border-gray-100 hover:border-emerald-200 bg-gray-50/60 hover:bg-emerald-50/50 flex items-center justify-between transition group"
              >
                <div>
                  <div className="font-bold text-gray-900 group-hover:text-[#0D5C3A] transition">
                    {sc.titleBn}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate mt-0.5">
                    {sc.descriptionBn}
                  </div>
                </div>
                {sc.shortcutKey && (
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded font-mono text-[10px] text-gray-500 shadow-xs shrink-0">
                    {sc.shortcutKey}
                  </kbd>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
