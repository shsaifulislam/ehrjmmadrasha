import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন বা অধ্যক্ষের জন্য প্রযোজ্য।" }, { status: 403 });
    }

    const classes = await prisma.jamatClass.findMany({
      include: {
        sections: {
          orderBy: { nameBn: "asc" },
        },
        _count: {
          select: {
            enrollments: true,
            sections: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, classes });
  } catch (error: any) {
    console.error("GET Classes API Error:", error);
    return NextResponse.json({ error: "শ্রেণি তালিকা লোড করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন এই কাজ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { nameBn, nameEn, nameAr, code, genderType = "COMBINED", sortOrder = 0, isActive = true } = body;

    if (!nameBn || !code) {
      return NextResponse.json(
        { error: "জামাত/শ্রেণির বাংলা নাম এবং ইউনিক কোড আবশ্যক।" },
        { status: 400 }
      );
    }

    // Check duplicate code
    const existing = await prisma.jamatClass.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "এই কোডটি ইতিমধ্যে অন্য একটি জামাত/শ্রেণিতে ব্যবহৃত হচ্ছে।" },
        { status: 400 }
      );
    }

    const jamat = await prisma.$transaction(async (tx) => {
      const created = await tx.jamatClass.create({
        data: {
          nameBn: nameBn.trim(),
          nameEn: nameEn?.trim() || nameBn.trim(),
          nameAr: nameAr?.trim() || null,
          code: code.trim().toUpperCase(),
          genderType: genderType || "COMBINED",
          sortOrder: Number(sortOrder) || 0,
          isActive: Boolean(isActive),
        },
      });

      // Automatically create a default "ক শাখা" (Section A) if requested
      await tx.section.create({
        data: {
          classId: created.id,
          nameBn: "ক শাখা",
          nameEn: "Section A",
          maxCapacity: 60,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "CREATE",
          entityType: "JamatClass",
          entityId: created.id,
          detailsJson: JSON.stringify({ nameBn: created.nameBn, code: created.code, genderType: created.genderType }),
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, jamatClass: jamat });
  } catch (error: any) {
    console.error("POST Class Error:", error);
    return NextResponse.json({ error: error.message || "শ্রেণি যোগ করতে ত্রুটি।" }, { status: 500 });
  }
}
