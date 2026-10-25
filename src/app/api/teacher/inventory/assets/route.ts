import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const assets = await prisma.inventoryAsset.findMany({
      where: {
        assignedUserId: user.userId,
        status: { not: "DISPOSED" },
      },
      include: {
        item: {
          select: {
            id: true,
            itemCode: true,
            nameBn: true,
            nameEn: true,
            unit: true,
            category: { select: { nameBn: true } },
          },
        },
        location: {
          select: {
            id: true,
            nameBn: true,
            nameEn: true,
          },
        },
        assignments: {
          take: 5,
          orderBy: { assignmentDate: "desc" },
          select: {
            assignmentDate: true,
            reason: true,
            notes: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, assets });
  } catch (error: any) {
    console.error("Get teacher assigned assets error:", error);
    return NextResponse.json(
      { error: error.message || "বরাদ্দকৃত সম্পদের তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
