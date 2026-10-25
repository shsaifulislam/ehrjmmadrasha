import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addSupportRequestMessage } from "@/lib/helpdeskEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: "বার্তা বা মন্তব্যের বিবরণ আবশ্যক।" }, { status: 400 });
    }

    const message = await addSupportRequestMessage({
      requestId: params.id,
      authorId: user.userId,
      authorRole: user.role,
      content: body.content,
      isInternal: Boolean(body.isInternal),
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("Admin Helpdesk Message POST error:", error);
    return NextResponse.json(
      { error: error.message || "মন্তব্য যোগ করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
