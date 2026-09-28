import React from "react";
import GuardianTransportViewer from "@/components/transport/GuardianTransportViewer";
import Link from "next/link";
import { ArrowLeft, Bus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "পরিবহন সেবা পোর্টাল | অভিভাবক কর্নার",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা শিক্ষার্থী পরিবহন ও রুট ট্র্যাকিং পোর্টাল",
};

export default function GuardianTransportPage() {
  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col text-[#0B1914]">
      <Navbar />

      {/* Sub-header */}
      <div className="bg-[#083B25] text-white py-6 border-b-2 border-[#C59B27]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bus className="w-8 h-8 text-[#C59B27]" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display">
                শিক্ষার্থী পরিবহন সেবা পোর্টাল
              </h1>
              <p className="text-xs text-emerald-200">
                সন্তানের যাতায়াত রুট, পিকআপ স্টপ, সময়সূচি ও নতুন আবেদন পরিচালনা
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
        <GuardianTransportViewer />
      </main>

      <Footer />
    </div>
  );
}
