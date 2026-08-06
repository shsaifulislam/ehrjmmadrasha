import type { Metadata } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-bengali",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.FRONTEND_URL || 'https://www.ehrjmadrasha.com'),
  title: {
    default: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা | EHRJ Madrasha ERP",
    template: "%s | EHRJ Madrasha",
  },
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ (রাঃ) জমিরীয়া ফাজিল মাদ্রাসা — শিক্ষা প্রশাসন ব্যবস্থাপনা সিস্টেম। ভর্তি, ফি, উপস্থিতি, পরীক্ষা, হোস্টেল ও অভিভাবক পোর্টাল।",
  keywords: ["মাদ্রাসা", "ইলিয়টগঞ্জ", "ERP", "ভর্তি", "ফি", "শিক্ষা প্রশাসন", "EHRJ Madrasha"],
  authors: [{ name: "EHRJ Madrasha Admin" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "EHRJ Madrasha ERP",
    title: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা",
    description: "শিক্ষা প্রশাসন ব্যবস্থাপনা সিস্টেম — ভর্তি, ফি, উপস্থিতি, পরীক্ষা, হোস্টেল",
  },
  twitter: {
    card: "summary_large_image",
    title: "EHRJ Madrasha ERP",
    description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা — শিক্ষা ব্যবস্থাপনা সিস্টেম",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${notoSansBengali.variable} h-full antialiased font-sans`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

