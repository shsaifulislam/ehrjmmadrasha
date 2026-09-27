import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

/**
 * GET /api/admin/library/categories
 * List all library categories
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const categories = await prisma.libraryCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: { books: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার ত্রুটি।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/library/categories
 * Create a new library category
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন ক্যাটাগরি তৈরি করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { nameBn, nameEn, description, sortOrder = 0 } = body;

    if (!nameBn || !nameEn) {
      return NextResponse.json({ error: "বাংলা ও ইংরেজি উভয় নাম আবশ্যক।" }, { status: 400 });
    }

    const category = await prisma.libraryCategory.create({
      data: {
        nameBn,
        nameEn,
        description,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "CREATE",
      entityType: "LibraryCategory",
      entityId: category.id,
      details: { nameBn, nameEn },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ক্যাটাগরি তৈরিতে ব্যর্থ।" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/library/categories
 * Update a library category
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন ক্যাটাগরি পরিবর্তন করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { id, nameBn, nameEn, description, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ক্যাটাগরি আইডি আবশ্যক।" }, { status: 400 });
    }

    const updated = await prisma.libraryCategory.update({
      where: { id },
      data: {
        ...(nameBn !== undefined && { nameBn }),
        ...(nameEn !== undefined && { nameEn }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "UPDATE",
      entityType: "LibraryCategory",
      entityId: id,
      details: { nameBn, nameEn, isActive },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ক্যাটাগরি আপডেট ব্যর্থ।" }, { status: 500 });
  }
}
