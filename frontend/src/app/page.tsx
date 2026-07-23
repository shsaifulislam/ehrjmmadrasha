"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap, Users, BookOpen, CalendarDays, Phone, Mail, MapPin,
  Globe, Video, MessageCircle, ChevronRight, Heart, ArrowRight,
  Bell, ImageIcon, BarChart3, Download, UserPlus, Menu, X, Calendar, Loader2
} from "lucide-react";
import { usePublicNotices, usePublicGallery } from "@/hooks/useCms";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: noticeData, isLoading: loadingNotices } = usePublicNotices(undefined, 1);
  const { data: galleryData, isLoading: loadingGallery } = usePublicGallery(undefined, 1);

  const notices = noticeData?.notices?.slice(0, 3) || [];
  const galleryItems = galleryData?.items?.slice(0, 4) || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top Contact Bar */}
      <div className="bg-emerald-800 text-white text-[11px] sm:text-xs md:text-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5 font-mono shrink-0">
              <Phone className="h-3.5 w-3.5 text-amber-300 shrink-0" /> 01845-162664, 01826-416696
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-amber-300 shrink-0" /> info@ehrjmadrasha.edu.bd
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a href="https://www.facebook.com/ehrjmadrasda" target="_blank" rel="noreferrer" className="hover:text-amber-300 transition-colors" aria-label="Facebook">
              <Globe className="h-4 w-4" />
            </a>
            <a href="https://www.youtube.com/@ehrjmadrasha" target="_blank" rel="noreferrer" className="hover:text-amber-300 transition-colors" aria-label="YouTube">
              <Video className="h-4 w-4" />
            </a>
            <a href="https://whatsapp.com/channel/0029VbC30aF6buMF0LGPMp3F" target="_blank" rel="noreferrer" className="hover:text-amber-300 transition-colors" aria-label="WhatsApp Channel">
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Header / Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 shadow-sm border-2 border-emerald-600 bg-white p-0.5">
              <img src="/images/logo.png" alt="ইলিয়টগঞ্জ মাদ্রাসা লোগো" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base sm:text-lg font-bold text-emerald-800 dark:text-emerald-400">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ</h1>
              <p className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-500 font-semibold">জমিরীয়া মাদ্রাসা (স্থাপিত: ২০২১)</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { href: "/", label: "হোম" },
              { href: "/about", label: "আমাদের সম্পর্কে" },
              { href: "/admission", label: "ভর্তি" },
              { href: "/results", label: "ফলাফল" },
              { href: "/notices", label: "নোটিশ" },
              { href: "/gallery", label: "গ্যালারি" },
              { href: "/downloads", label: "ডাউনলোড" },
              { href: "/contact", label: "যোগাযোগ" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-400 rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
            >
              লগইন
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu-drawer"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div id="mobile-menu-drawer" className="lg:hidden bg-white dark:bg-slate-900 border-b px-4 py-3 space-y-2">
            {[
              { href: "/", label: "হোম" },
              { href: "/about", label: "আমাদের সম্পর্কে" },
              { href: "/admission", label: "ভর্তি" },
              { href: "/results", label: "ফলাফল" },
              { href: "/notices", label: "নোটিশ" },
              { href: "/gallery", label: "গ্যালারি" },
              { href: "/downloads", label: "ডাউনলোড" },
              { href: "/contact", label: "যোগাযোগ" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-slate-700 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 lg:py-28">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold mb-4 border border-amber-400/30">
                <span>اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ</span> • <span>পড় তোমার প্রভুর নামে</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight text-white drop-shadow-sm">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ<br />
                জমিরীয়া মাদ্রাসা
              </h2>
              <p className="text-emerald-100 text-base sm:text-lg mb-2 font-mono tracking-wide">
                Eliotganj Hazi Rohmatollah Jamiria Madrasha
              </p>
              <p className="text-emerald-200 text-sm sm:text-base mb-8 max-w-xl leading-relaxed">
                ইলমে দ্বীন ও আধুনিক শিক্ষার সুন্দর সমন্বয়ে প্রতিষ্ঠিত একটি আদর্শ বিদ্যাপীঠ।
                নূরানী, হিফজ ও কিতাব বিভাগে সুশিক্ষায় নিবেদিত।
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/admission"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg transition-colors shadow-lg"
                >
                  ভর্তি আবেদন করুন
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/40 hover:bg-white/10 text-white font-medium rounded-lg transition-colors"
                >
                  যোগাযোগ করুন
                </Link>
              </div>
            </div>
            {/* Logo Display in Hero */}
            <div className="lg:col-span-4 hidden lg:flex justify-center items-center">
              <div className="relative p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
                <div className="h-56 w-56 rounded-full overflow-hidden bg-white p-3 shadow-inner border-4 border-amber-400">
                  <img src="/images/logo.png" alt="Madrasha Emblem" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white dark:bg-slate-900 border-b">
        <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="মোট ছাত্র" value="৫০০+" icon={GraduationCap} color="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" />
            <StatCard label="মোট শিক্ষক" value="২৫+" icon={Users} color="bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800" />
            <StatCard label="বিভাগ" value="৩টি" icon={BookOpen} color="bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800" />
            <StatCard label="প্রতিষ্ঠাকাল" value="২০২১" icon={CalendarDays} color="bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800" />
          </div>
        </div>
        <div className="py-8" />
      </section>

      {/* Madrasha Introduction */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-emerald-800 dark:text-emerald-400 mb-6">আমাদের সম্পর্কে</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা একটি ঐতিহ্যবাহী ইসলামী শিক্ষা প্রতিষ্ঠান।
              এই মাদ্রাসা ইলমে দ্বীনের পাশাপাশি আধুনিক শিক্ষার সমন্বয়ে শিক্ষার্থীদের যোগ্য ও দক্ষ
              নাগরিক হিসেবে গড়ে তোলার লক্ষ্যে কাজ করে যাচ্ছে। আমাদের অভিজ্ঞ শিক্ষকমণ্ডলী এবং
              সুবিন্যস্ত পাঠ্যক্রম শিক্ষার্থীদের ইহকালীন ও পরকালীন সাফল্যের দিকে পরিচালিত করে।
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-1 mt-6 text-emerald-700 dark:text-emerald-400 font-medium hover:underline text-sm"
            >
              বিস্তারিত পড়ুন <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-2xl sm:text-3xl font-bold text-emerald-800 dark:text-emerald-400 text-center mb-10">আমাদের বিভাগসমূহ</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <DeptCard name="নূরানী বিভাগ" desc="কুরআন শিক্ষা ও প্রাথমিক ইসলামী শিক্ষা। ছোটদের জন্য নূরানী পদ্ধতিতে সহজ ও মজার কুরআন শিক্ষা।" color="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20" iconBg="bg-emerald-600" />
            <DeptCard name="হিফজ বিভাগ" desc="সম্পূর্ণ কুরআন মুখস্থ করার বিশেষ বিভাগ। অভিজ্ঞ হাফেজদের তত্ত্বাবধানে সুশৃঙ্খল হিফজ প্রোগ্রাম।" color="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20" iconBg="bg-amber-600" />
            <DeptCard name="কিতাব বিভাগ" desc="ইসলামী শিক্ষার উচ্চতর বিভাগ। ফিকহ, হাদিস, তাফসির, আরবি সাহিত্য ও ইসলামী জ্ঞান-বিজ্ঞান।" color="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20" iconBg="bg-blue-600" />
          </div>
        </div>
      </section>
      {/* Principal Message */}
      <section className="py-16 bg-slate-100 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-emerald-800 dark:text-emerald-400 text-center mb-8">অধ্যক্ষের বাণী</h3>
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <div className="shrink-0 h-28 w-28 rounded-full overflow-hidden border-2 border-emerald-600 shadow-md">
                  <img src="/images/principal.jpg" alt="মাওলানা মহা. আবুল কালাম সরকার" className="object-cover w-full h-full" />
                </div>
                <div>
                  <blockquote className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed italic border-l-4 border-emerald-600 pl-4">
                    &ldquo;বিসমিল্লাহির রাহমানির রাহিম। আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহি ওয়া বারাকাতুহু। 
                    ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা ইলমে দ্বীন ও আধুনিক শিক্ষার সুন্দর সমন্বয়ে শিক্ষার আলো ছড়িয়ে দিতে নিরলসভাবে কাজ করে যাচ্ছে। আমাদের লক্ষ্য প্রতিটি সন্তানকে তাকওয়া সম্পন্ন, সৎ ও দক্ষ নাগরিক হিসেবে গড়ে তোলা।&rdquo;
                  </blockquote>
                  <div className="mt-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-base">মাওলানা মহা. আবুল কালাম সরকার</p>
                    <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-semibold">অধ্যক্ষ, ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Notices & Gallery Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Live Notices */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                  <Bell className="h-6 w-6 text-primary" />
                  সাম্প্রতিক নোটিশ
                </h3>
                <Link href="/notices" className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold">
                  সব নোটিশ দেখুন <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {loadingNotices ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 border p-4 rounded-lg shadow-sm animate-pulse space-y-2">
                      <div className="flex justify-between">
                        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                      <div className="h-5 w-3/4 bg-slate-300 dark:bg-slate-700 rounded" />
                      <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  ))}
                </div>
              ) : !notices.length ? (
                <EmptyState
                  icon={Bell}
                  title="বর্তমানে কোনো নতুন নোটিশ নেই"
                  description="নতুন নোটিশ প্রকাশিত হলে এখানে দেখা যাবে।"
                />
              ) : (
                <div className="space-y-3">
                  {notices.map((notice) => (
                    <div key={notice.id} className="bg-white dark:bg-slate-900 border p-4 rounded-lg shadow-sm hover:border-emerald-400 transition-colors">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <Badge variant="outline">{notice.type}</Badge>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(notice.createdAt).toLocaleDateString("bn-BD")}
                        </span>
                      </div>
                      <h4 className="font-bold text-base line-clamp-1">{notice.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{notice.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Gallery */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                  <ImageIcon className="h-6 w-6 text-primary" />
                  ফটো গ্যালারি
                </h3>
                <Link href="/gallery" className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold">
                  গ্যালারি দেখুন <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {loadingGallery ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-video rounded-lg border bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : !galleryItems.length ? (
                <EmptyState
                  icon={ImageIcon}
                  title="গ্যালারিতে কোনো ছবি যুক্ত করা হয়নি"
                  description="নতুন ছবি আপলোড করা হলে এখানে দেখা যাবে।"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {galleryItems.map((img) => (
                    <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden border bg-slate-100 dark:bg-slate-900 group">
                      <img src={img.imageUrl} alt={img.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-white text-xs font-semibold truncate">{img.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-emerald-50/60 dark:bg-emerald-950/20 border-y">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-xl sm:text-2xl font-bold text-emerald-800 dark:text-emerald-400 text-center mb-8">দ্রুত সেবা</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickLink href="/admission" label="ভর্তি আবেদন" icon={UserPlus} />
            <QuickLink href="/results" label="ফলাফল দেখুন" icon={BarChart3} />
            <QuickLink href="/downloads" label="ডাউনলোড সেন্টার" icon={Download} />
            <QuickLink href="/contact" label="যোগাযোগ করুন" icon={Phone} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-bold mb-4 text-amber-300">ইলিয়টগঞ্জ মাদ্রাসা</h4>
              <p className="text-emerald-200 text-sm leading-relaxed">
                ইলমে দ্বীন ও আধুনিক শিক্ষার সমন্বয়ে একটি আদর্শ ইসলামী শিক্ষা প্রতিষ্ঠান।
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4 text-amber-300">দ্রুত লিংক</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { href: "/about", label: "আমাদের সম্পর্কে" },
                  { href: "/admission", label: "ভর্তি" },
                  { href: "/results", label: "ফলাফল" },
                  { href: "/notices", label: "নোটিশ" },
                  { href: "/gallery", label: "গ্যালারি" },
                  { href: "/downloads", label: "ডাউনলোড" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-emerald-200 hover:text-white transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4 text-amber-300">যোগাযোগ</h4>
              <ul className="space-y-3 text-sm text-emerald-200">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-amber-300" />
                  ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-amber-300" />
                  01845-162664, 01826-416696
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-amber-300" />
                  info@ehrjmadrasha.edu.bd
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4 text-amber-300">সোশ্যাল মিডিয়া</h4>
              <div className="flex gap-3">
                <a href="https://www.facebook.com/ehrjmadrasda" target="_blank" rel="noreferrer" className="h-10 w-10 rounded-full bg-emerald-800 flex items-center justify-center hover:bg-emerald-700 transition-colors" aria-label="Facebook">
                  <Globe className="h-5 w-5" />
                </a>
                <a href="https://www.youtube.com/@ehrjmadrasha" target="_blank" rel="noreferrer" className="h-10 w-10 rounded-full bg-emerald-800 flex items-center justify-center hover:bg-emerald-700 transition-colors" aria-label="YouTube">
                  <Video className="h-5 w-5" />
                </a>
                <a href="https://wa.me/8801845162664?text=আমি%20মাদ্রাসার%20ওয়েবসাইট%20থেকে%20সহায়তা%20চাই" target="_blank" rel="noreferrer" className="h-10 w-10 rounded-full bg-emerald-800 flex items-center justify-center hover:bg-emerald-700 transition-colors" aria-label="WhatsApp">
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-emerald-900">
          <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-emerald-400">
            © ২০২৬ ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা। সর্বস্বত্ব সংরক্ষিত।
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/8801845162664?text=আমি%20মাদ্রাসার%20ওয়েবসাইট%20থেকে%20সহায়তা%20চাই"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-110"
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof GraduationCap; color: string }) {
  return (
    <div className={`${color} border rounded-xl p-5 text-center shadow-sm`}>
      <Icon className="h-8 w-8 mx-auto mb-2 opacity-80" />
      <p className="text-2xl sm:text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  );
}

function DeptCard({ name, desc, color, iconBg }: { name: string; desc: string; color: string; iconBg: string }) {
  return (
    <div className={`${color} border rounded-xl p-6 hover:shadow-md transition-shadow`}>
      <div className={`${iconBg} h-12 w-12 rounded-lg flex items-center justify-center mb-4 shadow-sm`}>
        <BookOpen className="h-6 w-6 text-white" />
      </div>
      <h4 className="text-lg font-bold mb-2 text-slate-900 dark:text-slate-100">{name}</h4>
      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof GraduationCap }) {
  return (
    <Link href={href} className="bg-white dark:bg-slate-900 border rounded-xl p-5 text-center hover:shadow-md hover:border-emerald-400 transition-all group">
      <Icon className="h-8 w-8 mx-auto mb-2 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{label}</p>
    </Link>
  );
}
