import React from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PrayerTimesWidget from "@/components/PrayerTimesWidget";
import Footer from "@/components/Footer";
import prisma from "@/lib/prisma";
import { INSTITUTION_INFO } from "@/lib/constants";
import {
  BookOpen,
  GraduationCap,
  Users,
  Award,
  Heart,
  ChevronRight,
  Calendar,
  Building2,
  FileText,
  Shield,
  PhoneCall,
  Search,
  Camera,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { getCmsEvents, getCmsFaqs, getHomepageConfig } from "@/lib/cms";

export const revalidate = 60;

export default async function HomePage() {
  const [notices, principalProfile, classesCount, currentSession] = await Promise.all([
    prisma.notice.findMany({
      where: { isPublished: true, audience: "PUBLIC", status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
    prisma.principalProfile.findFirst(),
    prisma.jamatClass.count({ where: { isActive: true } }),
    prisma.academicSession.findFirst({ where: { isCurrent: true } }),
  ]);

  const events = getCmsEvents(true);
  const faqs = getCmsFaqs(true);
  const homepageConfig = getHomepageConfig();

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F8F3]">
      {/* 1. Live Prayer Times Widget */}
      <PrayerTimesWidget />

      {/* 2. Institutional Navigation */}
      <Navbar />

      {/* 3. Hero Section with Islamic Arabesque Background */}
      <section className="relative bg-gradient-to-b from-[#0D5C3A] via-[#0A4B2F] to-[#083B25] text-white py-16 sm:py-24 px-4 overflow-hidden border-b-4 border-[#C59B27]">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C59B27_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          {/* Logo Badge & Bismillah */}
          <div className="w-20 h-20 rounded-full bg-white border-2 border-[#C59B27] mx-auto mb-4 overflow-hidden shadow-xl flex items-center justify-center">
            <Image
              src="/images/logo.jpg"
              alt="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              priority
            />
          </div>

          <div className="font-arabic text-[#C59B27] text-xl sm:text-2xl mb-3 tracking-wide font-normal">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>

          <div className="inline-flex items-center gap-2 bg-[#083B25]/90 border border-[#C59B27]/50 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-200 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {homepageConfig.admissionAnnouncementBn || `শিক্ষাবর্ষ ${currentSession?.name || "২০২৫-২০২৬"} ভর্তি চলছে • স্থাপিত: ${INSTITUTION_INFO.established}ইং`}
          </div>

          {/* Main Headline */}
          <h1 className="font-display font-bold text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-tight max-w-4xl mx-auto mb-4">
            {INSTITUTION_INFO.nameBn}
          </h1>

          <p className="text-emerald-100 text-sm sm:text-base md:text-lg max-w-3xl mx-auto mb-8 leading-relaxed">
            কুরআন-সুন্নাহর সঠিক প্রচার ও চরিত্রবান আদর্শ নাগরিক গড়ার একটি অন্যতম শ্রেষ্ঠ মারকাজ। নূরানী, হিফজুল কুরআন, কিতাব বিভাগ ও এতিমখানা কমপ্লেক্স।
            <br />
            <span className="text-[#C59B27] text-xs sm:text-sm font-semibold">
              {INSTITUTION_INFO.addressBn}
            </span>
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/admission"
              className="flex items-center gap-2 bg-[#C59B27] hover:bg-amber-500 text-[#0B1914] px-6 py-3.5 rounded-md font-bold text-sm sm:text-base shadow-lg transition transform hover:-translate-y-0.5"
            >
              <GraduationCap className="w-5 h-5" />
              ভর্তি আবেদন ফরম (Online Admission)
            </Link>

            <Link
              href="/login"
              className="flex items-center gap-2 bg-white text-[#0D5C3A] hover:bg-emerald-50 px-6 py-3.5 rounded-md font-bold text-sm sm:text-base shadow-lg transition transform hover:-translate-y-0.5"
            >
              <Search className="w-5 h-5 text-[#C59B27]" />
              রেজাল্ট অনুসন্ধান (পাসওয়ার্ড ছাড়াই)
            </Link>

            <Link
              href="/#donate"
              className="flex items-center gap-2 bg-[#0D5C3A] hover:bg-[#158052] text-white px-5 py-3.5 rounded-md font-semibold text-sm border border-[#C59B27]/60 shadow transition"
            >
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
              দান ও যাকাত ফান্ড
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Four Key Institutional Impact Counters */}
      <section className="py-8 px-4 -mt-8 relative z-20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-md border-l-4 border-l-[#0D5C3A] flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">মোট শিক্ষার্থী</span>
              <Users className="w-5 h-5 text-[#0D5C3A]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#0B1914]">১,৪৫০+</div>
            <span className="text-[11px] text-gray-400 mt-1">নূরানী, হিফজ ও কিতাব বিভাগ</span>
          </div>

          <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-md border-l-4 border-l-[#C59B27] flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">সনদপ্রাপ্ত হাফেজ</span>
              <Award className="w-5 h-5 text-[#C59B27]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#0B1914]">৭২০+</div>
            <span className="text-[11px] text-gray-400 mt-1">দস্তারবন্দী ও সম্মাননা প্রাপ্ত</span>
          </div>

          <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-md border-l-4 border-l-[#0D5C3A] flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">উস্তাদ ও শিক্ষক</span>
              <BookOpen className="w-5 h-5 text-[#0D5C3A]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#0B1914]">৪২ জন</div>
            <span className="text-[11px] text-gray-400 mt-1">অভিজ্ঞ মুহাদ্দিস ও ক্বারীগণ</span>
          </div>

          <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-md border-l-4 border-l-[#C59B27] flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">লিল্লাহ বোর্ডিং এতিম</span>
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#0B1914]">৩২০+</div>
            <span className="text-[11px] text-gray-400 mt-1">১০০% ফ্রি খাদ্য, আবাসন ও বস্ত্র</span>
          </div>
        </div>
      </section>

      {/* 5. Main Content: Real Photos Gallery (ক্যাম্পাস ও শিক্ষার্থী গ্যালারি) */}
      <section className="py-10 px-4 max-w-6xl mx-auto w-full" id="gallery">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold text-[#0D5C3A] bg-[#E7F3EC] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit mx-auto">
            <Camera className="w-3.5 h-3.5" />
            ক্যাম্পাস ও শিক্ষার্থী গ্যালারি
          </span>
          <h2 className="text-2xl font-bold text-[#0B1914] mt-2">
            ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার প্রাত্যহিক পরিবেশ
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Photo 1: Students in Class */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md transition">
            <div className="relative h-56 w-full">
              <Image
                src="/images/students-class.jpg"
                alt="মাদরাসার শ্রেণিকক্ষে শিক্ষার্থীরা"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-3.5 bg-white">
              <h3 className="font-bold text-xs text-gray-800">শ্রেণিকক্ষে মাদরাসা ইউনিফর্মে শিক্ষার্থীরা</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">ডিজিটাল আইডি কার্ড ও সুশৃঙ্খল পাঠদান পরিবেশ</p>
            </div>
          </div>

          {/* Photo 2: Students Celebration */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md transition">
            <div className="relative h-56 w-full">
              <Image
                src="/images/students-celebration.jpg"
                alt="কুরআনের বাগানে আপনাকে স্বাগতম - মাদরাসার ছাত্ররা"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-3.5 bg-white">
              <h3 className="font-bold text-xs text-gray-800">জাতীয় পতাকা সহ মাদরাসার ছাত্ররা</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">"কুরআনের বাগানে আপনাকে স্বাগতম" প্রাতিষ্ঠানিক প্রাঙ্গণ</p>
            </div>
          </div>

          {/* Photo 3: Student with Official Backdrop */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md transition">
            <div className="relative h-56 w-full">
              <Image
                src="/images/student-banner.jpg"
                alt="মাদরাসার অফিসিয়াল ব্যানারের সামনে শিক্ষার্থী"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-3.5 bg-white">
              <h3 className="font-bold text-xs text-gray-800">মাদরাসার অফিসিয়াল ব্যানার ও লোগো</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">স্থাপিত: ২০২১ইং — ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Notices & Principal / Muhtamim's Official Message */}
      <section className="py-10 px-4 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8" id="principal-section">
        {/* Left Column (2 Cols): Live Notice Board */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm" id="notices">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0D5C3A]" />
              <h2 className="text-lg font-bold text-[#0B1914]">নোটিশ বোর্ড ও জরুরি ঘোষণা</h2>
            </div>
            <span className="text-xs text-[#0D5C3A] font-semibold bg-[#E7F3EC] px-2.5 py-1 rounded">
              লাইভ আপডেট
            </span>
          </div>

          <div className="space-y-3.5">
            {notices.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">বর্তমানে কোনো নোটিশ নেই।</p>
            ) : (
              notices.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-md border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {n.isUrgent && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          জরুরি
                        </span>
                      )}
                      <span className="text-xs font-semibold text-[#0D5C3A]">[{n.category}]</span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(n.publishedAt).toLocaleDateString("bn-BD")}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-[#0B1914]">{n.titleBn}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                      {n.contentBn}
                    </p>
                  </div>
                  <Link
                    href={`/admission`}
                    className="self-start sm:self-center text-xs text-[#0D5C3A] font-semibold flex items-center gap-1 hover:underline whitespace-nowrap bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200"
                  >
                    বিস্তারিত
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Real Principal Message with Photo */}
        <div className="bg-[#083B25] text-white rounded-lg p-6 shadow-sm flex flex-col justify-between border-t-4 border-[#C59B27]">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-white border-2 border-[#C59B27] overflow-hidden flex-shrink-0 shadow">
                <Image
                  src="/images/principal.jpg"
                  alt={INSTITUTION_INFO.principal}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                  {INSTITUTION_INFO.principal}
                </h3>
                <p className="text-xs text-[#C59B27] font-medium mt-0.5">
                  মুহতামিম ও অধ্যক্ষ
                </p>
                <p className="text-[10px] text-emerald-300">
                  ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
                </p>
              </div>
            </div>

            <div className="bg-[#0B1914]/70 p-4 rounded border border-emerald-800 text-xs text-emerald-100 italic leading-relaxed mb-4">
              "{principalProfile?.officialMessageBn || "বিসমিল্লাহির রাহমানির রাহিম। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কুরআন-সুন্নাহর সঠিক প্রচার ও চরিত্রবান আদর্শ নাগরিক গড়ার একটি অন্যতম শ্রেষ্ঠ মারকাজ। আমাদের লক্ষ্য শুধু কিতাবি জ্ঞান নয়, বরং আমলে পরিপূর্ণ এক আদর্শ প্রজন্ম তৈরি করা।"}"
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-800/80 flex items-center justify-between text-xs text-gray-300">
            <span className="flex items-center gap-1 text-[#C59B27]">
              <Shield className="w-3.5 h-3.5" />
              মুহতামিম দপ্তর
            </span>
            <span className="font-arabic text-amber-200">الجامعة الإسلامية</span>
          </div>
        </div>
      </section>

      {/* 7. Academic Jamats & Curriculum (শিক্ষা বিভাগসমূহ) */}
      <section className="py-12 px-4 bg-white border-y border-[#E2E8F0]" id="departments">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#0D5C3A] bg-[#E7F3EC] px-3 py-1 rounded-full uppercase tracking-wider">
              দ্বীনি ও আধুনিক শিক্ষাক্রম
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1914] mt-3">
              শিক্ষা বিভাগসমূহ ও শিক্ষা স্তর ({classesCount} টি জামাত)
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              নূরানী মক্তব থেকে শুরু করে তাকমীল (দাওরায়ে হাদিস / মাস্টার্স সমমান) পর্যন্ত সুশৃঙ্খল পাঠদান
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#F9F8F3] p-6 rounded-lg border border-[#E2E8F0] hover:shadow-md transition">
              <div className="w-10 h-10 rounded bg-[#0D5C3A] text-white flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-[#C59B27]" />
              </div>
              <h3 className="font-bold text-base text-[#0B1914] mb-2">তাহফীজুল কুরআন (হিফজ বিভাগ)</h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                আন্তর্জাতিক মানের তাজবীদ ও মাখরাজ সহকারে পবিত্র কুরআন হিফজকরণ। অভিজ্ঞ হাফেজ ও ক্বারী সাহেবদের সার্বক্ষণিক তত্ত্বাবধান ও সবক-সবকী-আমোখতা মনিটরিং।
              </p>
              <ul className="text-xs space-y-1 text-gray-700">
                <li className="flex items-center gap-1.5">• নূরানী ও নাযেরা বিভাগ</li>
                <li className="flex items-center gap-1.5">• পূর্ণাঙ্গ ৩০ পারা হিফজুল কুরআন</li>
                <li className="flex items-center gap-1.5">• বার্ষিক পাগড়ী প্রদান ও সমাপনী সনদ</li>
              </ul>
            </div>

            <div className="bg-[#F9F8F3] p-6 rounded-lg border border-[#E2E8F0] hover:shadow-md transition">
              <div className="w-10 h-10 rounded bg-[#0D5C3A] text-white flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5 text-[#C59B27]" />
              </div>
              <h3 className="font-bold text-base text-[#0B1914] mb-2">কিতাব বিভাগ (দাওরায়ে হাদীস)</h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                মিযান, নাহবেমীর, হেদায়েতুন্নাহু, কাফিয়া, জালালাইন, মেশকাত থেকে দাওরায়ে হাদীস (মাস্টার্স সমমান) পর্যন্ত দরসে নেযামী পাঠ্যক্রম ও হাদিস-তাফসীর গবেষণা।
              </p>
              <ul className="text-xs space-y-1 text-gray-700">
                <li className="flex items-center gap-1.5">• সিহাহ সিত্তাহ এর পূর্ণাঙ্গ পাঠদান</li>
                <li className="flex items-center gap-1.5">• আরবি সাহিত্য ও ব্যাকরণ চর্চা</li>
                <li className="flex items-center gap-1.5">• ইসলামি আইন ও ফিক্বহ শাস্ত্র</li>
              </ul>
            </div>

            <div className="bg-[#F9F8F3] p-6 rounded-lg border border-[#E2E8F0] hover:shadow-md transition">
              <div className="w-10 h-10 rounded bg-[#0D5C3A] text-white flex items-center justify-center mb-4">
                <Heart className="w-5 h-5 text-[#C59B27]" />
              </div>
              <h3 className="font-bold text-base text-[#0B1914] mb-2">লিল্লাহ বোর্ডিং ও এতিমখানা</h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                অসহায়, এতিম ও দরিদ্র পরিবারের মেধাবী শিক্ষার্থীদের জন্য সম্পূর্ণ ফ্রি সুষম খাবার, আবাসন, চিকিৎসা এবং পাঠ্যপুস্তক সরবরাহ সুবিধা।
              </p>
              <ul className="text-xs space-y-1 text-gray-700">
                <li className="flex items-center gap-1.5">• শতভাগ শরীয়াহ সম্মত যাকাত তহবিল</li>
                <li className="flex items-center gap-1.5">• স্পন্সর-এ-চাইল্ড প্রোগ্রাম</li>
                <li className="flex items-center gap-1.5">• স্বচ্ছ ডিজিটাল ফান্ড হিসাব ও অডিট</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Online Zakat & Lilah Donation Section */}
      <section className="py-14 px-4 bg-gradient-to-b from-[#F9F8F3] to-[#F1EFE9]" id="donate">
        <div className="max-w-4xl mx-auto bg-white rounded-xl border-2 border-[#C59B27] p-8 shadow-lg text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-6 h-6 fill-red-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1914] mb-2">
            আপনার সদকা ও যাকাত দিয়ে এতিম ও তালিবুল ইলমদের পাশে দাঁড়ান
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto mb-8">
            {INSTITUTION_INFO.nameBn}-এর লিল্লাহ বোর্ডিং-এ ৩২০+ জন এতিম ও দরিদ্র শিক্ষার্থী সম্পূর্ণ বিনামূল্যে পড়াশোনা ও থাকা-খাওয়া করে।
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-8">
            <div className="bg-[#083B25] text-white p-4 rounded-lg border border-emerald-800">
              <span className="text-[#C59B27] text-xs font-bold block mb-1">ব্যাংক হিসাব (Bank Account):</span>
              <p className="text-sm font-semibold">ইসলামী ব্যাংক বাংলাদেশ লিমিটেড</p>
              <p className="text-xs text-gray-300">হাজী রহমত উল্লাহ মাদ্রাসা লিল্লাহ ফান্ড</p>
              <p className="font-mono text-emerald-300 text-sm font-bold mt-1">হিসাব নং: ২০৫০১৮৭৮৯০১২৩৪</p>
              <p className="text-[11px] text-gray-400">ইলিয়টগঞ্জ শাখা, কুমিল্লা</p>
            </div>

            <div className="bg-[#0B1914] text-white p-4 rounded-lg border border-emerald-900">
              <span className="text-[#C59B27] text-xs font-bold block mb-1">মোবাইল ব্যাংকিং (bKash / Nagad):</span>
              <p className="text-xs text-gray-300">বিকাশ (Personal): <span className="font-mono text-pink-300 font-bold">01845-162664</span></p>
              <p className="text-xs text-gray-300 mt-2">নগদ (Personal): <span className="font-mono text-orange-300 font-bold">01826-416696</span></p>
              <p className="text-[11px] text-gray-400 mt-2">অন্যান্য নম্বর: <span className="text-white font-mono">01949-091911</span></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admission"
              className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-6 py-2.5 rounded-md font-bold text-xs sm:text-sm transition shadow"
            >
              ভর্তি আবেদন ফরম দেখুন
            </Link>
            <a
              href={`tel:${INSTITUTION_INFO.primaryPhone}`}
              className="flex items-center gap-1.5 border border-[#0D5C3A] text-[#0D5C3A] hover:bg-[#0D5C3A] hover:text-white px-5 py-2.5 rounded-md font-semibold text-xs sm:text-sm transition"
            >
              <PhoneCall className="w-4 h-4" />
              কল করুন ({INSTITUTION_INFO.primaryPhone})
            </a>
          </div>
        </div>
      </section>

      {/* 9. Upcoming Events & Mahfil Section */}
      {events.length > 0 && (
        <section className="py-12 px-4 max-w-6xl mx-auto w-full" id="events">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold text-[#0D5C3A] bg-[#E7F3EC] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit mx-auto">
              <Calendar className="w-3.5 h-3.5" />
              আসন্ন অনুষ্ঠান ও সম্মেলন
            </span>
            <h2 className="text-2xl font-bold text-[#0B1914] mt-2">
              মাদরাসার বার্ষিক মাহফিল ও বিশেষ আয়োজন
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded">
                    {evt.category}
                  </span>
                  <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#0D5C3A]" />
                    {evt.eventDate}
                  </span>
                </div>
                <h3 className="font-bold text-base text-[#083B25]">{evt.titleBn}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{evt.descriptionBn}</p>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                  <span>স্থান: {evt.location}</span>
                  {evt.startTime && <span>সময়: {evt.startTime}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10. Frequently Asked Questions (FAQ) Section */}
      {faqs.length > 0 && (
        <section className="py-12 px-4 bg-white border-t border-[#E2E8F0]" id="faq">
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-xs font-bold text-[#0D5C3A] bg-[#E7F3EC] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit mx-auto">
                <HelpCircle className="w-3.5 h-3.5" />
                সাধারণ প্রশ্নোত্তর
              </span>
              <h2 className="text-2xl font-bold text-[#0B1914] mt-2">
                মাদরাসা সম্পর্কিত বহুল জিজ্ঞাসিত প্রশ্নসমূহ
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((f) => (
                <div
                  key={f.id}
                  className="bg-[#F9F8F3] p-5 rounded-xl border border-gray-200 hover:border-[#0D5C3A] transition space-y-2"
                >
                  <h3 className="font-bold text-sm text-[#083B25] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0D5C3A] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      ?
                    </span>
                    {f.questionBn}
                  </h3>
                  <p className="text-xs text-gray-700 leading-relaxed pl-7">{f.answerBn}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 11. Institutional Footer */}
      <Footer />
    </div>
  );
}
