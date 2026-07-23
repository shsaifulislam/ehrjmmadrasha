"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  FileText,
  Download,
  Calendar,
  Loader2,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePublicNotices } from "@/hooks/useCms";
import { EmptyState } from "@/components/shared/EmptyState";

const TYPE_BADGE_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  GENERAL: { label: "সাধারণ নোটিশ", variant: "default" },
  EXAM: { label: "পরীক্ষার নোটিশ", variant: "secondary" },
  ADMISSION: { label: "ভর্তির নোটিশ", variant: "outline" },
  EVENT: { label: "অনুষ্ঠান", variant: "secondary" },
  URGENT: { label: "জরুরি নোটিশ", variant: "destructive" },
};

export function NoticesClient() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data, isLoading } = usePublicNotices(typeFilter || undefined, page);
  const notices = data?.notices || [];
  const pagination = data?.pagination;

  // Filter fetched notices locally by title or content search query
  const filteredNotices = notices.filter((notice) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      notice.title.toLowerCase().includes(q) ||
      notice.content.toLowerCase().includes(q)
    );
  });

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
                জমিরীয়া মাদ্রাসা (অফিশিয়াল নোটিশ বোর্ড)
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 flex-1 w-full">
        {/* Banner Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-4 py-1 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>প্রাতিষ্ঠানিক নোটিশ বোর্ড</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            বিজ্ঞপ্তি ও নোটিশসমূহ
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            মাদ্রাসার সকল সাম্প্রতিক নোটিশ, পরীক্ষার সময়সূচি, নোটিফিকেশন ও একাডেমিক রুটিন ডাউনলোড করুন।
          </p>
        </div>

        {/* Controls: Search Bar & Category Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="নোটিশের শিরোনামে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto justify-start md:justify-end">
              {[
                { key: "", label: "সকল নোটিশ" },
                { key: "GENERAL", label: "সাধারণ" },
                { key: "EXAM", label: "পরীক্ষা" },
                { key: "ADMISSION", label: "ভর্তি" },
                { key: "EVENT", label: "অনুষ্ঠান" },
                { key: "URGENT", label: "জরুরি" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setTypeFilter(tab.key);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    typeFilter === tab.key
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notice List Container */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse p-6 bg-white dark:bg-slate-900 border">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
                <div className="h-6 w-3/4 bg-slate-300 dark:bg-slate-700 rounded mb-4" />
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded space-y-2" />
              </Card>
            ))}
          </div>
        ) : filteredNotices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="কোনো বিজ্ঞপ্তি পাওয়া যায়নি"
            description="নির্বাচিত ক্যাটাগরি বা সার্চ ফিল্টারের সাথে মানানসই কোনো নোটিশ বর্তমানে প্রকাশিত নেই।"
          />
        ) : (
          <div className="space-y-4">
            {filteredNotices.map((notice) => {
              const bg = TYPE_BADGE_MAP[notice.type] || {
                label: notice.type,
                variant: "outline" as const,
              };
              return (
                <Card
                  key={notice.id}
                  className="hover:shadow-md transition-all border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                >
                  <CardHeader className="pb-2 border-b bg-slate-50/40 dark:bg-slate-800/30">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="space-y-1">
                        <Badge variant={bg.variant} className="mb-1 text-xs">
                          {bg.label}
                        </Badge>
                        <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                          {notice.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1.5 font-mono shrink-0">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                        {new Date(notice.createdAt).toLocaleDateString("bn-BD")}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                      {notice.content}
                    </p>
                    {notice.attachmentUrl && (
                      <div className="pt-3 border-t flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (notice.attachmentUrl) {
                              window.open(notice.attachmentUrl, "_blank");
                            }
                          }}
                          className="text-xs gap-1.5 border-emerald-600 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50"
                        >
                          <FileText className="h-3.5 w-3.5" /> PDF প্রিভিউ দেখুন
                        </Button>
                        <a
                          href={notice.attachmentUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs"
                        >
                          <Download className="h-3.5 w-3.5" /> ডাউনলোড
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
    </div>
  );
}
