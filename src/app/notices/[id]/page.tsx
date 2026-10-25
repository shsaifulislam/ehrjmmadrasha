import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeaderBanner from "@/components/PageHeaderBanner";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Bell,
  AlertCircle,
  Share2,
  Printer,
  Download,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
import { generateNoticeJsonLd } from "@/lib/cms";

export const dynamic = "force-dynamic";

interface NoticeDetailsProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NoticeDetailsPage({ params }: NoticeDetailsProps) {
  const { id } = await params;
  const notice = await prisma.notice.findUnique({
    where: { id },
  });

  // SECURITY GUARD: Never expose draft, scheduled, or non-public internal notices
  if (!notice || !notice.isPublished || notice.audience !== "PUBLIC" || notice.status !== "PUBLISHED") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
        <Navbar />
        <PageHeaderBanner
          title="নোটিশ পাওয়া যায়নি"
          subtitle="অনুরোধকৃত নোটিশটি সরিয়ে নেওয়া হয়েছে অথবা আইডি ভুল রয়েছে"
          breadcrumbs={[
            { label: "নোটিশ বোর্ড", href: "/notices" },
            { label: "ত্রুটি" },
          ]}
        />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16 text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-red-50 text-red-600 mb-2">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-display">নোটিশটি খুঁজে পাওয়া যায়নি</h2>
          <p className="text-xs text-slate-500">অনুরোধকৃত নোটিশটি সরিয়ে নেওয়া হয়েছে অথবা ভুল লিংক প্রবেশ করা হয়েছে।</p>
          <div className="pt-4">
            <Link
              href="/notices"
              className="inline-flex items-center gap-1.5 bg-[#0D5C3A] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow hover:bg-[#063321] transition"
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

  const formattedDate = new Date(notice.publishedAt || (notice as any).publishDate || notice.createdAt).toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <PageHeaderBanner
        title={notice.titleBn}
        subtitle={`প্রকাশের তারিখ: ${formattedDate} • ${INSTITUTION_INFO.nameBn}`}
        badge={notice.category || "অফিসিয়াল সার্কুলার"}
        breadcrumbs={[
          { label: "নোটিশ বোর্ড", href: "/notices" },
          { label: notice.titleBn },
        ]}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 space-y-6">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
          <Link
            href="/notices"
            className="text-xs font-bold text-[#0D5C3A] hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>সকল নোটিশে ফিরে যান</span>
          </Link>
          <span className="text-xs text-slate-500 font-mono">
            স্মারক নং: EHRJ/NOTICE/{notice.id.slice(-6).toUpperCase()}
          </span>
        </div>

        {/* Notice Card */}
        <article className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-xl p-6 sm:p-10 space-y-6">
          <header className="space-y-4 pb-6 border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-50 text-[#0D5C3A] border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                  {notice.category}
                </span>
                {notice.isUrgent && (
                  <span className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                    জরুরি বিজ্ঞপ্তি
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>প্রকাশ: <strong>{formattedDate}</strong></span>
              </div>
            </div>

            <h1 className="text-xl sm:text-3xl font-bold font-display text-slate-900 leading-snug">
              {notice.titleBn}
            </h1>

            {notice.titleEn && (
              <h2 className="text-xs sm:text-sm font-semibold text-slate-500 font-mono">
                {notice.titleEn}
              </h2>
            )}
          </header>

          {/* Notice Content */}
          <div className="prose max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line py-2">
            {notice.contentBn}
          </div>

          {notice.contentEn && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 font-mono whitespace-pre-line">
              {notice.contentEn}
            </div>
          )}

          {/* File Attachment if available */}
          {notice.attachmentUrl && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#0D5C3A]" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{notice.attachmentName || "সংযুক্ত সার্কুলার ফাইল"}</h4>
                  <p className="text-[11px] text-slate-500">অফিসিয়াল স্বাক্ষরিত কপি</p>
                </div>
              </div>
              <a
                href={notice.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ডাউনলোড করুন</span>
              </a>
            </div>
          )}

          {/* Official Signatory Footer */}
          <footer className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-slate-600">
            <div className="space-y-1">
              <p className="font-bold text-slate-900">কর্তৃপক্ষের আদেশক্রমে,</p>
              <p className="text-[#0D5C3A] font-semibold">{INSTITUTION_INFO.principal}</p>
              <p className="text-[11px] text-slate-500">মুহতামিম, {INSTITUTION_INFO.nameBn}</p>
            </div>

            <div className="space-y-1 text-left sm:text-right">
              <p className="text-slate-500">যোগাযোগ ও জিজ্ঞাসা:</p>
              <p className="font-mono font-bold text-slate-900">{INSTITUTION_INFO.primaryPhone}</p>
              <p className="text-[11px] text-slate-500">{INSTITUTION_INFO.addressBn}</p>
            </div>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
