import React from "react";
import DigitalAttendanceKiosk from "@/components/attendance/DigitalAttendanceKiosk";

export const metadata = {
  title: "ডিজিটাল বায়োমেট্রিক ও কিউআর হাজিরা টার্মিনাল | EHRJ Madrasha",
  description: "বায়োমেট্রিক ফিঙ্গারপ্রিন্ট, ফেস রিকগনিশন ও কিউআর কোড হাজিরা গ্রহণ এবং তাৎক্ষণিক অভিভাবক এসএমএস গেটওয়ে।",
};

export default function AttendanceKioskPage() {
  return <DigitalAttendanceKiosk />;
}
