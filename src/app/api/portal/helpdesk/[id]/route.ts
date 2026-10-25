import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getSupportRequestById } from "@/lib/helpdeskEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
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

    const ticket = await getSupportRequestById(params.id, {
      userId,
      role: "GUARDIAN",
      guardianId: guardian.id,
    });

    if (!ticket) {
      return NextResponse.json({ error: "অনুরোধটি পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("Portal Helpdesk Ticket GET error:", error);
    return NextResponse.json(
      { error: error.message || "অনুরোধ লোড করা সম্ভব হয়নি।" },
      { status: 403 }
    );
  }
}
