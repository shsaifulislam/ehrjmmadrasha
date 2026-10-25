import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, Heart, ShieldCheck, ExternalLink, Sparkles, Award } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-[#041F14] text-slate-300 border-t-2 border-[#D4AF37] mt-auto relative overflow-hidden">
      {/* Subtle ambient glow overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Main Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
        {/* Column 1: Institution Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white border-2 border-[#D4AF37] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg p-0.5">
              <Image
                src="/images/logo.jpg"
                alt="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা লোগো"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-base leading-snug">
                {INSTITUTION_INFO.nameBn}
              </h2>
              <p className="text-[#D4AF37] text-xs font-arabic">الجامعة الإسلامية رحمة الله</p>
            </div>
          </div>
          <p className="text-xs text-slate-300/90 leading-relaxed">
            কুরআন-সুন্নাহর বিশুদ্ধ জ্ঞান ও আদর্শ চরিত্র গঠনের ঐতিহ্যবাহী দীনী উচ্চ শিক্ষাকেন্দ্র। নূরানী, হিফজুল কুরআন, কিতাব বিভাগ (দাওরায়ে হাদিস) ও এতিমখানা কমপ্লেক্স (স্থাপিত: {INSTITUTION_INFO.established}ইং)।
          </p>
          <div className="text-xs space-y-2 text-slate-300 pt-1">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <span>{INSTITUTION_INFO.addressBn}</span>
            </p>
            <div className="flex flex-col gap-1.5 pl-6">
              {INSTITUTION_INFO.phones.map((phone, idx) => (
                <a
                  key={idx}
                  href={`tel:${phone}`}
                  className="font-mono text-emerald-300 hover:text-white transition flex items-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{phone}</span>
                </a>
              ))}
            </div>
            <p className="flex items-center gap-2 pl-6">
              <Mail className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
              <span>{INSTITUTION_INFO.email}</span>
            </p>
            <p className="flex items-center gap-2 pl-6">
              <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
              <a
                href={INSTITUTION_INFO.website}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-emerald-300 hover:text-white transition"
              >
                {INSTITUTION_INFO.domain}
              </a>
            </p>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="text-white font-bold text-sm mb-4 pb-2 border-b border-emerald-800/80 text-[#D4AF37] flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            গুরুত্বপূর্ণ ডিজিটাল পোর্টাল
          </h3>
          <ul className="text-xs space-y-2">
            <li>
              <Link href="/admission" className="text-slate-300 hover:text-amber-200 transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>অনলাইন ভর্তি আবেদন ফরম</span>
              </Link>
            </li>
            <li>
              <Link href="/results" className="text-amber-300 hover:text-white transition flex items-center gap-2 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>রেজাল্ট ও মার্কশিট অনুসন্ধান</span>
              </Link>
            </li>
            <li>
              <Link href="/calendar" className="text-slate-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>ক্লাস ও পরীক্ষার ক্যালেন্ডার</span>
              </Link>
            </li>
            <li>
              <Link href="/events" className="text-slate-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>প্রতিযোগিতা ও অনুষ্ঠানমালা</span>
              </Link>
            </li>
            <li>
              <Link href="/downloads" className="text-slate-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>ডাউনলোড হাব ও সিলেবাস</span>
              </Link>
            </li>
            <li>
              <Link href="/library" className="text-slate-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>কিতাবখানা ও ই-লাইব্রেরি</span>
              </Link>
            </li>
            <li>
              <Link href="/transport" className="text-slate-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>ছাত্র পরিবহন সুবিধা</span>
              </Link>
            </li>
            <li>
              <Link href="/alumni" className="text-slate-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>প্রাক্তন শিক্ষার্থী ফোরাম</span>
              </Link>
            </li>
            <li>
              <Link href="/portal" className="text-slate-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>অভিভাবক পোর্টাল (Guardian)</span>
              </Link>
            </li>
            <li>
              <Link href="/notices" className="text-slate-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>অফিসিয়াল নোটিশ ও সার্কুলার</span>
              </Link>
            </li>
            <li>
              <Link href="/verify" className="text-slate-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>সনদপত্র সত্যতা যাচাই (QR Verification)</span>
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-slate-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>উস্তাদ ও প্রশাসনিক লগইন</span>
              </Link>
            </li>
          </ul>

          {/* Social Links */}
          <div className="mt-5 pt-3 border-t border-emerald-900/60">
            <span className="text-[11px] text-slate-400 font-semibold block mb-2">অফিসিয়াল সোশ্যাল মিডিয়া:</span>
            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href={INSTITUTION_INFO.facebook}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-950/60 hover:bg-emerald-900 text-blue-300 hover:text-white px-2.5 py-1 rounded-lg border border-emerald-800/50 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3 h-3" />
                Facebook
              </a>
              <a
                href={INSTITUTION_INFO.instagram}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-950/60 hover:bg-emerald-900 text-pink-300 hover:text-white px-2.5 py-1 rounded-lg border border-emerald-800/50 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3 h-3" />
                Instagram
              </a>
              <a
                href={INSTITUTION_INFO.youtube}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-950/60 hover:bg-emerald-900 text-red-300 hover:text-white px-2.5 py-1 rounded-lg border border-emerald-800/50 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3 h-3" />
                YouTube
              </a>
              <a
                href={INSTITUTION_INFO.whatsappDirect}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-950/60 hover:bg-emerald-900 text-green-300 hover:text-white px-2.5 py-1 rounded-lg border border-emerald-800/50 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3 h-3" />
                WhatsApp / IMO
              </a>
            </div>
          </div>
        </div>

        {/* Column 3: Zakat & Lilah Donation Info */}
        <div id="donate-footer">
          <h3 className="text-white font-bold text-sm mb-4 pb-2 border-b border-emerald-800/80 text-[#D4AF37] flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            উন্মুক্ত দান ও যাকাত ফান্ড
          </h3>
          <p className="text-xs text-slate-300/90 mb-3 leading-relaxed">
            লিল্লাহ বোর্ডিং ও এতিমখানার শিক্ষার্থীদের জন্য কোনো ফিক্সড অংক নেই; যে কেউ নিজের ইচ্ছামত যেকোনো পরিমাণ দান করতে পারেন:
          </p>
          <div className="bg-emerald-950/70 p-3.5 rounded-xl border border-emerald-800/70 text-xs space-y-1.5 shadow-sm">
            <p className="text-[#D4AF37] font-bold">এতিমখানা ও সাধারণ লিল্লাহ ফান্ড</p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              সদকা, যাকাত বা লিল্লাহ অনুদান সম্পন্ন করার জন্য নিরাপদ অনলাইন গেটওয়ে ব্যবহার করুন। সাইবার নিরাপত্তা নীতি অনুযায়ী পেমেন্ট সম্পন্ন করার চূড়ান্ত ধাপে সরাসরি ভেরিফাইড পেমেন্ট চ্যানেল প্রদর্শিত হয়।
            </p>
          </div>
          <div className="mt-3">
            <Link
              href="/donate"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-[#D4AF37] hover:bg-[#b5952f] text-slate-950 transition shadow-sm"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
              <span>যেকোনো পরিমাণ অনলাইন অনুদান ও রিসিট</span>
            </Link>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center leading-tight">
              * তাৎক্ষণিক ডাউনলোডযোগ্য অফিশিয়াল ডিজিটাল রশিদ
            </p>
          </div>
        </div>

        {/* Column 4: Official Administration & Recognition */}
        <div>
          <h3 className="text-white font-bold text-sm mb-4 pb-2 border-b border-emerald-800/80 text-[#D4AF37] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            মাদরাসা প্রশাসন ও স্বীকৃতি
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            মুহতামিম ও অধ্যক্ষ: <span className="text-white font-bold">{INSTITUTION_INFO.principal}</span>
          </p>
          <div className="bg-emerald-950/50 border border-emerald-700/40 p-3.5 rounded-xl text-xs text-emerald-200/90 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span>মাদরাসা পরিচালনা ও তথ্য সেবা</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              সকল জামাতের শিক্ষা কার্যক্রম, উপস্থিতি, ফি কালেকশন, রেজাল্ট শিট এবং ছাত্রাবাস ব্যবস্থাপনা সুশৃঙ্খলভাবে পরিচালিত।
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Legal bar */}
      <div className="bg-[#02140D] py-4 px-4 text-xs text-slate-400 border-t border-emerald-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} {INSTITUTION_INFO.nameBn}। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <a
              href="https://www.ehrjmadrasha.com"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-emerald-300 hover:text-white transition"
            >
              www.ehrjmadrasha.com
            </a>
            <span className="text-emerald-700">|</span>
            <span>অফিসিয়াল ওয়েব পোর্টাল</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
