"use client";

import React from "react";
import AdminShell from "@/components/shells/AdminShell";
import AdminExamHub from "@/components/exams/AdminExamHub";

export default function AdminExamsPage() {
  return (
    <AdminShell
      title="একাডেমিক পরীক্ষা, ফলাফল ও মার্কশিট হাব"
      subtitle="টার্ম পরীক্ষা, নম্বর নিরীক্ষা, স্বয়ংক্রিয় গ্রেডিং, অফিসিয়াল টেবুলেশন শিট ও প্রগ্রেসিভ মার্কশিট জেনারেটর"
    >
      <div className="max-w-7xl mx-auto py-4">
        <AdminExamHub />
      </div>
    </AdminShell>
  );
}
