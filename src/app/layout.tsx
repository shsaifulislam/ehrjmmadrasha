import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaProvider from "@/components/pwa/PwaProvider";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";

export const viewport: Viewport = {
  themeColor: "#0D5C3A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "ইলিয়টগঞ্জ হাজী রহমত উল্লাহ জামিয়া মাদ্রাসা | EHRJ Digital Campus",
  description:
    "একটি পূর্ণাঙ্গ ঐতিহ্যবাহী কওমি ও হাফিজিয়া মাদ্রাসা, এতিমখানা এবং ডিজিটাল ক্যাম্পাস ম্যানেজমেন্ট সিস্টেম - ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা।",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EHRJ Madrasha",
  },
  keywords: [
    "Eliotgonj Madrasha",
    "Hazi Rohmatollah Madrasha",
    "Qawmi Madrasha",
    "Hifzul Quran",
    "Dawra-e-Hadith",
    "Lilah Boarding",
    "Cumilla Madrasha",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" dir="ltr">
      <body className="antialiased min-h-screen flex flex-col bg-[#F9F8F3] text-[#0B1914] pb-14 md:pb-0">
        <PwaProvider>
          {children}
          <MobileBottomNav />
        </PwaProvider>
      </body>
    </html>
  );
}
