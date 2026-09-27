import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

/**
 * GET /api/admin/library/authors
 * List all authors
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const authors = await prisma.libraryAuthor.findMany({
      orderBy: { nameBn: "asc" },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });

    return NextResponse.json({ authors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার ত্রুটি।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/library/authors
 * Create a new author
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন লেখক যোগ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { nameBn, nameEn, nameAr, bio } = body;

    if (!nameBn) {
      return NextResponse.json({ error: "লেখকের বাংলা নাম আবশ্যক।" }, { status: 400 });
    }

    const author = await prisma.libraryAuthor.create({
      data: {
        nameBn,
        nameEn: nameEn || nameBn,
        nameAr,
        bio,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "CREATE",
      entityType: "LibraryAuthor",
      entityId: author.id,
      details: { nameBn, nameEn },
    });

    return NextResponse.json({ success: true, author }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "লেখক যোগ করতে ব্যর্থ।" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/library/authors
 * Update an author
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন লেখক সম্পাদনা করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { id, nameBn, nameEn, nameAr, bio, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "লেখক আইডি আবশ্যক।" }, { status: 400 });
    }

    const updated = await prisma.libraryAuthor.update({
      where: { id },
      data: {
        ...(nameBn !== undefined && { nameBn }),
        ...(nameEn !== undefined && { nameEn }),
        ...(nameAr !== undefined && { nameAr }),
        ...(bio !== undefined && { bio }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "UPDATE",
      entityType: "LibraryAuthor",
      entityId: id,
      details: { nameBn, isActive },
    });

    return NextResponse.json({ success: true, author: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "লেখক আপডেট ব্যর্থ।" }, { status: 500 });
  }
}
