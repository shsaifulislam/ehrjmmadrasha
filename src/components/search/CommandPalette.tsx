"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Command,
  ArrowRight,
  BookOpen,
  User,
  CreditCard,
  FileCheck,
  LifeBuoy,
  Package,
  Layers,
  Sparkles,
  X,
  CornerDownLeft,
} from "lucide-react";
import { SearchResultItem } from "@/lib/search/types";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAiMode, setIsAiMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Global Ctrl+K / Cmd+K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      performSearch("");
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search trigger
  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(() => {
      performSearch(query);
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, isAiMode]);

  const performSearch = async (term: string) => {
    setLoading(true);
    try {
      const url = new URL("/api/global-search", window.location.origin);
      if (term) url.searchParams.set("q", term);
      if (isAiMode) url.searchParams.set("ai", "true");
      url.searchParams.set("limit", "15");

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok && data.results) {
        setResults(data.results);
        setSelectedIndex(0);
      }
    } catch (e) {
      console.error("Command palette search error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    if (item.url) {
      router.push(item.url);
    }
  };

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "STUDENT":
        return <User className="w-4 h-4 text-emerald-600" />;
      case "INVOICE":
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case "CERTIFICATE":
      case "DOCUMENT":
        return <FileCheck className="w-4 h-4 text-sky-600" />;
      case "HELPDESK":
        return <LifeBuoy className="w-4 h-4 text-rose-600" />;
      case "LIBRARY_BOOK":
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case "INVENTORY":
        return <Package className="w-4 h-4 text-amber-700" />;
      default:
        return <Command className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-100"
        onKeyDown={handleKeyNavigation}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 gap-3 bg-gray-50/50">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              isAiMode
                ? "স্বাভাবিক বাংলায় লিখুন (যেমন: হিফজ জামাতের ফি কত?)..."
                : "সার্বজনীন অনুসন্ধান বা কমান্ড লিখুন (যেমন: শিক্ষার্থী, ইনভয়েস নং, সনদ)..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-sm text-gray-900 focus:outline-none placeholder-gray-400"
          />

          {/* AI Assistance Toggle */}
          <button
            onClick={() => setIsAiMode(!isAiMode)}
            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              isAiMode
                ? "bg-[#0D5C3A] text-white shadow-sm"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            title="AI প্রাকৃতিক ভাষা অনুসন্ধান মোড"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 flex-1 divide-y divide-gray-50">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500">
              অনুসন্ধান করা হচ্ছে...
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center space-y-1">
              <p className="text-sm font-semibold text-gray-700">কোনো রেকর্ড পাওয়া যায়নি</p>
              <p className="text-xs text-gray-400">
                অনুগ্রহ করে আইডি নম্বর, নাম বা কি-ওয়ার্ড পরিবর্তন করে চেষ্টা করুন।
              </p>
            </div>
          ) : (
            results.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition ${
                  index === selectedIndex
                    ? "bg-emerald-50/80 border-emerald-200 text-[#0B1914]"
                    : "hover:bg-gray-50 text-gray-800"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-white border border-gray-100 shadow-xs shrink-0">
                    {getEntityIcon(item.entityType)}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {item.displayTitleBn}
                      </span>
                      {item.matchType === "EXACT_ID" && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                          EXACT
                        </span>
                      )}
                      <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.2 rounded">
                        {item.sourceModule}
                      </span>
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-gray-400 shrink-0 ml-2">
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info bar */}
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-between items-center text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span>
              নেভিগেশন: <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded font-mono">↓</kbd>
            </span>
            <span>
              নির্বাচন: <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded font-mono">Enter</kbd>
            </span>
            <span>
              বন্ধ: <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded font-mono">Esc</kbd>
            </span>
          </div>
          <span className="font-semibold text-emerald-800">
            EHRJ Command Center
          </span>
        </div>
      </div>
    </div>
  );
}
