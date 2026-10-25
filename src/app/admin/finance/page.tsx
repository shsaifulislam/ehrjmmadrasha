"use client";

import React from "react";
import AdminShell from "@/components/shells/AdminShell";
import AdminFinanceHub from "@/components/finance/AdminFinanceHub";

export default function AdminFinancePage() {
  return (
    <AdminShell
      title="হিসাব ও ফি কালেকশন হাব"
      subtitle="শিক্ষার্থী ফি আদায়, লেজার, আয়-ব্যয় ট্র্যাকিং, ব্যাংক ও নগদ হিসাব সমন্বয়"
    >
      <div className="max-w-7xl mx-auto py-4">
        <AdminFinanceHub />
      </div>
    </AdminShell>
  );
}
