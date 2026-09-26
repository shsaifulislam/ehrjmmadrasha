import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      // Set all other sessions isCurrent: false
      await tx.academicSession.updateMany({
        where: { id: { not: params.id } },
        data: { isCurrent: false },
      });

      // Activate target session
      await tx.academicSession.update({
        where: { id: params.id },
        data: {
          isCurrent: true,
          status: "ACTIVE",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "UPDATE",
          entityType: "AcademicSession",
          entityId: params.id,
          detailsJson: JSON.stringify({ action: "ACTIVATE_SESSION", sessionName: session.name }),
        },
      });
    });

    return NextResponse.json({ success: true, message: `সেশন '${session.name}' সক্রিয় করা হয়েছে।` });
  } catch (error: any) {
    return NextResponse.json({ error: "সেশন সক্রিয়করণ ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
