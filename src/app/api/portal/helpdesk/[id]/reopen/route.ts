import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { updateSupportRequestStatus } from "@/lib/helpdeskEngine";

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

    const ticket = await prisma.supportRequest.findUnique({
      where: { id: params.id },
    });
    if (!ticket) {
      return NextResponse.json({ error: "অনুরোধটি পাওয়া যায়নি।" }, { status: 404 });
    }
    if (ticket.guardianId !== guardian.id && ticket.submittedByUserId !== userId) {
      return NextResponse.json({ error: "অননুমোদিত টিকিট অ্যাক্সেস।" }, { status: 403 });
    }

    if (ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") {
      return NextResponse.json(
        { error: "শুধুমাত্র নিষ্পত্তিকৃত বা বন্ধ টিকিট পুনর্বিবেচনার আবেদন করা যায়।" },
        { status: 400 }
      );
    }

    const body = await req.json();
    if (!body.reason || !body.reason.trim()) {
      return NextResponse.json({ error: "পুনর্বিবেচনার যৌক্তিক কারণ উল্লেখ করুন।" }, { status: 400 });
    }

    const updated = await updateSupportRequestStatus({
      requestId: params.id,
      toStatus: "REOPEN_REQUESTED",
      actorId: userId,
      actorRole: "GUARDIAN",
      notes: body.reason.trim(),
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error: any) {
    console.error("Portal Helpdesk Reopen POST error:", error);
    return NextResponse.json(
      { error: error.message || "পুনর্বিবেচনার আবেদন ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
