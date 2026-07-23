import type { Metadata } from "next";
import { Suspense } from "react";
import { AdmissionClient } from "./AdmissionClient";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "অনলাইন ভর্তি আবেদন | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
  description:
    "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসায় অনলাইনে নতুন ছাত্র/ছাত্রী ভর্তির আবেদন ফরম। নূরানী, নাযেরা, হিফজ, কিতাব ও তাখাস্সুস বিভাগের ১৭টি জামায়াতে ভর্তি আবেদন করুন।",
  openGraph: {
    title: "অনলাইন ভর্তি আবেদন | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
    description:
      "অনলাইনে নতুন সেশনের ভর্তি আবেদন করুন। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা, দাউদকান্দি, কুমিল্লা।",
    url: "https://ehrjmadrasha.edu.bd/admission",
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

export default function AdmissionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            ভর্তি ফরম লোড করা হচ্ছে...
          </p>
        </div>
      }
    >
      <AdmissionClient />
    </Suspense>
  );
}
