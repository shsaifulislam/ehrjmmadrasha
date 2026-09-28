import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSecurityEvents, SecurityEventType, SecuritySeverity } from "@/lib/securityEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন প্রবেশের অধিকার রয়েছে।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity") as SecuritySeverity | null;
    const eventType = searchParams.get("eventType") as SecurityEventType | null;
    const userId = searchParams.get("userId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const events = getSecurityEvents({
      severity: severity || undefined,
      eventType: eventType || undefined,
      userId,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        events,
        total: events.length,
      },
    });
  } catch (error: any) {
    console.error("Security Events GET Error:", error);
    return NextResponse.json(
      { error: "নিরাপত্তা ইভেন্ট লগ লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
