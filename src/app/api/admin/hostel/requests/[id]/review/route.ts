import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { reviewResidentialRequest } from "@/lib/hostelEngine";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/hostel/requests/:id/review
 * Admin reviews and resolves a guardian residential request (APPROVE or REJECT).
 */
export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন আবেদন পর্যালোচনা করতে পারেন।" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { action, adminNotes, effectiveDate } = body;

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "অবৈধ অ্যাকশন (APPROVE অথবা REJECT আবশ্যক)।" }, { status: 400 });
    }

    const updated = await reviewResidentialRequest({
      requestId: id,
      action,
      adminNotes,
      adminUserId: user.userId,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: action === "APPROVE" ? "আবেদন সফলভাবে অনুমোদিত হয়েছে।" : "আবেদন প্রত্যাখ্যাত হয়েছে।",
      request: updated,
    });
  } catch (error: any) {
    console.error("POST /api/admin/hostel/requests/:id/review error:", error);
    return NextResponse.json(
      { error: error.message || "আবেদন পর্যালোচনায় সমস্যা হয়েছে।" },
      { status: 400 }
    );
  }
}
