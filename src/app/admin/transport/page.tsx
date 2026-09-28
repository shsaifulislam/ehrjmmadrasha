import React from "react";
import AdminTransportHub from "@/components/transport/AdminTransportHub";
import Link from "next/link";
import { ArrowLeft, Bus } from "lucide-react";

export const metadata = {
  title: "পরিবহন ব্যবস্থাপনা | EHRJ Madrasha ERP",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা শিক্ষার্থী পরিবহন ব্যবস্থাপনা ও রুট কন্ট্রোল",
};

export default function AdminTransportPage() {
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
            <Bus className="w-5 h-5 text-[#C59B27]" />
            <div>
              <h1 className="font-bold text-sm sm:text-base font-display leading-tight">
                পরিবহন ব্যবস্থাপনা ইঞ্জিন (Transport Management Engine)
              </h1>
              <p className="text-[11px] text-emerald-200">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা • ফেজ ১১
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="text-xs text-emerald-200 hover:text-white transition hidden md:block"
          >
            মূল ওয়েবসাইট দেখুন ↗
          </Link>
        </div>
      </header>

      {/* Main Transport Hub Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <AdminTransportHub />
      </main>
    </div>
  );
}
