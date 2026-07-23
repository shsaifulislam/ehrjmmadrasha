import type { Metadata } from "next";
import { DepartmentsClient } from "./DepartmentsClient";

export const metadata: Metadata = {
  title: "শিক্ষা বিভাগসমূহ | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
  description:
    "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার ৫টি অফিশিয়াল শিক্ষা বিভাগ: নূরানী, নাযেরা, হিফজ, কিতাব ও তাখাস্সুস (ইফতা)। ১৭টি জামায়াত ও ক্লাসের ভর্তি ও শিক্ষাক্রম বিবরণী।",
  openGraph: {
    title: "শিক্ষা বিভাগসমূহ | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
    description:
      "নূরানী, নাযেরা, হিফজ, কিতাব ও উচ্চতর তাখাস্সুস বিভাগের ১৭টি জামায়াতের বিস্তারিত শিক্ষাক্রম। ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা।",
    url: "https://ehrjmadrasha.edu.bd/departments",
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

export default function DepartmentsPage() {
  return <DepartmentsClient />;
}
