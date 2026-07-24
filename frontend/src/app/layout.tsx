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
  metadataBase: new URL(process.env.FRONTEND_URL || 'https://ehrjmadrasha.edu.bd'),
  title: "EHRJ Madrasha ERP",
  description: "Eliotganj Hazi Rohmatollah Jamiria Madrasha Management System",
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

