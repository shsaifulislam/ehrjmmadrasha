import type { Metadata } from "next";
import { Suspense } from "react";
import { DonationClient } from "./DonationClient";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "অনদান ও সদকাহ | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
  description:
    "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার লিল্লাহ বোর্ডিং, এতিম তহবিল ও অবকাঠামো উন্নয়ন ফান্ডের অফিশিয়াল বিকাশ, নগদ ও ব্যাংক একাউন্ট বিবরণী।",
  openGraph: {
    title: "অনদান ও সদকাহ | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
    description:
      "এতিম ও দুস্থ শিক্ষার্থীদের দ্বীনিয়া শিক্ষায় সহযোগিতার মাধ্যমে সদকাহ জারিয়ার সৌভাগ্য অর্জন করুন। ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা।",
    url: "https://ehrjmadrasha.edu.bd/donation",
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

export default function DonationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            অনুদান কেন্দ্র লোড করা হচ্ছে...
          </p>
        </div>
      }
    >
      <DonationClient />
    </Suspense>
  );
}
