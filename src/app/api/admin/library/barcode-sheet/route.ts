import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { INSTITUTION_INFO } from "@/lib/constants";

/**
 * POST /api/admin/library/barcode-sheet
 * Returns printable barcode and QR label data for physical book copies
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { copyIds, bookId } = body;

    const where: any = {};
    if (Array.isArray(copyIds) && copyIds.length > 0) {
      where.id = { in: copyIds };
    } else if (bookId) {
      where.bookId = bookId;
    } else {
      return NextResponse.json({ error: "কমপক্ষে একটি কপি বা বই নির্বাচন করুন।" }, { status: 400 });
    }

    const copies = await prisma.libraryBookCopy.findMany({
      where,
      orderBy: { accessionNo: "asc" },
      include: {
        book: {
          include: {
            category: true,
            author: true,
          },
        },
      },
    });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const labels = copies.map((copy) => ({
      id: copy.id,
      accessionNo: copy.accessionNo,
      barcode: copy.barcode,
      bookTitleBn: copy.book.titleBn,
      bookTitleEn: copy.book.titleEn,
      authorNameBn: copy.book.author.nameBn,
      categoryNameBn: copy.book.category.nameBn,
      shelfLocation: copy.shelfLocation || copy.book.shelfLocation || "N/A",
      qrVerifyUrl: `${baseUrl}/library/verify/copy/${copy.qrToken}`,
      institutionNameBn: INSTITUTION_INFO.nameBn,
      institutionNameEn: INSTITUTION_INFO.nameEn,
    }));

    return NextResponse.json({ labels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "বারকোড ডেটা তৈরিতে ব্যর্থ।" }, { status: 500 });
  }
}
