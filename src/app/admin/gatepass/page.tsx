"use client";

import React from "react";
import AdminShell from "@/components/shells/AdminShell";
import GatePassManager from "@/components/gatepass/GatePassManager";

export default function AdminGatePassPage() {
  return (
    <AdminShell
      title="দারুল ইক্বামা ও নিরাপত্তা গেটপাস ট্র্যাকার"
      subtitle="আবাসিক শিক্ষার্থীদের মাদরাসা বহির্গমন অনুমতি ও ফটক পর্যবেক্ষণ"
    >
      <div className="max-w-7xl mx-auto py-4">
        <GatePassManager />
      </div>
    </AdminShell>
  );
}
