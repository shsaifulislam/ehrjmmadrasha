import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultsClient } from "./ResultsClient";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "ফলাফল দেখুন | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
  description:
    "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার প্রকাশিত পরীক্ষার ফলাফল অনুসন্ধান কেন্দ্র। সেশন, পরীক্ষা ও রোল নম্বর দিয়ে মার্কশীট ও রেজাল্ট কার্ড দেখুন।",
  openGraph: {
    title: "ফলাফল দেখুন | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
    description:
      "অনলাইনে মাদ্রাসার পাবলিক পরীক্ষার রেজাল্ট কার্ড ও নম্বরপত্র সংগ্রহ করুন। ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা।",
    url: "https://ehrjmadrasha.edu.bd/results",
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

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            ফলাফল সিস্টেম লোড করা হচ্ছে...
          </p>
        </div>
      }
    >
      <ResultsClient />
    </Suspense>
  );
}
