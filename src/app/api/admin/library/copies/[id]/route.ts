import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

/**
 * GET /api/admin/library/copies/[id]
 * Get physical copy details, condition history, and circulation history
 */
export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { id } = params;
    const copy = await prisma.libraryBookCopy.findUnique({
      where: { id },
      include: {
        book: {
          include: { category: true, author: true, publisher: true },
        },
        conditionHistories: {
          orderBy: { createdAt: "desc" },
          include: {
            recordedByUser: { select: { id: true, name: true, role: true } },
          },
        },
        issues: {
          orderBy: { createdAt: "desc" },
          include: {
            member: {
              include: {
                student: { select: { id: true, fullNameBn: true, studentIdNumber: true } },
                user: { select: { id: true, name: true, role: true } },
              },
            },
            issuedByUser: { select: { id: true, name: true } },
            invoice: true,
          },
        },
      },
    });

    if (!copy) {
      return NextResponse.json({ error: "কপিটি পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ copy });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার ত্রুটি।" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/library/copies/[id]
 * Update copy details
 */
export async function PUT(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন কপি সম্পাদন করতে পারেন।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { shelfLocation, condition, purchasePrice, source, notes, status } = body;

    const existing = await prisma.libraryBookCopy.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "কপিটি পাওয়া যায়নি।" }, { status: 404 });
    }

    // If condition changed, record in history
    if (condition && condition !== existing.condition) {
      await prisma.libraryConditionHistory.create({
        data: {
          copyId: id,
          recordedByUserId: user.userId,
          oldCondition: existing.condition,
          newCondition: condition,
          reason: notes || "ম্যানুয়াল কন্ডিশন আপডেট",
        },
      });
    }

    const updated = await prisma.libraryBookCopy.update({
      where: { id },
      data: {
        ...(shelfLocation !== undefined && { shelfLocation }),
        ...(condition !== undefined && { condition }),
        ...(purchasePrice !== undefined && { purchasePrice: Number(purchasePrice) }),
        ...(source !== undefined && { source }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
      include: {
        book: true,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "UPDATE",
      entityType: "LibraryBookCopy",
      entityId: id,
      details: { accessionNo: updated.accessionNo, status: updated.status, condition: updated.condition },
    });

    return NextResponse.json({ success: true, copy: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "কপি আপডেট ব্যর্থ।" }, { status: 500 });
  }
}
