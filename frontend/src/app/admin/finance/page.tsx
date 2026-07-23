"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminFinanceRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/finance/invoices");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">অর্থ ব্যবস্থাপনা ড্যাশবোর্ডে পুনঃনির্দেশ করা হচ্ছে...</p>
    </div>
  );
}
