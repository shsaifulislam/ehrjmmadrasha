import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { generateNextAccessionNumber, generateCopyQrToken } from "@/lib/libraryEngine";

/**
 * GET /api/admin/library/copies
 * List copies with filters
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId") || "";
    const status = searchParams.get("status") || "";
    const condition = searchParams.get("condition") || "";
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (bookId) where.bookId = bookId;
    if (status && status !== "ALL") where.status = status;
    if (condition && condition !== "ALL") where.condition = condition;
    if (search) {
      where.OR = [
        { accessionNo: { contains: search } },
        { barcode: { contains: search } },
        { shelfLocation: { contains: search } },
        { book: { titleBn: { contains: search } } },
        { book: { titleEn: { contains: search } } },
      ];
    }

    const [total, copies] = await Promise.all([
      prisma.libraryBookCopy.count({ where }),
      prisma.libraryBookCopy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { accessionNo: "desc" },
        include: {
          book: {
            include: { category: true, author: true },
          },
          issues: {
            where: { status: { in: ["ISSUED", "OVERDUE"] } },
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
      }),
    ]);

    return NextResponse.json({
      copies,
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
 * POST /api/admin/library/copies
 * Add one or more physical copies to a book
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন নতুন কপি যোগ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      bookId,
      count = 1,
      condition = "GOOD",
      purchasePrice = 0,
      source = "PURCHASE",
      shelfLocation,
      notes,
    } = body;

    if (!bookId) {
      return NextResponse.json({ error: "বই আইডি আবশ্যক।" }, { status: 400 });
    }

    const book = await prisma.libraryBook.findUnique({ where: { id: bookId } });
    if (!book) {
      return NextResponse.json({ error: "বইটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const copiesToAdd = Math.max(1, Math.min(100, parseInt(count, 10) || 1));

    const createdCopies = await prisma.$transaction(async (tx) => {
      const list = [];
      for (let i = 0; i < copiesToAdd; i++) {
        const accessionNo = await generateNextAccessionNumber(tx);
        const qrToken = generateCopyQrToken();
        const barcode = `BC-${accessionNo}`;

        const copy = await tx.libraryBookCopy.create({
          data: {
            bookId,
            accessionNo,
            barcode,
            qrToken,
            condition,
            status: "AVAILABLE",
            purchasePrice: Number(purchasePrice) || 0,
            source,
            shelfLocation: shelfLocation || book.shelfLocation || null,
            notes,
          },
        });
        list.push(copy);
      }

      await recordAuditLog({
        userId: user.userId,
        action: "CREATE",
        entityType: "LibraryBookCopy",
        entityId: list[0].id,
        details: {
          bookId,
          bookTitle: book.titleBn,
          count: copiesToAdd,
          accessionRange: `${list[0].accessionNo} - ${list[list.length - 1].accessionNo}`,
        },
      });

      return list;
    });

    return NextResponse.json({ success: true, count: createdCopies.length, copies: createdCopies }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "কপি যোগ করতে ব্যর্থ।" }, { status: 500 });
  }
}
