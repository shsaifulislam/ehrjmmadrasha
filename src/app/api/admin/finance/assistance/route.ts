import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/finance/assistance
 * List financial assistance applications
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const sessionId = searchParams.get("sessionId");

    const where: any = {};
    if (status) where.status = status;
    if (sessionId) where.sessionId = sessionId;

    const assistances = await prisma.financialAssistance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            fullNameEn: true,
            residentialStatus: true,
            isOrphan: true,
            enrollments: {
              where: { status: "ACTIVE" },
              select: {
                rollNumber: true,
                jamatClass: { select: { nameBn: true } },
              },
              take: 1,
            },
          },
        },
        session: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, assistances });
  } catch (error: any) {
    console.error("Assistance GET error:", error);
    return NextResponse.json({ error: "আর্থিক সহায়তার তালিকা লোড ব্যর্থ।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/finance/assistance
 * Admin review, approve, or reject financial assistance
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন আর্থিক সহায়তা অনুমোদন করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      action, // APPROVE, REJECT
      waiverPercentage = 0,
      waiverAmount = 0,
      feeCategoryTarget = "ALL",
      reason,
      validMonths = 12,
    } = body;

    if (!id || !action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "আবেদন আইডি এবং সিদ্ধান্ত (APPROVE/REJECT) আবশ্যক।" }, { status: 400 });
    }

    const assistance = await prisma.financialAssistance.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!assistance) {
      return NextResponse.json({ error: "আর্থিক সহায়তা আবেদন পাওয়া যায়নি।" }, { status: 404 });
    }

    const validFrom = new Date();
    const validTo = new Date(validFrom.getTime() + Number(validMonths) * 30 * 24 * 60 * 60 * 1000);

    const updated = await prisma.financialAssistance.update({
      where: { id },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        waiverPercentage: action === "APPROVE" ? Number(waiverPercentage) : 0,
        waiverAmount: action === "APPROVE" ? Number(waiverAmount) : 0,
        feeCategoryTarget: action === "APPROVE" ? feeCategoryTarget : null,
        approvedByUserId: user.userId,
        reason: reason || assistance.reason,
        validFrom,
        validTo,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: action === "APPROVE" ? "APPROVE_FINANCIAL_ASSISTANCE" : "REJECT_FINANCIAL_ASSISTANCE",
      entityType: "FinancialAssistance",
      entityId: assistance.id,
      details: {
        studentId: assistance.studentId,
        studentName: assistance.student.fullNameBn,
        decision: action,
        waiverPercentage: Number(waiverPercentage),
        waiverAmount: Number(waiverAmount),
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: `আর্থিক সহায়তা আবেদন সফলভাবে ${action === "APPROVE" ? "অনুমোদিত" : "প্রত্যাখ্যাত"} হয়েছে।`,
      assistance: updated,
    });
  } catch (error: any) {
    console.error("Assistance POST error:", error);
    return NextResponse.json({ error: error.message || "সিদ্ধান্ত সংরক্ষণে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
