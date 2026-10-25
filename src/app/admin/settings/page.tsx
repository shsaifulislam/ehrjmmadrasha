"use client";

import React from "react";
import AdminShell from "@/components/shells/AdminShell";
import AdminSettingsHub from "@/components/settings/AdminSettingsHub";

export default function AdminSettingsPage() {
  return (
    <AdminShell
      title="সেন্ট্রাল সিস্টেম ও প্রাতিষ্ঠানিক গভর্ন্যান্স সেটিংস"
      subtitle="সমন্বিত নীতি, নিরাপত্তা ও প্রাতিষ্ঠানিক পরামিতি কনফিগারেশন"
    >
      <div className="max-w-6xl mx-auto py-4">
        <AdminSettingsHub />
      </div>
    </AdminShell>
  );
}
