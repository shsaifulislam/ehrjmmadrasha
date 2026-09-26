import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/finance/structures
 * List configurable fee structures
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const classId = searchParams.get("classId");
    const feeType = searchParams.get("feeType");

    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (classId) where.classId = classId;
    if (feeType) where.feeType = feeType;

    const structures = await prisma.feeStructure.findMany({
      where,
      include: {
        session: { select: { id: true, name: true } },
        jamatClass: { select: { id: true, nameBn: true, nameEn: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, structures });
  } catch (error: any) {
    console.error("Fee structures GET error:", error);
    return NextResponse.json({ error: "ফি কাঠামো লোড করা যায়নি।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/finance/structures
 * Create or update a fee structure
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন ফি কাঠামো নির্ধারণ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      sessionId,
      classId,
      residentialStatus = "ALL",
      feeType,
      nameBn,
      amount,
      isRecurring = false,
      billingMonth,
      dueDay = 10,
      lateFeeAmount = 0,
      lateFeeGraceDays = 5,
      fundCode = "GENERAL",
      isActive = true,
    } = body;

    if (!sessionId || !feeType || !nameBn || amount === undefined || Number(amount) < 0) {
      return NextResponse.json(
        { error: "সেশন, ফি ধরন, নাম এবং বৈধ টাকার পরিমাণ আবশ্যক।" },
        { status: 400 }
      );
    }

    let structure;
    if (id) {
      structure = await prisma.feeStructure.update({
        where: { id },
        data: {
          sessionId,
          classId: classId || null,
          residentialStatus,
          feeType,
          nameBn,
          amount: Number(amount),
          isRecurring: Boolean(isRecurring),
          billingMonth,
          dueDay: Number(dueDay),
          lateFeeAmount: Number(lateFeeAmount),
          lateFeeGraceDays: Number(lateFeeGraceDays),
          fundCode,
          isActive: Boolean(isActive),
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: "UPDATE_FEE_STRUCTURE",
        entityType: "FeeStructure",
        entityId: structure.id,
        details: { nameBn, amount: Number(amount), feeType },
      });
    } else {
      structure = await prisma.feeStructure.create({
        data: {
          sessionId,
          classId: classId || null,
          residentialStatus,
          feeType,
          nameBn,
          amount: Number(amount),
          isRecurring: Boolean(isRecurring),
          billingMonth,
          dueDay: Number(dueDay),
          lateFeeAmount: Number(lateFeeAmount),
          lateFeeGraceDays: Number(lateFeeGraceDays),
          fundCode,
          isActive: Boolean(isActive),
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: "CREATE_FEE_STRUCTURE",
        entityType: "FeeStructure",
        entityId: structure.id,
        details: { nameBn, amount: Number(amount), feeType },
      });
    }

    return NextResponse.json({
      success: true,
      message: "ফি কাঠামো সফলভাবে সংরক্ষিত হয়েছে।",
      structure,
    });
  } catch (error: any) {
    console.error("Fee structure POST error:", error);
    return NextResponse.json({ error: error.message || "ফি কাঠামো সংরক্ষণ ব্যর্থ।" }, { status: 500 });
  }
}
