"use client";

import React from "react";
import AdminShell from "@/components/shells/AdminShell";
import AdminDonationsHub from "@/components/donations/AdminDonationsHub";

export default function AdminDonationsPage() {
  return (
    <AdminShell
      title="অনুদান ও মাহফিল তহবিল ব্যবস্থাপনা"
      subtitle="সদকা, যাকাত, লিল্লাহ বোর্ডিং ও বার্ষিক মাহফিল অনুদান ট্র্যাকার ও তাৎক্ষণিক রসিদ"
    >
      <div className="max-w-7xl mx-auto py-4">
        <AdminDonationsHub />
      </div>
    </AdminShell>
  );
}
