"use client";

import React from "react";
import AdminShell from "@/components/shells/AdminShell";
import StudentIdCardHub from "@/components/idcard/StudentIdCardHub";

export default function AdminIdCardsPage() {
  return (
    <AdminShell
      title="শিক্ষার্থী ডিজিটাল আইডি কার্ড হাব"
      subtitle="CR80 পিভিসি ফরম্যাটে দ্বিপাক্ষিক পরিচয়পত্র তৈরি ও ব্যাচ প্রিন্ট"
    >
      <div className="max-w-7xl mx-auto py-4">
        <StudentIdCardHub />
      </div>
    </AdminShell>
  );
}
