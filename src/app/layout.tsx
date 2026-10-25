import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaProvider from "@/components/pwa/PwaProvider";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import CommandPalette from "@/components/search/CommandPalette";
import { LanguageProvider } from "@/context/LanguageContext";
import FloatingAppDock from "@/components/common/FloatingAppDock";
import { generateInstitutionalJsonLd } from "@/lib/cms";
import { INSTITUTION_INFO } from "@/lib/constants";
import { getAppUrl } from "@/lib/env";

export const viewport: Viewport = {
  themeColor: "#0D5C3A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: `${INSTITUTION_INFO.nameBn} | EHRJ Digital Campus`,
    template: `%s | ${INSTITUTION_INFO.nameBn}`,
  },
  description:
    "কুরআন-সুন্নাহর আলোকে আলোকিত কওমি ও হাফিজিয়া দ্বীনি শিক্ষাপ্রতিষ্ঠান, এতিমখানা এবং ডিজিটাল ক্যাম্পাস — পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা।",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EHRJ Madrasha",
  },
  keywords: [
    "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
    "Eliotganj Hazi Rohmatollah Jamiria Madrasha",
    "EHRJ Madrasha",
    "কওমি মাদরাসা কুমিল্লা",
    "হিফজুল কুরআন",
    "দাওরায়ে হাদিস",
    "লিল্লাহ বোর্ডিং এতিমখানা",
    "অনলাইন ভর্তি",
  ],
  openGraph: {
    title: `${INSTITUTION_INFO.nameBn} | অফিসিয়াল ডিজিটাল ক্যাম্পাস`,
    description: "কুমিল্লার দাউদকান্দির ঐতিহ্যবাহী দ্বীনি শিক্ষাপ্রতিষ্ঠান ও এতিমখানা কমপ্লেক্স।",
    url: getAppUrl(),
    siteName: INSTITUTION_INFO.nameBn,
    images: [
      {
        url: "/images/student-banner.jpg",
        width: 1200,
        height: 630,
        alt: INSTITUTION_INFO.nameBn,
      },
    ],
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${INSTITUTION_INFO.nameBn} | EHRJ Digital Campus`,
    description: "কুমিল্লার দাউদকান্দির ঐতিহ্যবাহী দ্বীনি শিক্ষাপ্রতিষ্ঠান ও এতিমখানা কমপ্লেক্স।",
    images: ["/images/student-banner.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = generateInstitutionalJsonLd();

  return (
    <html lang="bn" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Hind+Siliguri:wght@300;400;500;600;700&family=Noto+Serif+Bengali:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-[#F9F8F3] text-[#0B1914] pb-14 md:pb-0">
        <LanguageProvider>
          <PwaProvider>
            {children}
            <CommandPalette />
            <FloatingAppDock />
            <MobileBottomNav />
          </PwaProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
