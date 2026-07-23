import type { Metadata } from "next";
import { Suspense } from "react";
import { DownloadsClient } from "./DownloadsClient";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "ডাউনলোড সেন্টার | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
  description:
    "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার অফিসিয়াল ডাউনলোড সেন্টার। সিলেবাস, পরীক্ষার রুটিন, কারিকুলাম, ভর্তি ফরম ও আবেদনপত্র সংগ্রহ করুন।",
  openGraph: {
    title: "ডাউনলোড সেন্টার | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
    description:
      "মাদ্রাসার অফিশিয়াল ফাইল, সিলেবাস, রুটিন ও প্রাতিষ্ঠানিক ডকুমেন্টস ডাউনলোড করুন। ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা।",
    url: "https://ehrjmadrasha.edu.bd/downloads",
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

export default function DownloadsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            ডাউনলোড সেন্টার লোড করা হচ্ছে...
          </p>
        </div>
      }
    >
      <DownloadsClient />
    </Suspense>
  );
}
