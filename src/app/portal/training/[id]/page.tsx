import { Metadata } from "next";
import PortalTrainingPage from "../page";

export const metadata: Metadata = {
  title: "প্রশিক্ষণ কোর্স ও মূল্যায়ন | EHRJ Portal",
  description: "নির্দিষ্ট প্রশিক্ষণ কোর্সের পাঠ্য উপাদান, মডিউল ও মূল্যায়ন পরীক্ষা।",
};

export default function PortalSingleTrainingPage() {
  return <PortalTrainingPage />;
}
