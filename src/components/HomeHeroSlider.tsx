"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, Award, GraduationCap } from "lucide-react";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  badge: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
}

const slides: Slide[] = [
  {
    image: "/images/banners/hero-admission-banner.jpg",
    badge: "প্রতিষ্ঠিত: ২০২১ ইং • ঐতিহ্যবাহী দ্বীনি বিদ্যাপীঠ",
    title: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
    subtitle: "ইলম, আমল ও আদর্শের সমন্বয়ে দ্বীনি শিক্ষা। কুরআন-সুন্নাহর বিশুদ্ধ জ্ঞান ও নৈতিক চরিত্র গঠন।",
    primaryBtnText: "ভর্তি তথ্য ও আবেদন",
    primaryBtnLink: "/admission",
    secondaryBtnText: "মাদরাসা পরিচিতি",
    secondaryBtnLink: "/about",
  },
  {
    image: "/images/banners/admission-notice-poster.jpg",
    badge: "নতুন শিক্ষাবর্ষে ভর্তি চলছে",
    title: "নূরানী থেকে হিফজ ও কিতাব বিভাগে ভর্তি",
    subtitle: "আপনার সন্তানের জন্য একটি নিরাপদ, সুশৃঙ্খল ও দ্বীনি শিক্ষার আদর্শ পরিবেশ। সীমিত আসন!",
    primaryBtnText: "অনলাইনে ভর্তি ফরম",
    primaryBtnLink: "/admission",
    secondaryBtnText: "জরুরি যোগাযোগ",
    secondaryBtnLink: "/contact",
  },
  {
    image: "/images/banners/islamic-mahfil-banner.png",
    badge: "দ্বীনি শিক্ষা • আত্মশুদ্ধি • ইসলামী জীবন গঠন",
    title: "বার্ষিক ইসলামী মাহফিল ও দ্বীনি সম্মেলন",
    subtitle: "কুরআন তিলাওয়াত, তাফসীর, বয়ান ও বিশেষ দুআ মাহফিল। আসুন দ্বীনের আলো সমাজে ছড়িয়ে দিই।",
    primaryBtnText: "ইভেন্ট ও মাহফিল সূচি",
    primaryBtnLink: "/events",
    secondaryBtnText: "ক্যালেন্ডার দেখুন",
    secondaryBtnLink: "/calendar",
  },
  {
    image: "/images/banners/donation-lillah-boarding-banner.jpg",
    badge: "সদকায়ে জারিয়া • একটি দান, অসংখ্য সওয়াবের পথ",
    title: "দান, সদকা ও লিল্লাহ বোর্ডিং তহবিল",
    subtitle: "এতিম ও অসহায় শিক্ষার্থীদের খাদ্য, আবাসন ও চিকিৎসা সহায়তায় আপনার যাকাত ও সদকা দান করুন।",
    primaryBtnText: "অনলাইনে দান করুন",
    primaryBtnLink: "/donate",
    secondaryBtnText: "লিল্লাহ বোর্ডিং বিবরণ",
    secondaryBtnLink: "/donate",
  },
  {
    image: "/images/banners/orphan-support-poster.jpg",
    badge: "সূরা আদ-দুহা ৯-১০ • এতিমের পাশে দাঁড়ান",
    title: "এতিম ও অসহায় শিক্ষার্থীদের সহায়তা করুন",
    subtitle: "একটি দান, একটি শিক্ষার্থীর উজ্জ্বল ভবিষ্যৎ গড়তে পারে। শতভাগ আমানতদারিতার সাথে বণ্টন।",
    primaryBtnText: "এতিম ফান্ডে দান",
    primaryBtnLink: "/donate",
    secondaryBtnText: "ভেরিফাইড রিসিট",
    secondaryBtnLink: "/donate",
  },
  {
    image: "/images/banners/nurani-najera-hifz-banner.png",
    badge: "আন্তর্জাতিক মানের হিফজ ও বুনিয়াদি শিক্ষা",
    title: "নূরানী, নাজেরা ও হিফজুল কুরআন বিভাগ",
    subtitle: "সহীহ তাজবীদ, কায়দা-নুরানী এবং অভিজ্ঞ হাফেজ ও ক্বারী সাহেবদের নিবিড় তত্ত্বাবধানে ৩০ পারা হিফজ।",
    primaryBtnText: "বিভাগীয় তথ্য দেখুন",
    primaryBtnLink: "/academic",
    secondaryBtnText: "ভর্তি নির্দেশিকা",
    secondaryBtnLink: "/admission",
  },
  {
    image: "/images/banners/kitab-department-banner.png",
    badge: "দারসে নিজামী ও উচ্চতর ইসলামি শিক্ষা",
    title: "কিতাব বিভাগ ও সুসংগঠিত পাঠক্রম",
    subtitle: "আকীদা, ফিকহ, আরবি ভাষা, সহীহ বুখারী ও মুসলিমসহ প্রামাণ্য হাদিস ও তাফসিরের সার্বিক শিক্ষা।",
    primaryBtnText: "কিতাব বিভাগ বিস্তারিত",
    primaryBtnLink: "/academic",
    secondaryBtnText: "অনলাইন রেজাল্ট",
    secondaryBtnLink: "/results",
  },
  {
    image: "/images/banners/official-notice-banner.png",
    badge: "সর্বশেষ প্রাতিষ্ঠানিক প্রজ্ঞাপন",
    title: "অফিসিয়াল নোটিশ বোর্ড ও সার্কুলার",
    subtitle: "মাদরাসার ছুটির তালিকা, পরীক্ষার ফলাফল, ভর্তি বিজ্ঞপ্তি এবং প্রশাসনিক নির্দেশনা সার্বক্ষণিক হালনাগাদ।",
    primaryBtnText: "সকল নোটিশ দেখুন",
    primaryBtnLink: "/notices",
    secondaryBtnText: "সার্কুলার আর্কাইভ",
    secondaryBtnLink: "/notices",
  },
];

