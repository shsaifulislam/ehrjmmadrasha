import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

/**
 * GET /api/admin/library/books/[id]
 * Get book details with copies and circulation history
 */
export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { id } = params;
    const book = await prisma.libraryBook.findUnique({
      where: { id },
      include: {
        category: true,
        author: true,
        publisher: true,
        copies: {
          orderBy: { accessionNo: "asc" },
          include: {
            issues: {
              take: 5,
              orderBy: { createdAt: "desc" },
              include: {
                member: {
                  include: {
                    student: { select: { id: true, fullNameBn: true, studentIdNumber: true } },
                    user: { select: { id: true, name: true, role: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "বইটি পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ book });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার ত্রুটি।" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/library/books/[id]
 * Update book details
 */
export async function PUT(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন বই সম্পাদন করতে পারেন।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.libraryBook.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "বইটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const {
      titleBn,
      titleEn,
      subtitle,
      categoryId,
      authorId,
      publisherId,
      edition,
      publicationYear,
      isbn,
      language,
      subject,
      shelfLocation,
      description,
      coverImage,
      acquisitionInfo,
      notes,
      isDigital,
      digitalUrl,
      digitalType,
      accessRestricted,
      copyrightInfo,
      status,
    } = body;

    const updated = await prisma.libraryBook.update({
      where: { id },
      data: {
        ...(titleBn !== undefined && { titleBn }),
        ...(titleEn !== undefined && { titleEn }),
        ...(subtitle !== undefined && { subtitle }),
        ...(categoryId !== undefined && { categoryId }),
        ...(authorId !== undefined && { authorId }),
        ...(publisherId !== undefined && { publisherId: publisherId || null }),
        ...(edition !== undefined && { edition }),
        ...(publicationYear !== undefined && { publicationYear: publicationYear ? Number(publicationYear) : null }),
        ...(isbn !== undefined && { isbn }),
        ...(language !== undefined && { language }),
        ...(subject !== undefined && { subject }),
        ...(shelfLocation !== undefined && { shelfLocation }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(acquisitionInfo !== undefined && { acquisitionInfo }),
        ...(notes !== undefined && { notes }),
        ...(isDigital !== undefined && { isDigital: Boolean(isDigital) }),
        ...(digitalUrl !== undefined && { digitalUrl }),
        ...(digitalType !== undefined && { digitalType }),
        ...(accessRestricted !== undefined && { accessRestricted: Boolean(accessRestricted) }),
        ...(copyrightInfo !== undefined && { copyrightInfo }),
        ...(status !== undefined && { status }),
      },
      include: {
        category: true,
        author: true,
        publisher: true,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "UPDATE",
      entityType: "LibraryBook",
      entityId: id,
      details: { titleBn: updated.titleBn, status: updated.status },
    });

    return NextResponse.json({ success: true, book: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "বই আপডেট ব্যর্থ।" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/library/books/[id]
 * Archive book if no copies are currently ISSUED
 */
export async function DELETE(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { id } = params;
    const activeIssues = await prisma.libraryIssue.count({
      where: {
        bookId: id,
        status: { in: ["ISSUED", "OVERDUE"] },
      },
    });

    if (activeIssues > 0) {
      return NextResponse.json(
        { error: `বইটির ${activeIssues}টি কপি বর্তমানে ধার নেওয়া আছে। ফেরত না দেওয়া পর্যন্ত আর্কাইভ করা যাবে না।` },
        { status: 400 }
      );
    }

    const updated = await prisma.libraryBook.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "UPDATE",
      entityType: "LibraryBook",
      entityId: id,
      details: { action: "ARCHIVE" },
    });

    return NextResponse.json({ success: true, message: "বইটি সফলভাবে আর্কাইভ করা হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "আর্কাইভ ব্যর্থ।" }, { status: 500 });
  }
}
