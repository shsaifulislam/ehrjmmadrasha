import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INSTITUTION_INFO } from "@/lib/constants";

/**
 * GET /api/public/library/copy/[token]
 * Public QR Verification for a physical book copy
 * Privacy-safe: exposes NO borrower or student information
 */
export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ token: string }> }) {
  const params = await paramsPromise;
  try {
    const { token } = params;

    const copy = await prisma.libraryBookCopy.findUnique({
      where: { qrToken: token },
      include: {
        book: {
          include: {
            category: true,
            author: true,
            publisher: true,
          },
        },
      },
    });

    if (!copy) {
      return NextResponse.json({ error: "বইয়ের কপির তথ্য পাওয়া যায়নি অথবা কিউআর কোডটি সঠিক নয়।" }, { status: 404 });
    }

    return NextResponse.json({
      institution: {
        nameBn: INSTITUTION_INFO.nameBn,
        nameEn: INSTITUTION_INFO.nameEn,
        established: INSTITUTION_INFO.established || "2021",
        location: INSTITUTION_INFO.addressBn,
      },
      copy: {
        accessionNo: copy.accessionNo,
        barcode: copy.barcode,
        condition: copy.condition,
        status: copy.status === "AVAILABLE" ? "উপলব্ধ (AVAILABLE)" : "ইস্যুকৃত/অনুপলব্ধ",
        shelfLocation: copy.shelfLocation || copy.book.shelfLocation || "নির্ধারিত তাকে সংরক্ষিত",
      },
      book: {
        titleBn: copy.book.titleBn,
        titleEn: copy.book.titleEn,
        subtitle: copy.book.subtitle,
        edition: copy.book.edition,
        isbn: copy.book.isbn,
        language: copy.book.language,
        subject: copy.book.subject,
        author: copy.book.author.nameBn,
        category: copy.book.category.nameBn,
        publisher: copy.book.publisher?.name || "N/A",
        description: copy.book.description,
      },
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "যাচাইকরণে ত্রুটি।" }, { status: 500 });
  }
}
