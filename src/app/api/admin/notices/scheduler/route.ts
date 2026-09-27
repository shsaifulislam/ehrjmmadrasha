import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { processScheduledNotices } from "@/lib/communicationEngine";

export const dynamic = "force-dynamic";

/**
 * Scheduled Notice Processor API
 * Can be called by Admin or by recurring cron / heartbeat
 * Guaranteed idempotent: running multiple times never creates duplicate notices or duplicate emails.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    // Allow ADMIN or internal secret header if cron
    const isCron = req.headers.get("x-cron-trigger") === "true";
    if (!isCron && (!user || user.role !== "ADMIN")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const result = await processScheduledNotices();

    return NextResponse.json({
      success: true,
      message: `শিডিউল প্রসেসর সফলভাবে সম্পন্ন হয়েছে। ${result.publishedCount} টি নোটিশ প্রকাশিত হয়েছে।`,
      result,
      data: result,
      publishedCount: result.publishedCount,
      expiredCount: result.expiredCount,
    });
  } catch (error: any) {
    console.error("Notice Scheduler Processor Error:", error);
    return NextResponse.json({ error: "শিডিউল নোটিশ প্রসেসে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
