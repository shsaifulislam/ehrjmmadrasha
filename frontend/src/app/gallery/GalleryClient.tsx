"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePublicGallery } from "@/hooks/useCms";
import { EmptyState } from "@/components/shared/EmptyState";

const CATEGORY_MAP: Record<string, string> = {
  CAMPUS: "ক্যাম্পাস ও ভবন",
  EVENT: "অনুষ্ঠান ও প্রোগ্রাম",
  AWARD: "পুরস্কার বিতরণী",
  CLASSROOM: "ক্লাসরুম ও শিক্ষা",
  OTHER: "অন্যান্য",
};

export function GalleryClient() {
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [activeItem, setActiveItem] = useState<{ imageUrl: string; title: string; category: string } | null>(null);

  const { data, isLoading } = usePublicGallery(categoryFilter || undefined, page);
  const items = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-full overflow-hidden shrink-0 shadow-sm border-2 border-emerald-600 bg-white p-0.5 transition-transform group-hover:scale-105">
              <Image
                src="/images/logo.png"
                alt="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার লোগো"
                width={44}
                height={44}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="leading-tight">
              <span className="text-base font-bold text-emerald-800 dark:text-emerald-400 block leading-tight">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold">
                জমিরীয়া মাদ্রাসা (ফটো গ্যালারি)
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-sm text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> মূল পাতায় ফিরে যান
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 flex-1 w-full">
        {/* Banner Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-4 py-1 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <ImageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>ছবি ও চিত্রমালা</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            ফটো গ্যালারি
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার বিভিন্ন ক্যাম্পাস কার্যক্রম, শিক্ষা, পুরস্কার বিতরণী ও সামাজিক অনুষ্ঠানের চিত্রমালা।
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm">
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {[
              { key: "", label: "সকল ছবি" },
              { key: "CAMPUS", label: "ক্যাম্পাস" },
              { key: "EVENT", label: "অনুষ্ঠান" },
              { key: "AWARD", label: "পুরস্কার বিতরণী" },
              { key: "CLASSROOM", label: "ক্লাসরুম" },
              { key: "OTHER", label: "অন্যান্য" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setCategoryFilter(tab.key);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  categoryFilter === tab.key
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Image Grid Container */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse overflow-hidden bg-white dark:bg-slate-900 border">
                <div className="aspect-video w-full bg-slate-200 dark:bg-slate-800" />
                <CardContent className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="কোনো ছবি পাওয়া যায়নি"
            description="নির্বাচিত ক্যাটাগরিতে বর্তমানে কোনো স্থিরচিত্র গ্যালারিতে সংযুক্ত নেই।"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card
                key={item.id}
                className="group overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-slate-900"
                onClick={() =>
                  setActiveItem({
                    imageUrl: item.imageUrl,
                    title: item.title,
                    category: item.category,
                  })
                }
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white border-none text-[10px] font-medium">
                      {CATEGORY_MAP[item.category] || item.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3.5 space-y-1">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate" title={item.title}>
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3 text-emerald-600" />
                    {new Date(item.uploadedAt).toLocaleDateString("bn-BD")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Navigation Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="text-xs font-medium"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> পূর্ববর্তী পেজ
            </Button>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              পেজ {page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
              className="text-xs font-medium"
            >
              পরবর্তী পেজ <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </main>

      {/* Interactive Lightbox Modal */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] overflow-hidden rounded-xl bg-slate-900/80 border border-slate-700/50 shadow-2xl p-2 sm:p-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveItem(null)}
              className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/60 hover:bg-black p-2 rounded-full text-sm font-bold z-10 transition-colors"
              aria-label="বন্ধ করুন"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="w-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-lg">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.title}
                className="object-contain max-h-[75vh] w-full mx-auto"
              />
            </div>
            <div className="w-full text-center mt-3 space-y-1">
              <Badge className="bg-emerald-600 text-white text-xs">
                {CATEGORY_MAP[activeItem.category] || activeItem.category}
              </Badge>
              <h3 className="text-white font-bold text-base sm:text-lg truncate px-4">
                {activeItem.title}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
