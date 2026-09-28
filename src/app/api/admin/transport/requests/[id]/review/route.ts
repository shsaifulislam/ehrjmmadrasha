import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { reviewTransportRequest } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন আবেদন অনুমোদন বা বাতিল করতে পারেন।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { status, rejectionReason, effectiveDate, monthlyFee } = body;

    if (!status || (status !== "APPROVED" && status !== "REJECTED")) {
      return NextResponse.json(
        { error: "অবস্থা 'APPROVED' অথবা 'REJECTED' হওয়া আবশ্যক।" },
        { status: 400 }
      );
    }

    const action: "APPROVE" | "REJECT" = status === "APPROVED" ? "APPROVE" : "REJECT";

    const result = await reviewTransportRequest({
      requestId: id,
      action,
      rejectionReason,
      effectiveStartDate: effectiveDate ? new Date(effectiveDate) : undefined,
      monthlyFee: monthlyFee !== undefined ? Number(monthlyFee) : undefined,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Review transport request error:", error);
    return NextResponse.json(
      { error: error.message || "আবেদন পর্যালোচনা প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
