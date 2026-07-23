"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminReceiptsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/finance/invoices");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">ইনভয়েস ও রশিদ তালিকায় পুনঃনির্দেশ করা হচ্ছে...</p>
    </div>
  );
}
