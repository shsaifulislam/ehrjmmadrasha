import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeaderBanner from "@/components/PageHeaderBanner";
import CampusVideoShowcase from "@/components/CampusVideoShowcase";
import prisma from "@/lib/prisma";
import {
  Building2,
  GraduationCap,
  Heart,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Award,
  Sparkles,
  Users,
  Compass,
  Quote,
  Clock,
  ChevronRight,
  FileText,
  Calendar,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "পরিচিতি ও ঐতিহ্য | " + INSTITUTION_INFO.nameBn,
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার ঐতিহাসিক পটভূমি, পরিচালনা পর্ষদ, লক্ষ্য, উদ্দেশ্য ও মুহতামিমের অফিসিয়াল বার্তা।",
};

function toBnDigits(num: number | string): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
}

export default async function AboutPage() {
  const [activeStudentsCount, teachersCount, classesCount] = await Promise.all([
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "TEACHER", status: "ACTIVE" } }),
    prisma.jamatClass.count({ where: { isActive: true } }),
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      {/* 1. OFFICIAL PAGE HEADER BANNER WITH BREADCRUMB */}
      <PageHeaderBanner
        title="পরিচিতি, ঐতিহ্য ও ঐতিহাসিক পটভূমি"
        subtitle="কুরআন-সুন্নাহর বিশুদ্ধ জ্ঞান, তাজবীদভিত্তিক হিফজ ও চারিত্রিক উৎকর্ষ সাধনে এক অনন্য দ্বীনি মারকাজ ও এতিমখানা কমপ্লেক্স"
        badge="স্থাপিত: ২০২১ খ্রিস্টাব্দ • ১৪৪২ হিজরী"
        breadcrumbs={[{ label: "পরিচিতি ও ঐতিহ্য" }]}
      />

      {/* 2. STATS OVERVIEW STRIP WITH 3D CARDS */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-md text-center hover:border-emerald-600 transition card-3d">
            <span className="font-mono text-xl sm:text-2xl font-black text-[#0D5C3A]">
              ২০২১ ইং
            </span>
            <p className="text-xs font-bold text-slate-700 mt-1">প্রতিষ্ঠা সন</p>
            <p className="text-[11px] text-slate-500">ইলিয়টগঞ্জ, দাউদকান্দি</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-md text-center hover:border-emerald-600 transition card-3d">
            <span className="font-mono text-xl sm:text-2xl font-black text-[#D4AF37]">
              {toBnDigits(activeStudentsCount)}+
            </span>
            <p className="text-xs font-bold text-slate-700 mt-1">অধ্যয়নরত শিক্ষার্থী</p>
            <p className="text-[11px] text-slate-500">আবাসিক ও অনাবাসিক</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-md text-center hover:border-emerald-600 transition card-3d">
            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-700">
              {toBnDigits(teachersCount)}+
            </span>
            <p className="text-xs font-bold text-slate-700 mt-1">দক্ষ ও অভিজ্ঞ শিক্ষক</p>
            <p className="text-[11px] text-slate-500">হাফেজ ও শায়খুল হাদিস</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-md text-center hover:border-emerald-600 transition card-3d">
            <span className="font-mono text-xl sm:text-2xl font-black text-blue-700">
              {toBnDigits(classesCount)}টি
            </span>
            <p className="text-xs font-bold text-slate-700 mt-1">অনুমোদিত জামাত</p>
            <p className="text-[11px] text-slate-500">নূরানী থেকে কিতাব বিভাগ</p>
          </div>
        </div>
      </section>

      {/* 3. MAIN PORTAL BODY WITH 2-COLUMN ACADEMIC LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* LEFT: MAIN ARTICLE & CONTENT (8 Cols) */}
          <div className="lg:col-span-8 space-y-10">

            {/* QURANIC AYAH ACCENT */}
            <div className="bg-gradient-to-r from-emerald-900 via-[#0D5C3A] to-emerald-900 text-white p-5 rounded-2xl border-l-4 border-[#D4AF37] shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-arabic text-[#D4AF37] text-lg sm:text-xl tracking-wider">
                  وَقُل رَّبِّ زِدْنِي عِلْمًا
                </p>
                <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                  "এবং বলুন: হে আমার পালনকর্তা! আমার জ্ঞান বৃদ্ধি করুন।" — (সূরা ত্বাহা: ১১৪)
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-[#D4AF37]/60 flex-shrink-0 hidden sm:block" />
            </div>

            {/* SECTION 1: HISTORICAL BACKGROUND */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center font-bold">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
                    মাদরাসার সংক্ষিপ্ত ইতিহাস ও পটভূমি
                  </h2>
                  <p className="text-xs text-slate-500">প্রতিষ্ঠা সন ২০২১ খ্রিস্টাব্দ • পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                  <p>
                    <strong>ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</strong> ২০২১ খ্রিস্টাব্দে (১৪৪২ হিজরী) কুমিল্লার ঐতিহ্যবাহী দাউদকান্দি উপজেলার ইলিয়টগঞ্জ দক্ষিণ ইউনিয়নের পূর্ব লক্ষ্মীপুর গ্রামে প্রতিষ্ঠিত হয়। মরহুম হাজী রহমাতুল্লাহ্ সাহেবের পুণ্যস্মৃতি ও পরকালীন সওয়াবের উদ্দেশ্যে তাঁর সুযোগ্য পরিবারবর্গের সার্বিক পৃষ্ঠপোষকতা ও স্থানীয় দ্বীনদরদী ব্যক্তিবর্গের অক্লান্ত মেহনতে এই দ্বীনি বিদ্যাপীঠ যাত্রা শুরু করে।
                  </p>
                  <p>
                    প্রতিষ্ঠালগ্ন থেকেই প্রতিষ্ঠানটি কোনো প্রকার ব্যবসায়িক উদ্দেশ্য ব্যতিরেকে কেবল আল্লাহর সন্তুষ্টি অর্জন এবং এলাকার কোমলমতি শিশু-কিশোরদের সহীহ কুরআন মাজীদের তেলাওয়াত, হিফজ ও নৈতিক চরিত্র গঠনের ব্রত নিয়ে পরিচালিত হয়ে আসছে।
                  </p>
                  <p>
                    এখানে রয়েছে সম্পূর্ণ নিরাপদ ও পৃথক পরিবেশে বালক ও বালিকা শাখা। এতিম, দুস্থ ও অসহায় শিক্ষার্থীদের জন্য পরিচালিত হচ্ছে ১০০% ফ্রি লিল্লাহ বোর্ডিং ও সার্বক্ষণিক আবাসিক পরিচর্যা।
                  </p>
                </div>

                <div className="md:col-span-5">
                  <div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-[#D4AF37]/40 aspect-[4/3] group">
                    <Image
                      src="/images/campus-entrance.jpg"
                      alt="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা প্রবেশদ্বার"
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2.5 left-3 right-3 text-white text-[11px] font-bold">
                      মাদরাসা প্রবেশদ্বার ও সংলগ্ন রাস্তা
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: PRINCIPAL'S OFFICIAL STATEMENT */}
            <section className="bg-gradient-to-br from-[#063321] via-[#094A30] to-[#0D5C3A] text-white p-6 sm:p-8 rounded-3xl border-2 border-[#D4AF37] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-emerald-700/60 pb-4 mb-6">
                <div className="inline-flex items-center gap-2 bg-black/30 border border-[#D4AF37]/50 px-3 py-1 rounded-full text-xs font-bold text-amber-200">
                  <Quote className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>মুহতামিম মহোদয়ের অফিসিয়াল বাণী</span>
                </div>
                <span className="text-xs text-emerald-200 font-mono hidden sm:inline">
                  প্রতিষ্ঠাতা পরিচালক
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 text-center md:border-r border-emerald-700/60 md:pr-6 space-y-3">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-lg relative bg-white">
                    <Image
                      src="/images/principal.jpg"
                      alt={INSTITUTION_INFO.principal}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white font-display">
                      {INSTITUTION_INFO.principal}
                    </h3>
                    <p className="text-xs text-[#D4AF37] font-semibold">
                      প্রতিষ্ঠাতা মুহতামিম ও পরিচালক
                    </p>
                    <p className="text-[11px] text-emerald-200/80 mt-1">
                      হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
                    </p>
                  </div>
                </div>

                <div className="md:col-span-8 space-y-3.5 text-xs sm:text-sm text-emerald-100 leading-relaxed font-light text-justify">
                  <h4 className="text-base sm:text-lg font-bold font-display text-white leading-snug">
                    "বিশুদ্ধ কুরআন চর্চা ও আদর্শ নৈতিক চরিত্র গঠনের এক বিশ্বস্ত মারকাজ"
                  </h4>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm italic">
                    "বিসমিল্লাহির রাহমানির রাহিম। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কেবল একটি শিক্ষাপ্রতিষ্ঠান নয়, এটি ভবিষ্যৎ প্রজন্মের জন্য দ্বীনি ও চারিত্রিক আলোকবর্তিকা। আমাদের লক্ষ্য প্রতিটি শিক্ষার্থী যেন কোরআনের বিশুদ্ধ হাফেজ হওয়ার পাশাপাশি সুনাগরিক এবং দেশ ও উম্মাহর জন্য নিয়ামক হিসেবে গড়ে ওঠে। এতিম ও দরিদ্র ছাত্রদের সার্বিক ব্যয়ভার বহন করে আমরা আল্লাহর সন্তুষ্টি কামনা করছি।"
                  </div>
                  <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
                    <span>জরুরি যোগাযোগ:</span>
                    <strong className="font-mono text-white">{INSTITUTION_INFO.primaryPhone}</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: VISION, MISSION & CORE OBJECTIVES */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
                    আমাদের মূল লক্ষ্য ও উদ্দেশ্য
                  </h2>
                  <p className="text-xs text-slate-500">দ্বীনি ও বাস্তব জীবনের সমন্বিত শিক্ষা দর্শন</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "সহীহ মাখরাজ ও তাজবীদভিত্তিক হিফজ",
                    desc: "আন্তর্জাতিক মানসম্পন্ন সুর ও তাজবীদ অনুযায়ী পবিত্র কুরআন মাজীদ পূর্ণ হিফজ সমাপন।",
                  },
                  {
                    title: "আদর্শ ও মুত্তাকী চরিত্র গঠন",
                    desc: "সুন্নতি আদব, বড়দের সম্মান, ছোটদের স্নেহ এবং আমলি জিন্দেগির সার্বক্ষণিক তদারকি।",
                  },
                  {
                    title: "যুগোপযোগী আধুনিক জেনারেল শিক্ষা",
                    desc: "কুরআন শিক্ষার পাশাপাশি বাংলা, ইংরেজি, গণিত ও তথ্যপ্রযুক্তির মৌলিক দক্ষতা অর্জন।",
                  },
                  {
                    title: "১০০% ফ্রি লিল্লাহ বোর্ডিং ও এতিম সেবা",
                    desc: "অসহায় ও এতিম শিক্ষার্থীদের বিনামূল্যে উন্নত খাবার, বস্ত্র, বাসস্থান ও চিকিৎসা নিশ্চিত করা।",
                  },
                  {
                    title: "আলাদা বালক ও বালিকা শাখা",
                    desc: "সম্পূর্ণ পর্দানশীন ও পৃথক ভবনে নারী ও পুরুষ শিক্ষকদের তত্ত্বাবধানে শিক্ষাদান।",
                  },
                  {
                    title: "দরসে নিজামী ও কিতাব বিভাগ",
                    desc: "বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ-এর পাঠ্যক্রম অনুসারে মানসম্মত কিতাব পাঠদান।",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-500/50 hover:bg-emerald-50/20 transition space-y-1.5"
                  >
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{item.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 4: GOVERNING BODY & ADMINISTRATION */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
                    পরিচালনা পর্ষদ ও উপদেষ্টা কমিটি
                  </h2>
                  <p className="text-xs text-slate-500">মাদরাসার প্রশাসনিক ও একাডেমিক নীতিমালা প্রণয়নকারী পরিষদ</p>
                </div>
              </div>

              {/* OFFICIAL PANORAMIC TEACHERS & COMMITTEE BANNER */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-600/30 shadow-md group">
                <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full">
                  <Image
                    src="/images/banners/teachers-committee-banner.png"
                    alt="শিক্ষক ও পরিচালনা পরিচিতি | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
                    fill
                    className="object-cover group-hover:scale-[1.01] transition duration-500"
                  />
                </div>
                <div className="p-3 bg-gradient-to-r from-[#041F14] via-[#063321] to-[#0A482D] text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-amber-300">
                    দক্ষ শিক্ষকবৃন্দের তত্ত্বাবধানে মানসম্মত ইসলামী শিক্ষা • পরিচালনা পরিষদ ও উস্তাদমণ্ডলী
                  </span>
                  <Link
                    href="/contact"
                    className="btn-gold px-4 py-1.5 rounded-lg text-slate-950 font-bold transition shadow"
                  >
                    যোগাযোগ করুন
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 text-center space-y-2 bg-gradient-to-b from-slate-50 to-white">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">মাওলানা মহা. আবুল কালাম সরকার</h4>
                  <p className="text-xs text-[#0D5C3A] font-semibold">প্রতিষ্ঠাতা মুহতামিম ও পরিচালক</p>
                  <p className="text-[11px] text-slate-500">সার্বিক তত্ত্বাবধান ও প্রশাসন</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 text-center space-y-2 bg-gradient-to-b from-slate-50 to-white">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-[#9A781D] flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">সম্মানিত সভাপতি ও সদস্যবৃন্দ</h4>
                  <p className="text-xs text-amber-800 font-semibold">ম্যানেজিং কমিটি ও শুরা পরিষদ</p>
                  <p className="text-[11px] text-slate-500">নীতি নির্ধারণ ও সমাজসেবা</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 text-center space-y-2 bg-gradient-to-b from-slate-50 to-white">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">শিক্ষক ও উস্তাদ পরিষদ</h4>
                  <p className="text-xs text-blue-800 font-semibold">নাজেমে দারুল ইকামা ও উস্তাদগণ</p>
                  <p className="text-[11px] text-slate-500">পাঠদান, তারবিয়াত ও শৃঙ্খলা</p>
                </div>
              </div>
            </section>

            {/* SECTION 5: CAMPUS FACILITIES - RESIDENTIAL, FOOD & LIBRARY */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
                    আবাসিক, খাবার ও লাইব্রেরি সুবিধা
                  </h2>
                  <p className="text-xs text-slate-500">ইসলামী শিক্ষার অনুকূল ও শিক্ষাবান্ধব পরিবেশ গড়ে তোলার প্রচেষ্টা</p>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-600/30 shadow-md group">
                <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full">
                  <Image
                    src="/images/banners/hostel-dining-library-banner.png"
                    alt="আবাসিক, খাবার ও লাইব্রেরি সুবিধা | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
                    fill
                    className="object-cover group-hover:scale-[1.01] transition duration-500"
                  />
                </div>
                <div className="p-3 bg-gradient-to-r from-[#041F14] via-[#063321] to-[#0A482D] text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-amber-300">
                    আবাসিক সুবিধা • স্বাস্থ্যসম্মত খাবার সুবিধা • সমৃদ্ধ লাইব্রেরি ও কিতাব সম্ভার
                  </span>
                  <Link
                    href="/library"
                    className="btn-gold px-4 py-1.5 rounded-lg text-slate-950 font-bold transition shadow"
                  >
                    লাইব্রেরি ক্যাটালগ
                  </Link>
                </div>
              </div>
            </section>

          </div>

          {/* RIGHT: OFFICIAL ACADEMIC SIDEBAR (4 Cols) */}
          <aside className="lg:col-span-4 space-y-6">

            {/* QUICK FACTS CARD */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold font-display text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0D5C3A]" />
                <span>এক নজরে মাদরাসা</span>
              </h3>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">প্রতিষ্ঠা সন:</span>
                  <strong className="text-slate-900 font-mono">২০২১ খ্রিস্টাব্দ (১৪৪২ হিজরী)</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">ধরন:</span>
                  <strong className="text-slate-900">দ্বীনি ও লিল্লাহ এতিমখানা কমপ্লেক্স</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">অবস্থান:</span>
                  <strong className="text-slate-900 text-right">পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">উপজেলা ও জেলা:</span>
                  <strong className="text-slate-900">দাউদকান্দি, কুমিল্লা</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">অনুষদ:</span>
                  <strong className="text-slate-900">নূরানী, হিফজ, কিতাব ও বালিকা</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">বোর্ড সম্পৃক্ততা:</span>
                  <strong className="text-slate-900">বেফাক সমমান কারিকুলাম</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">লিল্লাহ বোর্ডিং:</span>
                  <strong className="text-emerald-700 font-bold">১০০% ফ্রি সুবিধা রয়েছে</strong>
                </div>
              </div>

              <Link
                href="/admission"
                className="w-full btn-gold py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mt-2"
              >
                <GraduationCap className="w-4 h-4" />
                <span>ভর্তি নির্দেশিকা দেখুন</span>
              </Link>
            </div>

            {/* HELPLINE & VISIT CARD */}
            <div className="bg-gradient-to-br from-[#063321] to-[#0D5C3A] text-white rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Phone className="w-3.5 h-3.5" />
                <span>অফিস ও যোগাযোগ</span>
              </div>

              <h4 className="text-lg font-bold font-display text-white">
                সরাসরি ক্যাম্পাস পরিদর্শন করুন
              </h4>

              <p className="text-xs text-emerald-100 leading-relaxed font-light">
                অভিভাবক ও শুভানুধ্যায়ীদের জন্য মাদরাসার অফিস প্রতিদিন সকাল ৮:০০টা থেকে রাত ৮:০০টা পর্যন্ত খোলা থাকে।
              </p>

              <div className="space-y-2 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-white/10 flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-mono text-white font-bold">{INSTITUTION_INFO.primaryPhone}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/10 flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <span>{INSTITUTION_INFO.addressBn}</span>
                </div>
              </div>

              <Link
                href="/contact"
                className="w-full bg-white text-[#0D5C3A] hover:bg-emerald-50 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <span>দিকনির্দেশনা ও গুগল ম্যাপ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* QUICK LINKS CARD */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold font-display text-slate-900 pb-2 border-b border-slate-100">
                প্রয়োজনীয় লিংকসমূহ
              </h3>

              <div className="space-y-2 text-xs">
                <Link
                  href="/academic"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-[#0D5C3A] transition"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#0D5C3A]" />
                    <span>শিক্ষা কার্যক্রম ও অনুষদ</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/donate"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-[#0D5C3A] transition"
                >
                  <span className="flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-rose-600" />
                    <span>লিল্লাহ বোর্ডিং ও অনুদান</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/notices"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-[#0D5C3A] transition"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>অফিসিয়াল নোটিশ বোর্ড</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/gallery"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-[#0D5C3A] transition"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>ক্যাম্পাস ফটো গ্যালারি</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>

          </aside>
        </div>

        {/* CAMPUS VIDEO SHOWCASE */}
        <div className="mt-12">
          <CampusVideoShowcase />
        </div>
      </main>

      <Footer />
    </div>
  );
}
