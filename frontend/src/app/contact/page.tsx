import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Globe,
  Video,
  ExternalLink,
  Clock
} from "lucide-react";

export const metadata: Metadata = {
  title: "যোগাযোগ করুন | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
  description:
    "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার প্রাতিষ্ঠানিক ঠিকানা, ফোন হটলাইন নম্বর, ইমেইল, গুগল ম্যাপস লোকেশন ও সোশ্যাল মিডিয়া যোগাযোগ মাধ্যম।",
  openGraph: {
    title: "যোগাযোগ করুন | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
    description:
      "মাদ্রাসার অবস্থান, ফোন নম্বর, হোয়াটসঅ্যাপ ও যোগাযোগের অফিশিয়াল মাধ্যম। ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা।",
    url: "https://ehrjmadrasha.edu.bd/contact",
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

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Branding Navigation */}
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
                জমিরীয়া মাদ্রাসা (যোগাযোগ কেন্দ্র)
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

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 flex-1 w-full">
        {/* Banner Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-4 py-1 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>সরাসরি তথ্য ও হেল্পলাইন</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            যোগাযোগ করুন (Contact Us)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            মাদ্রাসার যেকোনো একাডেমিক তথ্য, ভর্তি বা যেকোনো সহযোগিতার জন্য আমাদের সাথে সরাসরি যোগাযোগ করুন।
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Left Column: Official Contact Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-300 border-b pb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" /> অফিশিয়াল যোগাযোগের বিবরণ
              </h2>

              <div className="space-y-5">
                {/* Location */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">ঠিকানা</p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                      ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, চট্টগ্রাম বিভাগ, বাংলাদেশ
                    </p>
                  </div>
                </div>

                {/* Hotlines */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">ফোন হটলাইন (ক্লিক করে কল করুন)</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <a
                        href="tel:01845162664"
                        className="text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 px-2.5 py-1 rounded transition-colors text-slate-800 dark:text-slate-200"
                      >
                        01845-162664
                      </a>
                      <a
                        href="tel:01826416696"
                        className="text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 px-2.5 py-1 rounded transition-colors text-slate-800 dark:text-slate-200"
                      >
                        01826-416696
                      </a>
                      <a
                        href="tel:01949091911"
                        className="text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 px-2.5 py-1 rounded transition-colors text-slate-800 dark:text-slate-200"
                      >
                        01949-091911
                      </a>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">ইমেইল ঠিকানা</p>
                    <a
                      href="mailto:info@ehrjmadrasha.edu.bd"
                      className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline mt-0.5 block"
                    >
                      info@ehrjmadrasha.edu.bd
                    </a>
                  </div>
                </div>

                {/* Office Hours */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">কার্যালয় সময়সূচি</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                      শনিবার - বৃহস্পতিবার: সকাল ৮:০০ - বিকাল ৫:০০ (শুক্রবার বন্ধ)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Channels */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-3">
                অফিশিয়াল সামাজিক মাধ্যম ও সময়সূচি চ্যানেল
              </h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.facebook.com/ehrjmadrasda"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-semibold transition-colors"
                >
                  <Globe className="h-4 w-4" /> Facebook পেজ
                </a>
                <a
                  href="https://www.youtube.com/@ehrjmadrasha"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 text-xs font-semibold transition-colors"
                >
                  <Video className="h-4 w-4" /> YouTube চ্যানেল
                </a>
                <a
                  href="https://whatsapp.com/channel/0029VbC30aF6buMF0LGPMp3F"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-xs font-semibold transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp চ্যানেল
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Location Map & Quick Action */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-300 border-b pb-3 flex items-center justify-between">
                <span>মাদ্রাসার মানচিত্র ও অবস্থান</span>
                <a
                  href="https://maps.google.com/?q=Eliotganj,Daudkandi,Comilla"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                >
                  গুগল ম্যাপস এ দেখুন <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </h2>

              {/* Google Maps Embed Frame */}
              <div className="w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 relative">
                <iframe
                  title="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার অবস্থান"
                  src="https://maps.google.com/maps?q=Eliotganj,Daudkandi,Comilla,Bangladesh&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  className="border-0 w-full h-full"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Direct WhatsApp Messaging Trigger */}
            <div className="pt-2 text-center space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                জরুরি প্রয়োজনে সরাসরি আমাদের সাথে হোয়াটসঅ্যাপে বার্তা আদান-প্রদান করতে পারবেন।
              </p>
              <a
                href="https://wa.me/8801845162664"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <MessageCircle className="h-5 w-5" /> হোয়াটসঅ্যাপে সরাসরি বার্তা পাঠান
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