export default function HomeHeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] md:h-[480px] lg:h-[520px] overflow-hidden rounded-lg shadow-md border border-slate-200 bg-slate-900 group">
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          {/* Slide Background Image */}
          <div className="relative w-full h-full">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover object-center"
              priority={idx === 0}
            />
            {/* Gradient Overlay for high readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />
            <div className="absolute inset-0 bg-[#0d4a2b]/20 mix-blend-multiply" />
          </div>

          {/* Slide Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 md:p-10 text-white z-20">
            <span className="inline-block bg-[#0D5C3A] text-amber-300 text-xs sm:text-sm font-semibold px-3 py-1 rounded-full mb-2.5 border border-amber-400/30 shadow-sm">
              {slide.badge}
            </span>
            {idx === 0 ? (
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-snug drop-shadow-md mb-2">
                {slide.title}
              </h1>
            ) : (
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-snug drop-shadow-md mb-2">
                {slide.title}
              </h2>
            )}
            <p className="text-xs sm:text-sm md:text-base text-slate-200 max-w-2xl leading-relaxed mb-4 line-clamp-2 sm:line-clamp-none drop-shadow">
              {slide.subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={slide.primaryBtnLink}
                className="bg-[#D4AF37] hover:bg-amber-500 text-slate-950 font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md"
              >
                <span>{slide.primaryBtnText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={slide.secondaryBtnLink}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 text-white font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded text-xs sm:text-sm transition flex items-center gap-1.5"
              >
                <span>{slide.secondaryBtnText}</span>
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Slider Controls */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/30 flex items-center justify-center transition opacity-0 group-hover:opacity-100 cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/30 flex items-center justify-center transition opacity-0 group-hover:opacity-100 cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-3 right-5 z-20 flex items-center gap-1.5">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-full ${
              idx === current
                ? "w-6 h-2 bg-[#D4AF37]"
                : "w-2 h-2 bg-white/60 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
