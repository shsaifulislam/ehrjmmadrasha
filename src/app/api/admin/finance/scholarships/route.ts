import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/finance/scholarships
 * List all scholarships
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const scholarships = await prisma.scholarship.findMany({
      include: {
        _count: { select: { allocations: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, scholarships });
  } catch (error: any) {
    console.error("Scholarships GET error:", error);
    return NextResponse.json({ error: "বৃত্তি তালিকা লোড করা যায়নি।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/finance/scholarships
 * Create or update a scholarship program
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { id, nameBn, code, discountType = "PERCENTAGE", discountValue, applicableFeeType = "ALL", isActive = true } = body;

    if (!nameBn || !code || discountValue === undefined || Number(discountValue) <= 0) {
      return NextResponse.json({ error: "নাম, কোড এবং সঠিক ছাড়ের পরিমাণ আবশ্যক।" }, { status: 400 });
    }

    let scholarship;
    if (id) {
      scholarship = await prisma.scholarship.update({
        where: { id },
        data: {
          nameBn,
          code: code.toUpperCase(),
          discountType,
          discountValue: Number(discountValue),
          applicableFeeType,
          isActive: Boolean(isActive),
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: "UPDATE_SCHOLARSHIP",
        entityType: "Scholarship",
        entityId: scholarship.id,
        details: { nameBn, code, discountValue },
      });
    } else {
      scholarship = await prisma.scholarship.create({
        data: {
          nameBn,
          code: code.toUpperCase(),
          discountType,
          discountValue: Number(discountValue),
          applicableFeeType,
          isActive: Boolean(isActive),
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: "CREATE_SCHOLARSHIP",
        entityType: "Scholarship",
        entityId: scholarship.id,
        details: { nameBn, code, discountValue },
      });
    }

    return NextResponse.json({
      success: true,
      message: "মেধাবৃত্তি সফলভাবে সংরক্ষিত হয়েছে।",
      scholarship,
    });
  } catch (error: any) {
    console.error("Scholarship POST error:", error);
    return NextResponse.json({ error: error.message || "বৃত্তি সংরক্ষণ ব্যর্থ।" }, { status: 500 });
  }
}
