import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { executeMasterCronRegistry } from "@/lib/schedulerEngine";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/operations/cron
 * Query status or execute scheduled background tasks.
 * Authorized for ADMIN role, or automated runner with Bearer token.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "ehrj-internal-cron-token";

    let isAuthorized = false;
    if (authHeader && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
    } else {
      const user = await getSessionUser();
      if (user && user.role === "ADMIN") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন ক্রন পরিচালনা করতে পারেন।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const jobKey = searchParams.get("job") || "ALL";

    const report = await executeMasterCronRegistry(jobKey);

    return NextResponse.json({
      success: report.failedJobs === 0,
      report,
    });
  } catch (error: any) {
    console.error("Cron Execution Error:", error);
    return NextResponse.json({ error: error.message || "ক্রন জব পরিচালনায় ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
