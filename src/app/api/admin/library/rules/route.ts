import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { ensureDefaultLibraryRules } from "@/lib/libraryEngine";

/**
 * GET /api/admin/library/rules
 * Fetch current rules for STUDENT and TEACHER
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    await ensureDefaultLibraryRules();
    const rules = await prisma.libraryRule.findMany({
      orderBy: { memberType: "asc" },
    });

    return NextResponse.json({ rules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার ত্রুটি।" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/library/rules
 * Update library circulation rules
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন লাইব্রেরি নীতিমালা পরিবর্তন করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      memberType,
      maxBooks,
      loanDays,
      renewalLimit,
      finePerDay,
      graceDays,
      lostChargeMultiplier,
      damagedChargeDefault,
      isActive,
    } = body;

    if (!memberType || (memberType !== "STUDENT" && memberType !== "TEACHER")) {
      return NextResponse.json({ error: "সদস্যের ধরন STUDENT অথবা TEACHER হতে হবে।" }, { status: 400 });
    }

    const updated = await prisma.libraryRule.upsert({
      where: { memberType },
      update: {
        ...(maxBooks !== undefined && { maxBooks: Number(maxBooks) }),
        ...(loanDays !== undefined && { loanDays: Number(loanDays) }),
        ...(renewalLimit !== undefined && { renewalLimit: Number(renewalLimit) }),
        ...(finePerDay !== undefined && { finePerDay: Number(finePerDay) }),
        ...(graceDays !== undefined && { graceDays: Number(graceDays) }),
        ...(lostChargeMultiplier !== undefined && { lostChargeMultiplier: Number(lostChargeMultiplier) }),
        ...(damagedChargeDefault !== undefined && { damagedChargeDefault: Number(damagedChargeDefault) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      create: {
        memberType,
        maxBooks: Number(maxBooks) || (memberType === "STUDENT" ? 2 : 5),
        loanDays: Number(loanDays) || (memberType === "STUDENT" ? 14 : 30),
        renewalLimit: Number(renewalLimit) || 1,
        finePerDay: Number(finePerDay) || (memberType === "STUDENT" ? 5 : 0),
        graceDays: Number(graceDays) || 1,
        lostChargeMultiplier: Number(lostChargeMultiplier) || 1.5,
        damagedChargeDefault: Number(damagedChargeDefault) || 50,
        isActive: true,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "UPDATE",
      entityType: "LibraryRule",
      entityId: updated.id,
      details: { memberType, maxBooks, loanDays, finePerDay },
    });

    return NextResponse.json({ success: true, rule: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "নীতিমালা আপডেট ব্যর্থ।" }, { status: 500 });
  }
}
