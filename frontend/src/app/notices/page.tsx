import type { Metadata } from "next";
import { Suspense } from "react";
import { NoticesClient } from "./NoticesClient";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "নোটিশ বোর্ড | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
  description:
    "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার প্রাতিষ্ঠানিক নোটিশ বোর্ড। পরীক্ষা, ভর্তি, ছুটির তালিকা ও সকল একাডেমিক বিজ্ঞপ্তির বিবরণ ও PDF ডাউনলোড।",
  openGraph: {
    title: "নোটিশ বোর্ড | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
    description:
      "মাদ্রাসার অফিশিয়াল বিজ্ঞপ্তি ও একাডেমিক নোটিশসমূহ সংগ্রহ করুন। ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা।",
    url: "https://ehrjmadrasha.edu.bd/notices",
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

export default function NoticesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            নোটিশ বোর্ড লোড করা হচ্ছে...
          </p>
        </div>
      }
    >
      <NoticesClient />
    </Suspense>
  );
}
