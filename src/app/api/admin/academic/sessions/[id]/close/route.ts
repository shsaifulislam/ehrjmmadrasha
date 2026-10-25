import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const session = await prisma.academicSession.findUnique({
      where: { id: params.id },
    });
    if (!session) {
      return NextResponse.json({ error: "সেশন পাওয়া যায়নি।" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.academicSession.update({
        where: { id: params.id },
        data: {
          isCurrent: false,
          status: "CLOSED",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "UPDATE",
          entityType: "AcademicSession",
          entityId: params.id,
          detailsJson: JSON.stringify({ action: "CLOSE_SESSION", sessionName: session.name }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `সেশন '${session.name}' সফলভাবে সম্পন্ন/বন্ধ (CLOSED) করা হয়েছে। সকল ঐতিহাসিক রেকর্ড অপরিবর্তিত রয়েছে।`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "সেশন ক্লোজ করতে ত্রুটি হয়েছে।" }, { status: 500 });
  }
}
