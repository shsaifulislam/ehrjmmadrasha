import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { addSupportRequestMessage } from "@/lib/helpdeskEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const userId = user.userId;
    const guardian = await prisma.guardian.findFirst({
      where: {
        OR: [
          { userId },
          { phone: user.username },
        ],
      },
    });

    if (!guardian) {
      return NextResponse.json({ error: "অভিভাবক প্রোফাইল পাওয়া যায়নি।" }, { status: 403 });
    }

    // Verify ticket ownership
    const ticket = await prisma.supportRequest.findUnique({
      where: { id: params.id },
    });
    if (!ticket) {
      return NextResponse.json({ error: "অনুরোধটি পাওয়া যায়নি।" }, { status: 404 });
    }
    if (ticket.guardianId !== guardian.id && ticket.submittedByUserId !== userId) {
      return NextResponse.json({ error: "অননুমোদিত টিকিট অ্যাক্সেস।" }, { status: 403 });
    }

    if (ticket.status === "CLOSED") {
      return NextResponse.json(
        { error: "টিকিটটি বন্ধ করা হয়েছে। নতুন বার্তা পাঠাতে টিকিটটি পুনরায় সক্রিয় করার অনুরোধ করুন।" },
        { status: 400 }
      );
    }

    const body = await req.json();
    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: "বার্তা আবশ্যক।" }, { status: 400 });
    }

    // Guardians can NEVER create internal notes
    const message = await addSupportRequestMessage({
      requestId: params.id,
      authorId: userId,
      authorRole: "GUARDIAN",
      content: body.content,
      isInternal: false,
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("Portal Helpdesk Message POST error:", error);
    return NextResponse.json(
      { error: error.message || "বার্তা পাঠানো সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
