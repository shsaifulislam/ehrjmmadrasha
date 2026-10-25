import React from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeHeroSlider from "@/components/HomeHeroSlider";
import NoticeTicker from "@/components/NoticeTicker";
import PrayerTimesSidebarWidget from "@/components/PrayerTimesSidebarWidget";
import CampusVideoShowcase from "@/components/CampusVideoShowcase";
import prisma from "@/lib/prisma";
import { INSTITUTION_INFO } from "@/lib/constants";
import {
  BookOpen,
  GraduationCap,
  Users,
  Award,
  ChevronRight,
  FileText,
  PhoneCall,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Building,
  Library,
  Globe,
  Bell,
  Heart,
  Laptop,
  Check,
  Download,
  Trophy,
  Bus,
} from "lucide-react";

export const revalidate = 60;

function toBnDigits(num: number | string): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
}

function formatBnDate(date: Date): { day: string; month: string; year: string } {
  const months = [
    "জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"
  ];
  const d = new Date(date);
  return {
    day: toBnDigits(d.getDate()),
    month: months[d.getMonth()],
    year: toBnDigits(d.getFullYear()),
  };
}

export default async function HomePage() {
  const [
    dbNotices,
    principalProfile,
    classesCount,
    currentSession,
    activeStudentsCount,
    teachersCount,
    certificatesCount,
  ] = await Promise.all([
    prisma.notice.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.principalProfile.findFirst(),
    prisma.jamatClass.count({ where: { isActive: true } }),
    prisma.academicSession.findFirst({ where: { isCurrent: true } }),
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "TEACHER", status: "ACTIVE" } }),
    prisma.certificate.count({ where: { status: "ISSUED" } }),
  ]);

  const defaultNotices = [
    {
      id: "admission-2026",
      titleBn: "২০২৬ শিক্ষাবর্ষে নূরানী, নাজেরা, হিফজ ও কিতাব বিভাগে নতুন ভর্তি বিজ্ঞপ্তি",
      category: "ভর্তি",
      publishedAt: new Date(),
    },
    {
      id: "exam-routine",
      titleBn: "আসন্ন সাময়িক ও বার্ষিক পরীক্ষার চূড়ান্ত সময়সূচি ও আসন বিন্যাস প্রকাশ",
      category: "পরীক্ষা",
      publishedAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: "ramadan-vacation",
      titleBn: "পবিত্র রমজানুল মুবারক ও ঈদুল ফিতর উপলক্ষে মাদরাসা ছুটির জরুরি নোটিশ",
      category: "ছুটি",
      publishedAt: new Date(Date.now() - 86400000 * 5),
    },
    {
      id: "hifz-convocation",
      titleBn: "বার্ষিক হিফজুল কুরআন সমাপনী ও পাগড়ী প্রদান অনুষ্ঠানের সময়সূচী",
      category: "অনুষ্ঠান",
      publishedAt: new Date(Date.now() - 86400000 * 8),
    },
    {
      id: "scholarship-notice",
      titleBn: "মেধাবী ও অসচ্ছল শিক্ষার্থীদের মাঝে বিশেষ মেধা বৃত্তি প্রদান সংক্রান্ত সার্কুলার",
      category: "বৃত্তি",
      publishedAt: new Date(Date.now() - 86400000 * 12),
    },
  ];

  const displayNotices = dbNotices.length >= 3 ? dbNotices : defaultNotices;

  // Digital Quick Services Matrix
  const quickServices = [
    {
      title: "অনলাইন ভর্তি",
      sub: "২০২৬ শিক্ষাবর্ষে আবেদন",
      href: "/admission",
      icon: GraduationCap,
      color: "bg-emerald-50 text-[#0D5C3A] border-emerald-200 group-hover:bg-[#0D5C3A] group-hover:text-white",
    },
    {
      title: "পরীক্ষার ফলাফল",
      sub: "অনলাইন রেজাল্ট ও গ্রেডিং",
      href: "/results",
      icon: Award,
      color: "bg-amber-50 text-amber-700 border-amber-200 group-hover:bg-amber-600 group-hover:text-white",
    },
    {
      title: "ফি ও বেতন পরিশোধ",
      sub: "বিকাশ ও নগদ গেটওয়ে",
      href: "/portal",
      icon: ShieldCheck,
      color: "bg-blue-50 text-blue-700 border-blue-200 group-hover:bg-blue-700 group-hover:text-white",
    },
    {
      title: "ডিজিটাল হাজিরা",
      sub: "দৈনিক উপস্থিতি ট্র্যাকার",
      href: "/portal",
      icon: Clock,
      color: "bg-teal-50 text-teal-700 border-teal-200 group-hover:bg-teal-700 group-hover:text-white",
    },
    {
      title: "ক্লাস ও পরীক্ষার রুটিন",
      sub: "একাডেমিক ক্যালেন্ডার",
      href: "/calendar",
      icon: Calendar,
      color: "bg-purple-50 text-purple-700 border-purple-200 group-hover:bg-purple-700 group-hover:text-white",
    },
    {
      title: "সনদ ও আইডি যাচাই",
      sub: "QR সত্যতা যাচাইকরণ",
      href: "/verify",
      icon: FileText,
      color: "bg-rose-50 text-rose-700 border-rose-200 group-hover:bg-rose-700 group-hover:text-white",
    },
    {
      title: "ই-লাইব্রেরি ও কিতাব",
      sub: "ডিজিটাল মাকতাবা সম্ভার",
      href: "/library",
      icon: Library,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200 group-hover:bg-indigo-700 group-hover:text-white",
    },
    {
      title: "ডাউনলোড হাব",
      sub: "ফরম, সিলেবাস ও প্রসপেক্টাস",
      href: "/downloads",
      icon: Download,
      color: "bg-cyan-50 text-cyan-700 border-cyan-200 group-hover:bg-cyan-700 group-hover:text-white",
    },
    {
      title: "প্রতিযোগিতা ও ইভেন্ট",
      sub: "হিফজ ও কুরআন প্রতিযোগিতা",
      href: "/events",
      icon: Trophy,
      color: "bg-amber-50 text-amber-800 border-amber-300 group-hover:bg-amber-700 group-hover:text-white",
    },
    {
      title: "প্রাক্তন শিক্ষার্থী ফোরাম",
      sub: "দাওরায়ে হাদিস গ্র্যাজুয়েট",
      href: "/alumni",
      icon: BookOpen,
      color: "bg-emerald-50 text-emerald-700 border-emerald-300 group-hover:bg-emerald-700 group-hover:text-white",
    },
    {
      title: "ছাত্র পরিবহন সেবা",
      sub: "রুট ও পিকআপ পয়েন্ট",
      href: "/transport",
      icon: Bus,
      color: "bg-orange-50 text-orange-700 border-orange-200 group-hover:bg-orange-700 group-hover:text-white",
    },
    {
      title: "প্যারেন্টস পোর্টাল",
      sub: "অভিভাবক অ্যাকাউন্ট লগইন",
      href: "/portal",
      icon: Users,
      color: "bg-emerald-50 text-emerald-800 border-emerald-200 group-hover:bg-emerald-800 group-hover:text-white",
    },
  ];

  // Academic Departments
  const departments = [
    {
      id: "noorani",
      name: "নূরানী ও মক্তব বিভাগ",
      image: "/images/banners/nurani-najera-hifz-banner.png",
      age: "৫ - ৭ বছর বয়স",
      features: [
        "বিশুদ্ধ নূরানী কুরআন তিলাওয়াত ও মাখরাজ প্রশিক্ষণ",
        "প্রাথমিক মাসআলা-মাসায়েল, আকাইদ ও দৈনন্দিন দুআ",
        "বাংলা, ইংরেজি ও সাধারণ গণিত বুনিয়াদি পাঠদান"
      ],
      link: "/academic",
    },
    {
      id: "hifz",
      name: "তাহফিজুল কুরআন বিভাগ",
      image: "/images/banners/nurani-najera-hifz-banner.png",
      age: "হিফজ শিক্ষার্থী",
      features: [
        "সহীহ তাজবীদ ও সুমধুর হুসনে সওত সহকারে হিফজ",
        "আন্তর্জাতিক প্রতিযোগিতায় উত্তীর্ণ কারিগণের নিবিড় তত্ত্বাবধান",
        "দৈনিক হেফজ ও নিয়মিত ইয়াদ সবক পর্যালোচনা"
      ],
      link: "/academic",
    },
    {
      id: "kitab",
      name: "কিতাব ও জামাত বিভাগ",
      image: "/images/banners/kitab-department-banner.png",
      age: "দাখিল, আলিম ও দাওরা",
      features: [
        "ইলমে নাহু, সরফ, বালাগাত ও আরবি সাহিত্য",
        "হাদিস শরীফ, তাফসির ও ফিকহুল ইসলাম উচ্চতর পাঠ",
        "জাতীয় ও মাদ্রাসা শিক্ষাবোর্ড পরীক্ষায় ধারাবাহিক শ্রেষ্ঠত্ব"
      ],
      link: "/academic",
    },
    {
      id: "ict",
      name: "কম্পিউটার ও বিজ্ঞান শাখা",
      image: "/images/student-banner.jpg",
      age: "সকল স্তরের শিক্ষার্থী",
      features: [
        "সুসজ্জিত আধুনিক কম্পিউটার ও আইসিটি ল্যাব",
        "ব্যবহারিক ইংরেজি ভাষা দক্ষতা প্রশিক্ষণ",
        "ইসলামিক নৈতিক মূল্যবোধ সম্পন্ন তথ্যপ্রযুক্তি চর্চা"
      ],
      link: "/academic",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] selection:bg-[#0D5C3A] selection:text-white font-sans text-slate-800">
      <Navbar />

      {/* 1. BREAKING NOTICE / SCROLLING MARQUEE TICKER (DSKM STYLE) */}
      <NoticeTicker notices={displayNotices} />

      {/* =========================================================
          2. MAIN INSTITUTIONAL SHOWCASE (2-COLUMN UNIVERSITY LAYOUT)
             Left (70% / col-span-8): Slider + Welcome + Depts + Photos
             Right (30% / col-span-4): Principal + Notices + Prayer + Links
      ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* -------------------------------------------------------
              LEFT COLUMN (col-span-8): Primary Academic Content
          ------------------------------------------------------- */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            
            {/* 2.1 Main Campus Interactive Slider */}
            <HomeHeroSlider />

            {/* 2.2 Welcome to EHRJ Madrasha (Formal Academic Statement) */}
            <section className="bg-white rounded-lg p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-6 bg-[#0D5C3A] rounded-sm" />
                <h2 className="text-xl sm:text-2xl font-bold text-[#0D5C3A] font-serif-bn">
                  ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় আপনাকে স্বাগতম
                </h2>
              </div>

              <div className="text-xs sm:text-sm leading-relaxed text-slate-700 space-y-3 text-justify font-sans">
                <p>
                  আল্লাহ রাব্বুল আলামীনের অশেষ রহমতে ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কুমিল্লা জেলার ঐতিহ্যবাহী দ্বীনি বিদ্যাপীঠ। কুরআন ও সহীহ সুন্নাহর ভিত্তিতে শিশুদের নৈতিক চরিত্র গঠন, বিশুদ্ধ কুরআনুল কারীম হিফজ এবং যুগোপযোগী ইসলামি শরিয়াহ জ্ঞান বিতরণের প্রত্যয়ে এটি প্রতিষ্ঠিত ও পরিচালিত হয়ে আসছে।
                </p>
                <p>
                  আমাদের বিদ্যাপীঠে প্রথাগত কিতাব বিভাগ (দাওরায়ে হাদিস) ও আন্তর্জাতিক মানের তাহফিজুল কুরআন বিভাগের পাশাপাশি প্রাথমিক নূরানী-নাজেরা স্তর এবং কম্পিউটার ও আধুনিক তথ্যপ্রযুক্তি ল্যাব সুসমন্বিত রয়েছে। শিক্ষার্থীদের মেধা ও মনন বিকাশে অভিজ্ঞ ও নিবেদিতপ্রাণ ওলামায়ে কেরাম ও শিক্ষকবৃন্দ সার্বক্ষণিক নিয়োজিত।
                </p>
              </div>

              {/* Highlights Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 mt-4 border-t border-slate-100 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0D5C3A] flex-shrink-0" />
                  <span>আন্তর্জাতিক মানের তাজবীদ ও হুসনে সওত সহ হিফজ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0D5C3A] flex-shrink-0" />
                  <span>অভিজ্ঞ ও মুত্তাকী ওলামায়ে কেরাম দ্বারা পাঠদান</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0D5C3A] flex-shrink-0" />
                  <span>সুপরিসর ক্যাম্পাস, ছাত্রাবাস ও মানসম্মত লিল্লাহ বোর্ডিং</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0D5C3A] flex-shrink-0" />
                  <span>আধুনিক কম্পিউটার ল্যাব ও ইংরেজি ভাষা চর্চা</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/about"
                  className="text-xs sm:text-sm font-bold text-[#0D5C3A] hover:text-emerald-700 flex items-center gap-1.5 group font-serif-bn"
                >
                  <span>মাদরাসার পূর্ণাঙ্গ ইতিহাস ও পরিচিতি পড়ুন</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Link>
                <span className="text-xs text-slate-400 font-mono">
                  কোড: EHRJ-EDU
                </span>
              </div>
            </section>

            {/* 2.3 Academic Departments & Levels */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-[#D4AF37] rounded-sm" />
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif-bn">
                    শিক্ষা স্তর ও বিভাগসমূহ
                  </h3>
                </div>
                <Link
                  href="/academic"
                  className="text-xs font-semibold text-[#0D5C3A] hover:underline flex items-center gap-1 font-serif-bn"
                >
                  <span>সকল বিভাগ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group card-3d"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      <Image
                        src={dept.image}
                        alt={dept.name}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-sm text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded font-sans">
                        {dept.age}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base font-serif-bn group-hover:text-[#0D5C3A] transition mb-2">
                          {dept.name}
                        </h4>
                        <ul className="text-xs text-slate-600 space-y-1.5 mb-4 font-sans">
                          {dept.features.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-snug">
                              <span className="text-[#0D5C3A] mt-0.5 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Link
                        href={dept.link}
                        className="text-xs font-bold text-[#0D5C3A] hover:text-emerald-800 flex items-center justify-between pt-2 border-t border-slate-100 font-serif-bn"
                      >
                        <span>কারিকুলাম ও বিস্তারিত তথ্য</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 2.3.5 Official Curriculum & Department Panoramic Banners Showcase */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-[#0D5C3A] rounded-sm" />
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif-bn">
                    অনুমোদিত বিভাগীয় পাঠক্রম ও বৈশিষ্ট্য
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-serif-bn">
                  নূরানী, হিফজ ও কিতাব বিভাগ
                </span>
              </div>

              <div className="space-y-4">
                {/* Noorani, Najera & Hifz Wide Banner */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-700/30 shadow-md hover:shadow-xl transition-all duration-300 group">
                  <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full">
                    <Image
                      src="/images/banners/nurani-najera-hifz-banner.png"
                      alt="নূরানী, নাজেরা ও হিফজ বিভাগ - ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
                      fill
                      className="object-cover group-hover:scale-[1.02] transition duration-500"
                    />
                  </div>
                  <div className="p-3 bg-gradient-to-r from-[#063321] to-[#0D5C3A] text-white flex items-center justify-between text-xs font-serif-bn">
                    <span className="font-semibold text-amber-300">
                      নূরানী, নাজেরা ও হিফজ বিভাগ • কুরআন শিক্ষার প্রথম ধাপ থেকে পূর্ণাঙ্গ হিফজ
                    </span>
                    <Link
                      href="/academic"
                      className="inline-flex items-center gap-1 text-white hover:text-amber-200 font-bold transition"
                    >
                      <span>বিস্তারিত দেখুন</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Kitab Department Wide Banner */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-amber-600/30 shadow-md hover:shadow-xl transition-all duration-300 group">
                  <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full">
                    <Image
                      src="/images/banners/kitab-department-banner.png"
                      alt="কিতাব বিভাগ - ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
                      fill
                      className="object-cover group-hover:scale-[1.02] transition duration-500"
                    />
                  </div>
                  <div className="p-3 bg-gradient-to-r from-[#1e3a1f] to-[#063321] text-white flex items-center justify-between text-xs font-serif-bn">
                    <span className="font-semibold text-amber-300">
                      কিতাব বিভাগ • আদর্শ চরিত্র গঠন ও দ্বীনি শিক্ষার সুসংগঠিত পাঠক্রম
                    </span>
                    <Link
                      href="/academic"
                      className="inline-flex items-center gap-1 text-white hover:text-amber-200 font-bold transition"
                    >
                      <span>সিলেবাস ও জামাত</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* 2.4 Campus Life & Activity Gallery Highlights */}
            <section className="bg-white rounded-lg p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-[#0D5C3A] rounded-sm" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif-bn">
                    ক্যাম্পাস জীবন ও সাম্প্রতিক কার্যক্রম
                  </h3>
                </div>
                <Link
                  href="/gallery"
                  className="text-xs font-semibold text-[#0D5C3A] hover:underline flex items-center gap-1 font-serif-bn"
                >
                  <span>ফটো গ্যালারি</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="group relative rounded overflow-hidden aspect-[4/3] bg-slate-100 shadow-sm">
                  <Image
                    src="/images/students-celebration.jpg"
                    alt="সমাবর্তন ও পুরষ্কার বিতরণ"
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-95 p-3 flex items-end">
                    <p className="text-white text-xs font-semibold leading-tight font-serif-bn">
                      বার্ষিক হিফজুল কুরআন সমাপনী ও পাগড়ী প্রদান
                    </p>
                  </div>
                </div>

                <div className="group relative rounded overflow-hidden aspect-[4/3] bg-slate-100 shadow-sm">
                  <Image
                    src="/images/students-class.jpg"
                    alt="শ্রেণিকক্ষে পাঠদান"
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-95 p-3 flex items-end">
                    <p className="text-white text-xs font-semibold leading-tight font-serif-bn">
                      সুশৃঙ্খল শ্রেণিকক্ষে সহীহ তাজবীদ প্রশিক্ষণ
                    </p>
                  </div>
                </div>

                <div className="group relative rounded overflow-hidden aspect-[4/3] bg-slate-100 shadow-sm">
                  <Image
                    src="/images/campus-entrance.jpg"
                    alt="প্রধান তোরণ ও ক্যাম্পাস"
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-95 p-3 flex items-end">
                    <p className="text-white text-xs font-semibold leading-tight font-serif-bn">
                      মাদরাসার দৃষ্টিনন্দন ও সুপ্রশস্ত ক্যাম্পাস প্রাঙ্গণ
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2.4.5 Annual Islamic Mahfil & Spiritual Convocation Feature */}
            <section className="bg-white rounded-lg p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-amber-600 rounded-sm" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif-bn">
                    বার্ষিক ইসলামী মাহফিল ও দ্বীনি সমাবেশ
                  </h3>
                </div>
                <Link
                  href="/events"
                  className="text-xs font-semibold text-[#0D5C3A] hover:underline flex items-center gap-1 font-serif-bn"
                >
                  <span>সকল আয়োজন</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="relative rounded-2xl overflow-hidden border-2 border-amber-600/30 shadow-md group">
                <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full">
                  <Image
                    src="/images/banners/islamic-mahfil-banner.png"
                    alt="ইসলামী মাহফিল ও দ্বীনি সম্মেলন - ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
                    fill
                    className="object-cover group-hover:scale-[1.01] transition duration-500"
                  />
                </div>
                <div className="p-3 bg-gradient-to-r from-[#041F14] via-[#063321] to-[#0A482D] text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-serif-bn">
                  <span className="font-semibold text-amber-300">
                    দ্বীনি শিক্ষা • আত্মশুদ্ধি • ইসলামী জীবন গঠন — সমাজে শান্তি ও ঐক্যের বার্তা
                  </span>
                  <Link
                    href="/events"
                    className="btn-gold px-4 py-1.5 rounded-lg text-slate-950 font-bold transition shadow"
                  >
                    মাহফিল কর্মসূচি
                  </Link>
                </div>
              </div>
            </section>

          </div>

          {/* -------------------------------------------------------
              RIGHT COLUMN (col-span-4): Traditional Institutional Sidebar
          ------------------------------------------------------- */}
          <aside className="lg:col-span-4 space-y-6">

            {/* 2.4.9 Official Admission Open Announcement Poster Card */}
            <div className="bg-gradient-to-b from-white to-emerald-50/50 rounded-2xl border-2 border-[#D4AF37] p-4 shadow-lg overflow-hidden group">
              <div className="flex items-center justify-between mb-3 border-b border-emerald-100 pb-2">
                <span className="bg-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full animate-pulse shadow-sm font-serif-bn">
                  ভর্তি চলছে ২০২৬
                </span>
                <span className="text-xs font-bold text-[#0D5C3A] font-serif-bn">
                  নূরানী • হিফজ • কিতাব
                </span>
              </div>

              <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-md border border-slate-200 mb-3 bg-slate-900">
                <Image
                  src="/images/banners/admission-notice-poster.jpg"
                  alt="ভর্তি চলছে - ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                  priority
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-700 leading-snug font-serif-bn text-center font-medium">
                  আপনার সন্তানের জন্য একটি নিরাপদ, আদর্শ ও দ্বীনি শিক্ষার পরিবেশ
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/admission"
                    className="btn-gold py-2 rounded-xl text-center text-xs font-bold block shadow"
                  >
                    ভর্তি আবেদন
                  </Link>
                  <Link
                    href="/images/banners/admission-notice-poster.jpg"
                    target="_blank"
                    className="bg-[#0D5C3A] hover:bg-emerald-800 text-white py-2 rounded-xl text-center text-xs font-semibold block transition"
                  >
                    ব্যানার দেখুন
                  </Link>
                </div>
              </div>
            </div>
            
            {/* 2.5 Principal's Profile & Message (DSKM Traditional Box) */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm text-center">
              <div className="relative w-32 h-36 mx-auto rounded-md overflow-hidden border-2 border-[#D4AF37] shadow mb-3 bg-slate-100">
                <Image
                  src={principalProfile?.photoUrl || "/images/principal.jpg"}
                  alt="অধ্যক্ষ মহোদয়"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
              <div className="inline-block bg-emerald-50 text-[#0D5C3A] text-xs font-bold px-3 py-0.5 rounded-full border border-emerald-200 mb-1 font-serif-bn">
                {principalProfile?.designationBn || "অধ্যক্ষ ও মুহতামিম"}
              </div>
              <h3 className="font-extrabold text-slate-900 text-base font-serif-bn leading-snug">
                {principalProfile?.fullNameBn || INSTITUTION_INFO.principal}
              </h3>
              <p className="text-xs text-slate-500 mb-3 font-medium font-sans">
                {principalProfile?.bioBn || "কামিল (প্রথম শ্রেণি), দাওরায়ে হাদিস"}
              </p>
              
              <blockquote className="text-xs text-slate-600 bg-slate-50 p-3 rounded border-l-2 border-[#0D5C3A] text-justify leading-relaxed mb-4 italic font-sans">
                &ldquo;{principalProfile?.officialMessageBn || "কুরআন ও হাদিসের বিশুদ্ধ জ্ঞান অর্জন এবং সুন্নাহর আদর্শে চরিত্র গঠন করাই আমাদের মূল লক্ষ্য। আদর্শ মানুষ গঠনে ইলিয়টগঞ্জ জমিরীয়া মাদরাসা নিরলস কাজ করছে।"}&rdquo;
              </blockquote>

              <Link
                href="/about#principal"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D5C3A] hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded transition font-serif-bn"
              >
                <span>অধ্যক্ষের পূর্ণাঙ্গ বাণী পড়ুন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 2.6 Official Notice Board Widget (with Day/Month badges) */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-[#0D5C3A] text-white p-3.5 flex items-center justify-between border-b-2 border-[#D4AF37]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="font-bold text-sm sm:text-base font-serif-bn">
                    জরুরী নোটিশ বোর্ড
                  </h3>
                </div>
                <Link
                  href="/notices"
                  className="text-[11px] text-amber-200 hover:text-white font-medium font-serif-bn"
                >
                  সকল ({toBnDigits(displayNotices.length)})
                </Link>
              </div>

              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                {displayNotices.slice(0, 5).map((notice, idx) => {
                  const dateInfo = formatBnDate(notice.publishedAt);
                  return (
                    <article key={notice.id || idx} className="p-3 hover:bg-slate-50 transition flex items-start gap-3">
                      {/* Date Badge Box */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded p-1.5 text-center flex-shrink-0 w-12">
                        <span className="block font-bold text-sm text-[#0D5C3A] leading-none font-mono">
                          {dateInfo.day}
                        </span>
                        <span className="block text-[10px] text-emerald-700 uppercase font-semibold mt-0.5">
                          {dateInfo.month}
                        </span>
                      </div>
                      
                      {/* Notice Title & Category */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-1.5 py-0.2 rounded border border-slate-200 font-sans">
                            {notice.category || "সাধারণ"}
                          </span>
                        </div>
                        <Link
                          href={`/notices/${notice.id}`}
                          className="text-xs font-semibold text-slate-800 hover:text-[#0D5C3A] transition line-clamp-2 leading-snug font-serif-bn"
                        >
                          {notice.titleBn}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <Link
                  href="/notices"
                  className="text-xs font-bold text-[#0D5C3A] hover:underline flex items-center justify-center gap-1 font-serif-bn"
                >
                  <span>সকল অফিসিয়াল সার্কুলার দেখুন</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* 2.7 Compact Prayer Times Widget */}
            <PrayerTimesSidebarWidget />

            {/* 2.8 Important Portals & Government Quick Links */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Globe className="w-4 h-4 text-[#0D5C3A]" />
                <h3 className="font-bold text-sm text-slate-900 font-serif-bn">
                  গুরুত্বপূর্ণ ডিজিটাল লিঙ্ক
                </h3>
              </div>

              <ul className="text-xs space-y-2 text-slate-700 font-sans">
                <li>
                  <a
                    href="http://www.bmeb.gov.bd"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition border border-transparent hover:border-slate-200 group"
                  >
                    <span className="group-hover:text-[#0D5C3A] font-medium">বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D5C3A]" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://iau.edu.bd"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition border border-transparent hover:border-slate-200 group"
                  >
                    <span className="group-hover:text-[#0D5C3A] font-medium">ইসলামিক আরবি বিশ্ববিদ্যালয় (IAU)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D5C3A]" />
                  </a>
                </li>
                <li>
                  <a
                    href="http://www.moedu.gov.bd"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition border border-transparent hover:border-slate-200 group"
                  >
                    <span className="group-hover:text-[#0D5C3A] font-medium">শিক্ষা মন্ত্রণালয় (MoEdu)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D5C3A]" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://teachers.gov.bd"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition border border-transparent hover:border-slate-200 group"
                  >
                    <span className="group-hover:text-[#0D5C3A] font-medium">শিক্ষক বাতায়ন ও ই-কনটেন্ট</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D5C3A]" />
                  </a>
                </li>
              </ul>
            </div>

            {/* 2.9 Helpline & Campus Location */}
            <div className="bg-gradient-to-br from-[#062d1c] to-[#0D5C3A] rounded-lg p-5 text-white shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-bold text-sm text-amber-300 font-serif-bn">
                  জরুরী ভর্তি ও তথ্য সহায়তা
                </h3>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed font-sans">
                ভর্তি সংক্রান্ত যে কোনো তথ্যের জন্য আমাদের প্রশাসনিক হটলাইনে সরাসরি যোগাযোগ করুন।
              </p>
              <div className="pt-1 font-mono text-base font-bold text-white tracking-wide">
                📞 {INSTITUTION_INFO.primaryPhone}
              </div>
              <div className="text-[11px] text-emerald-200 font-serif-bn">
                সময়: সকাল ৮:০০ - বিকাল ৫:০০ (শনিবার - বৃহস্পতিবার)
              </div>
            </div>

          </aside>

        </div>
      </main>

      {/* =========================================================
          2.5 CAMPUS 3D VIDEO TOUR & DOCUMENTARY SHOWCASE
      ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <CampusVideoShowcase />
      </div>

      {/* =========================================================
          2.6 GUARDIAN & STUDENT AUTHENTICATION ACCESS GATEWAY
      ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-8">
        <div className="bg-gradient-to-r from-[#041F14] via-[#063321] to-[#0A482D] rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-[#D4AF37] shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6 card-3d">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-black/40 border border-[#D4AF37]/50 px-3.5 py-1 rounded-full text-xs font-bold text-amber-300 badge-3d">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>নিরাপদ ডিজিটাল পোর্টাল • লগইন বা অ্যাকাউন্ট আবশ্যক</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-serif-bn text-white">
              ভর্তি আবেদন, পরীক্ষার ফলাফল ও সকল সেবায় অ্যাকাউন্ট বাধ্যতামূলক
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 font-light max-w-2xl leading-relaxed font-sans">
              সম্মানিত অভিভাবক ও শিক্ষার্থী, অনলাইনে নতুন ভর্তি আবেদন সম্পন্ন করতে, পরীক্ষার পূর্ণাঙ্গ গ্রেডশিট দেখতে অথবা ফি পরিশোধ করতে আপনার অ্যাকাউন্টে লগইন থাকা বাধ্যতামূলক। কোনো অ্যাকাউন্ট না থাকলে এখনই বিনামূল্যে নিবন্ধন করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 flex-shrink-0">
            <Link
              href="/login?tab=guardian"
              className="btn-gold px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg"
            >
              <Users className="w-4 h-4 text-slate-950" />
              <span>অভিভাবক লগইন</span>
            </Link>
            <Link
              href="/login?tab=register"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs sm:text-sm font-bold transition"
            >
              <span>নতুন অ্যাকাউন্ট খুলুন</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. KEY INSTITUTIONAL DIGITAL SERVICES MATRIX
      ========================================================= */}
      <section className="bg-white border-y border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-[#0D5C3A] bg-emerald-50 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider font-serif-bn">
              ডিজিটাল ক্যাম্পাস সেবা
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-serif-bn">
              নাগরিক সেবা ও ডিজিটাল পোর্টাল
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
              এক ক্লিকেই মাদরাসার সকল অনলাইন অ্যাকাডেমিক ও প্রশাসনিক সেবায় প্রবেশ করুন
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {quickServices.map((service, idx) => {
              const Icon = service.icon;
              return (
                <Link
                  key={idx}
                  href={service.href}
                  className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#0D5C3A] hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center space-y-2.5 card-3d"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition border ${service.color} badge-3d`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 group-hover:text-[#0D5C3A] transition font-serif-bn">
                      {service.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
                      {service.sub}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* =========================================================
          4. INSTITUTIONAL FACTS & COUNTER BANNER (AT A GLANCE)
      ========================================================= */}
      <section className="bg-[#041F14] text-white py-14 border-b-4 border-[#D4AF37] relative overflow-hidden perspective-1000">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
        <div className="absolute -top-20 left-1/3 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 preserve-3d">
          <div className="text-center mb-10">
            <p className="font-arabic text-[#D4AF37] text-lg select-none">مَا شَاءَ اللَّهُ لَا قُوَّةَ إِلَّا بِاللَّهِ</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-serif-bn">
              এক নজরে মাদরাসা
            </h2>
            <p className="text-xs text-emerald-200/80 mt-1 font-serif-bn">
              দ্বীনি শিক্ষা ও নৈতিকতায় আমাদের ধারাবাহিক পথচলা
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 card-3d shadow-xl">
              <div className="font-extrabold text-3xl sm:text-4xl text-amber-400 mb-1 font-mono">
                {toBnDigits(activeStudentsCount > 0 ? activeStudentsCount : "২৫০০")}+
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white font-serif-bn">
                মোট শিক্ষার্থী
              </div>
              <p className="text-[10px] text-emerald-300 mt-0.5 font-sans">নূরানী, হিফজ ও কিতাব</p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 card-3d shadow-xl">
              <div className="font-extrabold text-3xl sm:text-4xl text-amber-400 mb-1 font-mono">
                {toBnDigits(teachersCount > 0 ? teachersCount : "৬৫")}+
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white font-serif-bn">
                অভিজ্ঞ ওলামায়ে কেরাম
              </div>
              <p className="text-[10px] text-emerald-300 mt-0.5 font-sans">নিবেদিতপ্রাণ শিক্ষক মণ্ডলী</p>
            </div>

            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/50">
              <div className="font-extrabold text-3xl sm:text-4xl text-amber-400 mb-1 font-mono">
                ৮৫০+
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white font-serif-bn">
                হাফেজে কুরআন
              </div>
              <p className="text-[10px] text-emerald-300 mt-0.5 font-sans">সনদপ্রাপ্ত গ্র্যাজুয়েট</p>
            </div>

            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/50">
              <div className="font-extrabold text-3xl sm:text-4xl text-amber-400 mb-1 font-mono">
                ৯৯.৪%
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white font-serif-bn">
                বোর্ড পাশের হার
              </div>
              <p className="text-[10px] text-emerald-300 mt-0.5 font-sans">প্রতি বছর এ+ ও বৃত্তি অর্জন</p>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          5. LILLAH BOARDING & ORPHANAGE SUPPORT (DONATION SHOWCASE)
      ========================================================= */}
      <section className="bg-gradient-to-b from-amber-50/60 to-emerald-50/40 border-b border-amber-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-xs font-bold px-3.5 py-1 rounded-full font-serif-bn border border-amber-300">
              <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
              <span>সাদাকায়ে জারিয়া, যাকাত ও এতিম তহবিল</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif-bn">
              লিল্লাহ বোর্ডিং ও এতিমখানা তহবিলে উন্মুক্ত অনুদান
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-sans">
              অসহায়, দরিদ্র ও এতিম তালিবুল ইলমদের খাদ্য, আবাসন ও দ্বীনি শিক্ষার খরচ বহনে আপনার যাকাত ও সাধারণ দান পৌঁছে দিন
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Lillah Boarding Banner (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl border-2 border-emerald-600/30 overflow-hidden shadow-md flex flex-col justify-between group">
              <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full bg-slate-900">
                <Image
                  src="/images/banners/donation-lillah-boarding-banner.jpg"
                  alt="দান, সদকা ও লিল্লাহ বোর্ডিং - ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
                  fill
                  className="object-cover group-hover:scale-[1.01] transition duration-500"
                />
              </div>
              <div className="p-4 sm:p-5 bg-gradient-to-r from-[#041F14] via-[#063321] to-[#0A482D] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <span className="font-bold text-amber-300 text-sm block font-serif-bn">
                    দান, সদকা ও লিল্লাহ বোর্ডিং • একটি দান, অসংখ্য সওয়াবের পথ
                  </span>
                  <p className="text-emerald-100/80 text-xs mt-0.5">
                    খাদ্য, আবাসন, শিক্ষা উপকরণ, পোশাক ও চিকিৎসা সেবায় শতভাগ আমানতদারিতা
                  </p>
                </div>
                <Link
                  href="/donate"
                  className="btn-gold px-5 py-2.5 rounded-xl font-bold text-xs flex-shrink-0 shadow hover:scale-105 transition"
                >
                  লিল্লাহ তহবিলে দান
                </Link>
              </div>
            </div>

            {/* Orphan Support Poster (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl sm:rounded-3xl border-2 border-amber-500/40 overflow-hidden shadow-md p-4 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full font-serif-bn">
                    এতিম সহায়তা
                  </span>
                  <span className="text-[11px] font-bold text-[#0D5C3A] font-serif-bn">
                    সূরা আদ-দুহা ৯-১০
                  </span>
                </div>
                <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow border border-amber-200 mb-3 bg-slate-900">
                  <Image
                    src="/images/banners/orphan-support-poster.jpg"
                    alt="এতিম ও অসহায় শিক্ষার্থীদের সহায়তা করুন"
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <p className="text-xs text-slate-700 leading-snug font-serif-bn text-center font-medium">
                  একটি দান, একটি এতিম শিক্ষার্থীর উজ্জ্বল ভবিষ্যৎ গড়তে পারে
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-2">
                <Link
                  href="/donate"
                  className="w-full bg-[#0D5C3A] hover:bg-[#063321] text-white py-2.5 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
                >
                  <Heart className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>এতিমখানায় অনুদান দিন</span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
