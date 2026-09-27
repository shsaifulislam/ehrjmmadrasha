import React from "react";
import GuardianHostelViewer from "@/components/hostel/GuardianHostelViewer";
import Link from "next/link";
import { ArrowLeft, Home, Building } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "হোস্টেল ও আবাসিক সেবা | অভিভাবক পোর্টাল",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা অভিভাবক হোস্টেল ও আবাসন পোর্টাল",
};

export default function GuardianHostelPage() {
  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col text-[#0B1914]">
      <Navbar />

      {/* Sub-header */}
      <div className="bg-[#083B25] text-white py-6 border-b-2 border-[#C59B27]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building className="w-8 h-8 text-[#C59B27]" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display">
                হোস্টেল ও আবাসিক সেবা পোর্টাল
              </h1>
              <p className="text-xs text-emerald-200">
                সন্তানের আবাসিক অবস্থা, চেক-ইন/আউট ইতিহাস ও আবেদন পরিচালনা
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/portal"
              className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 transition shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              পোর্টাল হোম
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        <GuardianHostelViewer />
      </main>

      <Footer />
    </div>
  );
}
