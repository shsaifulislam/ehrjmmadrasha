import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Calendar, FileText, Bell, AlertCircle, Share2, Printer } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface NoticeDetailsProps {
  params: {
    id: string;
  };
}

import { generateNoticeJsonLd } from "@/lib/cms";

export default async function NoticeDetailsPage({ params }: NoticeDetailsProps) {
  const notice = await prisma.notice.findUnique({
    where: { id: params.id },
  });

  // SECURITY GUARD: Never expose draft, scheduled, or non-public internal notices to unauthenticated visitors
  if (!notice || !notice.isPublished || notice.audience !== "PUBLIC" || notice.status !== "PUBLISHED") {
    return (
      <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16 text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-red-50 text-red-600 mb-2">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">নোটিশটি খুঁজে পাওয়া যায়নি</h1>
          <p className="text-xs text-gray-500">অনুরোধকৃত নোটিশটি সরিয়ে নেওয়া হয়েছে অথবা আইডি ভুল রয়েছে।</p>
          <div className="pt-4">
            <Link
              href="/notices"
              className="inline-flex items-center gap-1.5 bg-[#0D5C3A] text-white px-4 py-2 rounded text-xs font-semibold shadow hover:bg-[#158052] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              সকল নোটিশে ফিরে যান
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const jsonLd = generateNoticeJsonLd(notice);

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <Link
            href="/notices"
            className="text-xs font-semibold text-[#0D5C3A] hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            সকল নোটিশে ফিরে যান
          </Link>
          <span className="text-xs text-gray-500 font-medium">অফিশিয়াল সার্কুলার</span>
        </div>

        {/* Notice Card */}
        <article className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 sm:p-8 space-y-6">
          <header className="space-y-3 pb-5 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-50 text-[#0D5C3A] border border-emerald-200 px-2.5 py-0.5 rounded text-[11px] font-bold">
                {notice.category}
              </span>
              {notice.isUrgent && (
                <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1">
                  <Bell className="w-3 h-3 text-red-600 animate-pulse" />
                  জরুরি ঘোষণা
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
              {notice.titleBn}
            </h1>

            {notice.titleEn && (
              <h2 className="text-sm font-medium text-gray-500 font-mono">
                {notice.titleEn}
              </h2>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                প্রকাশের তারিখ:{" "}
                {new Date(notice.publishedAt).toLocaleDateString("bn-BD", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span>•</span>
              <span className="text-gray-500">কর্তৃপক্ষ: {INSTITUTION_INFO.nameBn}</span>
            </div>
          </header>

          {/* Notice Content */}
          <div className="prose max-w-none text-sm text-gray-800 leading-relaxed whitespace-pre-line">
            {notice.contentBn}
          </div>

          {notice.contentEn && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-700 font-mono whitespace-pre-line">
              {notice.contentEn}
            </div>
          )}

          {/* Action Bar */}
          <footer className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              যেকোনো অনুসন্ধানে: <span className="font-mono font-bold text-gray-900">{INSTITUTION_INFO.primaryPhone}</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/notices"
                className="px-3.5 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
              >
                অন্যান্য নোটিশ
              </Link>
            </div>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
