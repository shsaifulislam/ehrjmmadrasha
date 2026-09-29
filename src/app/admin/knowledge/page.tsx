import { Metadata } from "next";
import InstitutionalGovernanceConsole from "@/components/knowledge/InstitutionalGovernanceConsole";

export const metadata: Metadata = {
  title: "প্রাতিষ্ঠানিক পলিসি, এসওপি ও গভর্ন্যান্স ইঞ্জিন | EHRJ Admin",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার প্রাতিষ্ঠানিক জ্ঞানভান্ডার, এসওপি, পলিসি ও গভর্ন্যান্স কন্ট্রোল হাব।",
};

export default function AdminKnowledgePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalGovernanceConsole />
    </div>
  );
}
