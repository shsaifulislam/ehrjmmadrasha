import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { generateNextAccessionNumber, generateCopyQrToken } from "@/lib/libraryEngine";

/**
 * GET /api/admin/library/books
 * List books with filters, pagination, and copy statistics
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || "";
    const authorId = searchParams.get("authorId") || "";
    const language = searchParams.get("language") || "";
    const status = searchParams.get("status") || "ACTIVE";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (authorId) {
      where.authorId = authorId;
    }
    if (language) {
      where.language = language;
    }
    if (search) {
      where.OR = [
        { titleBn: { contains: search } },
        { titleEn: { contains: search } },
        { isbn: { contains: search } },
        { subject: { contains: search } },
        { shelfLocation: { contains: search } },
        { author: { nameBn: { contains: search } } },
      ];
    }

    const [total, books] = await Promise.all([
      prisma.libraryBook.count({ where }),
      prisma.libraryBook.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          author: true,
          publisher: true,
          copies: {
            select: {
              id: true,
              accessionNo: true,
              barcode: true,
              status: true,
              condition: true,
            },
          },
        },
      }),
    ]);

    const formattedBooks = books.map((book) => {
      const totalCopies = book.copies.length;
      const availableCopies = book.copies.filter((c) => c.status === "AVAILABLE").length;
      const issuedCopies = book.copies.filter((c) => c.status === "ISSUED").length;
      const lostCopies = book.copies.filter((c) => c.status === "LOST").length;
      const damagedCopies = book.copies.filter((c) => c.status === "DAMAGED" || c.status === "REPAIR").length;

      return {
        ...book,
        stats: {
          totalCopies,
          availableCopies,
          issuedCopies,
          lostCopies,
          damagedCopies,
        },
      };
    });

    return NextResponse.json({
      books: formattedBooks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার ত্রুটি।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/library/books
 * Create a new book title, with optional initial copies
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন নতুন বই এন্ট্রি করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
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
      language = "BANGLA",
      subject,
      shelfLocation,
      description,
      coverImage,
      acquisitionInfo,
      notes,
      isDigital = false,
      digitalUrl,
      digitalType,
      accessRestricted = false,
      copyrightInfo,
      initialCopiesCount = 0,
      initialPurchasePrice = 0,
      initialCondition = "GOOD",
      initialSource = "PURCHASE",
    } = body;

    if (!titleBn || !titleEn || !categoryId || !authorId) {
      return NextResponse.json(
        { error: "বইয়ের বাংলা নাম, ইংরেজি নাম, ক্যাটাগরি ও লেখক আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Book Record
      const book = await tx.libraryBook.create({
        data: {
          titleBn,
          titleEn,
          subtitle,
          categoryId,
          authorId,
          publisherId: publisherId || null,
          edition,
          publicationYear: publicationYear ? Number(publicationYear) : null,
          isbn: isbn?.trim() || null,
          language,
          subject,
          shelfLocation,
          description,
          coverImage,
          acquisitionInfo,
          notes,
          isDigital: Boolean(isDigital),
          digitalUrl,
          digitalType,
          accessRestricted: Boolean(accessRestricted),
          copyrightInfo,
          status: "ACTIVE",
        },
        include: {
          category: true,
          author: true,
          publisher: true,
        },
      });

      // 2. Generate Initial Copies if requested
      const copiesCount = Math.max(0, parseInt(initialCopiesCount, 10) || 0);
      const createdCopies = [];

      for (let i = 0; i < copiesCount; i++) {
        const accessionNo = await generateNextAccessionNumber(tx);
        const qrToken = generateCopyQrToken();
        const barcode = `BC-${accessionNo}`;

        const copy = await tx.libraryBookCopy.create({
          data: {
            bookId: book.id,
            accessionNo,
            barcode,
            qrToken,
            condition: initialCondition,
            status: "AVAILABLE",
            purchasePrice: Number(initialPurchasePrice) || 0,
            source: initialSource,
            shelfLocation: shelfLocation || null,
          },
        });
        createdCopies.push(copy);
      }

      // 3. Record Audit Log
      await recordAuditLog({
        userId: user.userId,
        action: "CREATE",
        entityType: "LibraryBook",
        entityId: book.id,
        details: {
          titleBn: book.titleBn,
          titleEn: book.titleEn,
          categoryId,
          authorId,
          initialCopiesCount: copiesCount,
        },
      });

      return { book, copies: createdCopies };
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "বই এন্ট্রি করতে ব্যর্থ।" }, { status: 500 });
  }
}
