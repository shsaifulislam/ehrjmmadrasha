import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Users, GraduationCap, MapPin, Phone, Mail, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "আমাদের সম্পর্কে | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
  description:
    "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা (Eliotganj Hazi Rohmatollah Jamiria Madrasha) কুমিল্লা জেলার দাউদকান্দি উপজেলার ইলিয়টগঞ্জে অবস্থিত একটি দ্বীনি ও আধুনিক শিক্ষার সমন্বিত ইসলামী শিক্ষা প্রতিষ্ঠান। ৫টি অফিশিয়াল বিভাগ: নূরানী, নাযেরা, হিফজ, কিতাব ও তাখাস্সুস।",
  openGraph: {
    title: "আমাদের সম্পর্কে | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
    description:
      "ইলমে দ্বীন ও আধুনিক শিক্ষার সমন্বয়ে প্রতিষ্ঠিত একটি আদর্শ বিদ্যাপীঠ। কুমিল্লা জেলার দাউদকান্দি উপজেলার ইলিয়টগঞ্জে অবস্থিত।",
    url: "https://ehrjmadrasha.edu.bd/about",
    siteName: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
    images: [
      {
        url: "/images/logo.png",
        width: 500,
        height: 500,
        alt: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার লোগো",
      },
    ],
    locale: "bn_BD",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header Nav */}
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
                জমিরীয়া মাদ্রাসা (স্থাপিত: ২০২১)
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

      <main className="max-w-4xl mx-auto px-4 py-10 sm:py-12 space-y-8">
        <div className="border-b pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            আমাদের সম্পর্কে (About Us)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার ইতিহাস ও একাডেমিক পরিচিতি
          </p>
        </div>

        {/* Institution Intro Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 sm:p-8 space-y-6 shadow-sm">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
            <strong>ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা</strong> (Eliotganj Hazi Rohmatollah Jamiria Madrasha) কুমিল্লা জেলার দাউদকান্দি উপজেলার ইলিয়টগঞ্জে অবস্থিত একটি ঐতিহ্যবাহী দ্বীনি ও আধুনিক শিক্ষার সমন্বিত প্রতিষ্ঠান। ইলমে দ্বীন শিক্ষা প্রচারের পাশাপাশি তরুণ প্রজন্মকে নৈতিক, আত্মিক ও একাডেমিক শিক্ষায় সুশিক্ষিত করে গড়ে তুলতে প্রতিষ্ঠানটি নিবেদিতপ্রাণ।
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 rounded-lg p-5 text-center border border-emerald-200 dark:border-emerald-800">
              <BookOpen className="h-8 w-8 mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
              <p className="font-bold text-emerald-900 dark:text-emerald-200 text-base">৫টি অফিশিয়াল বিভাগ</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">নূরানী, নাযেরা, হিফজ, কিতাব ও তাখাস্সুস</p>
            </div>
            <div className="bg-amber-50/70 dark:bg-amber-950/40 rounded-lg p-5 text-center border border-amber-200 dark:border-amber-800">
              <GraduationCap className="h-8 w-8 mx-auto text-amber-600 dark:text-amber-400 mb-2" />
              <p className="font-bold text-amber-900 dark:text-amber-200 text-base">৫০০+ সুশিক্ষিত ছাত্র</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">নিয়মিত অধ্যয়নরত শিক্ষার্থী</p>
            </div>
            <div className="bg-blue-50/70 dark:bg-blue-950/40 rounded-lg p-5 text-center border border-blue-200 dark:border-blue-800">
              <Users className="h-8 w-8 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
              <p className="font-bold text-blue-900 dark:text-blue-200 text-base">২৫+ দক্ষ শিক্ষক</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">অভিজ্ঞ আলিম ও হাফেজ</p>
            </div>
          </div>
        </div>

        {/* Principal Message Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-emerald-800 dark:text-emerald-400 border-b pb-3">
            অধ্যক্ষের বাণী
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start pt-2">
            <div className="shrink-0 h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border-2 border-emerald-600 shadow-md relative bg-slate-100">
              <Image
                src="/images/principal.jpg"
                alt="মাওলানা মহা. আবুল কালাম সরকার, অধ্যক্ষ, ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা"
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="space-y-3 text-center sm:text-left">
              <blockquote className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic border-l-4 border-emerald-600 pl-4 text-left">
                &ldquo;বিসমিল্লাহির রাহমানির রাহিম। আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহি ওয়া বারাকাতুহু। আমাদের লক্ষ্য হলো সঠিক আকিদা ও আমলের সাথে ইলমে দ্বীন এবং আধুনিক শিক্ষা প্রদান করা, যাতে আমাদের ছাত্ররা দেশ ও জাতির জন্য কল্যাণের আলোকবর্তিকা হতে পারে।&rdquo;
              </blockquote>
              <div>
                <p className="font-bold text-base text-slate-900 dark:text-slate-100">
                  মাওলানা মহা. আবুল কালাম সরকার
                </p>
                <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-semibold">
                  অধ্যক্ষ, ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-emerald-800 dark:text-emerald-400 border-b pb-3">
            যোগাযোগের ঠিকানা
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">মাদ্রাসার অবস্থান:</p>
                <p>ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">যোগাযোগ নম্বর:</p>
                <p className="font-mono">01845-162664, 01826-416696, 01949-091911</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
