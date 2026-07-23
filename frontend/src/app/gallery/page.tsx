import type { Metadata } from "next";
import { Suspense } from "react";
import { GalleryClient } from "./GalleryClient";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "ফটো গ্যালারি | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
  description:
    "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার অফিসিয়াল ফটো গ্যালারি। ক্যাম্পাস ভবন, ক্লাসরুম শিক্ষা, পুরস্কার বিতরণী ও বার্ষিক ক্রিয়াকলাপের স্থিরচিত্রমালা।",
  openGraph: {
    title: "ফটো গ্যালারি | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
    description:
      "মাদ্রাসার ক্যাম্পাস ও বিভিন্ন একাডেমিক কার্যক্রমের চিত্রমালা। ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা।",
    url: "https://ehrjmadrasha.edu.bd/gallery",
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

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            ফটো গ্যালারি লোড করা হচ্ছে...
          </p>
        </div>
      }
    >
      <GalleryClient />
    </Suspense>
  );
}
