"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FolderDown,
  FileText,
  Download,
  Loader2,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePublicDownloads } from "@/hooks/useCms";
import { EmptyState } from "@/components/shared/EmptyState";

const CATEGORY_MAP: Record<string, string> = {
  ROUTINE: "ক্লাস ও পরীক্ষার রুটিন",
  SYLLABUS: "সিলেবাস ও কারিকুলাম",
  ADMISSION: "ভর্তি ফরম ও নির্দেশনা",
  FORM: "প্রাতিষ্ঠানিক ফরম",
  OTHER: "অন্যান্য ডকুমেন্ট",
};

export function DownloadsClient() {
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data, isLoading } = usePublicDownloads(categoryFilter || undefined, page);
  const items = data?.items || [];
  const pagination = data?.pagination;

  // Local title filter for fetched items
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    return item.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
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
                জমিরীয়া মাদ্রাসা (ডাউনলোড সেন্টার)
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 flex-1 w-full">
        {/* Banner Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-4 py-1 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <FolderDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>অফিসিয়াল ফাইল ও ফরম আর্কাইভ</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            ডাউনলোড সেন্টার
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            মাদ্রাসার সিলেবাস, পরীক্ষার রুটিন, কারিকুলাম, ভর্তি ফরম ও প্রাতিষ্ঠানিক বিভিন্ন প্রয়োজনীয় ফাইল সংগ্রহ করুন।
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
                placeholder="ডকুমেন্টের নাম দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto justify-start md:justify-end">
              {[
                { key: "", label: "সকল ফাইল" },
                { key: "ROUTINE", label: "রুটিন" },
                { key: "SYLLABUS", label: "সিলেবাস" },
                { key: "ADMISSION", label: "ভর্তি ফরম" },
                { key: "FORM", label: "অন্যান্য ফরম" },
                { key: "OTHER", label: "অন্যান্য" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setCategoryFilter(tab.key);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
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
        </div>

        {/* Document List Table */}
        <Card className="shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b">
                    <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 w-1/6 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={FileText}
                  title="কোনো ডকুমেন্ট পাওয়া যায়নি"
                  description="নির্বাচিত ক্যাটাগরি বা ফিল্টারের সাথে মানানসই কোনো ফাইল বর্তমানে সংরক্ষিত নেই।"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
                    <TableRow>
                      <TableHead className="w-12 text-center font-bold">#</TableHead>
                      <TableHead className="font-bold">ডকুমেন্টের বিবরণ</TableHead>
                      <TableHead className="font-bold">ক্যাটাগরি</TableHead>
                      <TableHead className="text-right font-bold">সংযোজনের তারিখ</TableHead>
                      <TableHead className="text-right font-bold">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredItems.map((item, idx) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <TableCell className="text-center font-bold text-slate-500 text-xs">
                          {((page - 1) * 30 + idx + 1).toLocaleString("bn-BD")}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>{item.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px] font-medium border-emerald-600/40 text-emerald-800 dark:text-emerald-300">
                            {CATEGORY_MAP[item.category] || item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500 font-mono">
                          {new Date(item.createdAt).toLocaleDateString("bn-BD")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(item.fileUrl, "_blank")}
                              className="text-xs gap-1 border-slate-300 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                            >
                              <Eye className="h-3.5 w-3.5" /> দেখা
                            </Button>
                            <a
                              href={item.fileUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 px-3 py-1.5 rounded-md transition-colors shadow-2xs"
                            >
                              <Download className="h-3.5 w-3.5" /> ডাউনলোড
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-between items-center pt-4">
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
