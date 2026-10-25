"use client";

import React from "react";
import AdminShell from "@/components/shells/AdminShell";
import AdminCommunicationHub from "@/components/communication/AdminCommunicationHub";

export default function AdminNoticesPage() {
  return (
    <AdminShell
      title="ডিজিটাল নোটিশবোর্ড, এসএমএস ও হোয়াটসঅ্যাপ ব্রডকাস্ট হাব"
      subtitle="প্রাতিষ্ঠানিক প্রজ্ঞাপন, জরুরি সার্কুলার, বাল্ক এসএমএস ব্রডকাস্ট এবং ডিরেক্ট হোয়াটসঅ্যাপ গেটওয়ে ব্যবস্থাপনা"
      breadcrumbs={[
        { label: "ককপিট ড্যাশবোর্ড", href: "/admin" },
        { label: "নোটিশ ও যোগাযোগ", href: "/admin/notices" },
      ]}
    >
      <div className="w-full">
        <AdminCommunicationHub />
      </div>
    </AdminShell>
  );
}
