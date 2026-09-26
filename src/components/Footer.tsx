import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, Heart, ShieldCheck, ExternalLink } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-[#083B25] text-gray-300 border-t-4 border-[#C59B27] mt-auto">
      {/* Main Footer Info */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1: Institution Details */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-white border border-[#C59B27] overflow-hidden flex items-center justify-center flex-shrink-0 shadow">
              <Image
                src="/images/logo.jpg"
                alt="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা লোগো"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm sm:text-base leading-snug">
                {INSTITUTION_INFO.nameBn}
              </h2>
              <p className="text-[#C59B27] text-xs font-arabic">الجامعة الإسلامية رحمة الله</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed mb-4">
            কুরআন-সুন্নাহর সঠিক প্রচার ও চরিত্রবান আদর্শ নাগরিক গড়ার একটি অন্যতম শ্রেষ্ঠ মারকাজ। নূরানী, হিফজুল কুরআন, কিতাব বিভাগ ও এতিমখানা কমপ্লেক্স (স্থাপিত: {INSTITUTION_INFO.established}ইং)।
          </p>
          <div className="text-xs space-y-2 text-gray-300">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#C59B27] flex-shrink-0 mt-0.5" />
              <span>{INSTITUTION_INFO.addressBn}</span>
            </p>
            <div className="flex flex-col gap-1 pl-6">
              {INSTITUTION_INFO.phones.map((phone, idx) => (
                <a
                  key={idx}
                  href={`tel:${phone}`}
                  className="font-mono text-emerald-200 hover:text-white transition flex items-center gap-1.5"
                >
                  <Phone className="w-3 h-3 text-[#C59B27]" />
                  {phone}
                </a>
              ))}
            </div>
            <p className="flex items-center gap-2 pl-6">
              <Mail className="w-3.5 h-3.5 text-[#C59B27] flex-shrink-0" />
              {INSTITUTION_INFO.email}
            </p>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="text-white font-bold text-sm mb-3 pb-1 border-b border-emerald-800 text-[#C59B27]">
            গুরুত্বপূর্ণ লিংক ও পোর্টাল
          </h3>
          <ul className="text-xs space-y-2">
            <li>
              <Link href="/admission" className="hover:text-white transition flex items-center gap-1.5">
                • অনলাইন ভর্তি আবেদন ফরম
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white transition flex items-center gap-1.5 text-amber-200">
                • রেজাল্ট অনুসন্ধান (পাসওয়ার্ড ছাড়াই)
              </Link>
            </li>
            <li>
              <Link href="/#departments" className="hover:text-white transition flex items-center gap-1.5">
                • বিভাগ ও জামাতসমূহ
              </Link>
            </li>
            <li>
              <Link href="/#notices" className="hover:text-white transition flex items-center gap-1.5">
                • নোটিশ ও সার্কুলার
              </Link>
            </li>
            <li>
              <Link href="/#principal-section" className="hover:text-white transition flex items-center gap-1.5">
                • অধ্যক্ষ মহোদয়ের বাণী
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white transition flex items-center gap-1.5">
                • প্রশাসন ও শিক্ষক লগইন
              </Link>
            </li>
          </ul>

          {/* Social Links */}
          <div className="mt-4 pt-3 border-t border-emerald-800/60">
            <span className="text-[11px] text-gray-400 font-semibold block mb-2">অফিসিয়াল সোশ্যাল মিডিয়া:</span>
            <div className="flex flex-col gap-1.5 text-xs">
              <a
                href={INSTITUTION_INFO.facebook}
                target="_blank"
                rel="noreferrer"
                className="text-blue-300 hover:text-white flex items-center gap-1 transition"
              >
                <ExternalLink className="w-3 h-3" />
                Facebook পেইজ
              </a>
              <a
                href={INSTITUTION_INFO.youtube}
                target="_blank"
                rel="noreferrer"
                className="text-red-300 hover:text-white flex items-center gap-1 transition"
              >
                <ExternalLink className="w-3 h-3" />
                YouTube চ্যানেল
              </a>
              <a
                href={INSTITUTION_INFO.whatsappChannel}
                target="_blank"
                rel="noreferrer"
                className="text-green-300 hover:text-white flex items-center gap-1 transition"
              >
                <ExternalLink className="w-3 h-3" />
                WhatsApp চ্যানেল
              </a>
            </div>
          </div>
        </div>

        {/* Column 3: Zakat & Lilah Donation Info */}
        <div id="donate-footer">
          <h3 className="text-white font-bold text-sm mb-3 pb-1 border-b border-emerald-800 text-[#C59B27] flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            দান ও যাকাত হিসাব
          </h3>
          <p className="text-xs text-gray-300 mb-2.5">
            লিল্লাহ বোর্ডিং ও এতিমখানার ছাত্রদের খাদ্য ও চিকিৎসার জন্য আপনার যাকাত ও সদকা প্রদান করুন:
          </p>
          <div className="bg-[#0B1914] p-3 rounded border border-emerald-900 text-xs space-y-1">
            <p className="text-[#C59B27] font-semibold">ইসলামী ব্যাংক বাংলাদেশ লিঃ</p>
            <p className="text-gray-300">হিসাব নাম: <span className="text-white">হাজী রহমত উল্লাহ মাদ্রাসা লিল্লাহ ফান্ড</span></p>
            <p className="font-mono text-emerald-300">হিসাব নং: ২০৫০১৮৭৮৯০১২৩৪</p>
            <p className="text-gray-400 text-[11px]">ইলিয়টগঞ্জ শাখা, কুমিল্লা</p>
          </div>
          <div className="mt-2.5 flex flex-col gap-1 text-xs">
            <span className="bg-pink-900/60 text-pink-200 px-2 py-1 rounded font-mono border border-pink-700/40">
              বিকাশ: 01845-162664 (Personal)
            </span>
            <span className="bg-orange-900/60 text-orange-200 px-2 py-1 rounded font-mono border border-orange-700/40">
              নগদ: 01826-416696 (Personal)
            </span>
          </div>
        </div>

        {/* Column 4: Official Administration & Recognition */}
        <div>
          <h3 className="text-white font-bold text-sm mb-3 pb-1 border-b border-emerald-800 text-[#C59B27] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            মাদরাসা পরিচালনা ও প্রশাসন
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed mb-3">
            মুহতামিম ও অধ্যক্ষ: <span className="text-white font-semibold">{INSTITUTION_INFO.principal}</span>
          </p>
          <div className="bg-emerald-950/60 border border-emerald-800/80 p-3 rounded text-[11px] text-emerald-200 space-y-1">
            <p className="font-semibold text-white">একক সেন্ট্রালাইজড অ্যাডমিন কন্ট্রোল:</p>
            <p>সম্পূর্ণ মাদরাসার ওয়েবসাইট, ভর্তি, অ্যাকাডেমিক রেজাল্ট ও হিসাব একটি একক অ্যাডমিন প্যানেল দ্বারা নিয়ন্ত্রিত।</p>
          </div>
        </div>
      </div>

      {/* Bottom Legal bar */}
      <div className="bg-[#052417] py-3.5 px-4 text-center text-xs text-gray-400 border-t border-emerald-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {INSTITUTION_INFO.nameBn}। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="text-[11px] text-emerald-300">
            EHRJ Madrasha Digital Campus Web Application (Est: {INSTITUTION_INFO.established})
          </p>
        </div>
      </div>
    </footer>
  );
}
