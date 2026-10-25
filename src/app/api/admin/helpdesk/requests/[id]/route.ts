import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSupportRequestById } from "@/lib/helpdeskEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const ticket = await getSupportRequestById(params.id, {
      userId: user.userId,
      role: user.role,
    });

    if (!ticket) {
      return NextResponse.json({ error: "অনুরোধটি পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("Admin Helpdesk Request Detail GET error:", error);
    return NextResponse.json(
      { error: error.message || "অনুরোধ লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
