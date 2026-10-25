import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GuardianHelpdeskHub from "@/components/helpdesk/GuardianHelpdeskHub";

export const metadata: Metadata = {
  title: "টিকেটের অগ্রগতি | অভিভাবক পোর্টাল",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার অভিভাবক সেবা ও অভিযোগ ডেস্ক",
};

export default async function PortalHelpdeskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col justify-between">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        <GuardianHelpdeskHub initialTicketId={id} />
      </div>
      <Footer />
    </div>
  );
}
