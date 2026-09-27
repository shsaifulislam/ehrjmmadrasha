import React from "react";
import AdminHostelHub from "@/components/hostel/AdminHostelHub";
import Link from "next/link";
import { ArrowLeft, Home, Building } from "lucide-react";

export const metadata = {
  title: "হোস্টেল ও আবাসন ব্যবস্থাপনা | EHRJ Madrasha ERP",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা হোস্টেল ও আবাসিক ছাত্র ব্যবস্থাপনা",
};

export default function AdminHostelPage() {
  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col text-[#0B1914]">
      {/* Top Header */}
      <header className="bg-[#083B25] text-white px-6 py-3.5 border-b-2 border-[#C59B27] flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs bg-[#0D5C3A] hover:bg-[#158052] text-white px-2.5 py-1.5 rounded transition shadow"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>এডমিন প্যানেলে ফিরুন</span>
          </Link>
          <div className="h-4 w-px bg-emerald-700 mx-1 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#C59B27]" />
            <div>
              <h1 className="font-bold text-sm sm:text-base font-display leading-tight">
                হোস্টেল ও আবাসন ইঞ্জিন (Hostel & Residential Engine)
              </h1>
              <p className="text-[11px] text-emerald-200">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা • ফেজ ১০
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-emerald-200 hover:text-white px-2 py-1 rounded transition hidden sm:inline"
          >
            মূল সাইট
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1 bg-[#C59B27] hover:bg-[#b08920] text-[#083B25] px-3 py-1.5 rounded text-xs font-bold transition shadow"
          >
            <Home className="w-3.5 h-3.5" />
            এডমিন ড্যাশবোর্ড
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <AdminHostelHub />
      </main>
    </div>
  );
}
