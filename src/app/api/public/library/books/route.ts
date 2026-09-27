import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/library/books
 * Public search for library catalog
 * Privacy-safe: exposes NO borrower or student information
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || "";
    const language = searchParams.get("language") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      status: "ACTIVE",
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (language) {
      where.language = language;
    }
    if (search) {
      where.OR = [
        { titleBn: { contains: search } },
        { titleEn: { contains: search } },
        { author: { nameBn: { contains: search } } },
        { author: { nameEn: { contains: search } } },
        { subject: { contains: search } },
        { isbn: { contains: search } },
      ];
    }

    const [total, books, categories] = await Promise.all([
      prisma.libraryBook.count({ where }),
      prisma.libraryBook.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          titleBn: true,
          titleEn: true,
          subtitle: true,
          edition: true,
          publicationYear: true,
          isbn: true,
          language: true,
          subject: true,
          shelfLocation: true,
          description: true,
          coverImage: true,
          isDigital: true,
          digitalUrl: true,
          digitalType: true,
          category: {
            select: { id: true, nameBn: true, nameEn: true },
          },
          author: {
            select: { id: true, nameBn: true, nameEn: true, nameAr: true },
          },
          publisher: {
            select: { id: true, name: true },
          },
          copies: {
            where: { status: "AVAILABLE" },
            select: { id: true },
          },
          _count: {
            select: { copies: true },
          },
        },
      }),
      prisma.libraryCategory.findMany({
        where: { isActive: true },
        select: { id: true, nameBn: true, nameEn: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const formattedBooks = books.map((b) => ({
      id: b.id,
      titleBn: b.titleBn,
      titleEn: b.titleEn,
      subtitle: b.subtitle,
      edition: b.edition,
      publicationYear: b.publicationYear,
      isbn: b.isbn,
      language: b.language,
      subject: b.subject,
      shelfLocation: b.shelfLocation,
      description: b.description,
      coverImage: b.coverImage,
      isDigital: b.isDigital,
      digitalUrl: b.isDigital ? b.digitalUrl : null,
      digitalType: b.digitalType,
      category: b.category,
      author: b.author,
      publisher: b.publisher,
      totalCopies: b._count.copies,
      availableCopies: b.copies.length,
      isAvailable: b.copies.length > 0,
    }));

    return NextResponse.json({
      books: formattedBooks,
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ক্যাটালগ লোড করতে ব্যর্থ।" }, { status: 500 });
  }
}
