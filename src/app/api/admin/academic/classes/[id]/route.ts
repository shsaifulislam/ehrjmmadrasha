import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const jamat = await prisma.jamatClass.findUnique({
      where: { id: params.id },
      include: {
        sections: true,
        subjects: true,
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!jamat) {
      return NextResponse.json({ error: "শ্রেণি পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, jamatClass: jamat });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন এই পরিবর্তন করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { nameBn, nameEn, nameAr, code, genderType, sortOrder, isActive } = body;

    const existing = await prisma.jamatClass.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "শ্রেণি পাওয়া যায়নি।" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cls = await tx.jamatClass.update({
        where: { id: params.id },
        data: {
          ...(nameBn ? { nameBn: nameBn.trim() } : {}),
          ...(nameEn ? { nameEn: nameEn.trim() } : {}),
          ...(nameAr !== undefined ? { nameAr: nameAr ? nameAr.trim() : null } : {}),
          ...(code ? { code: code.trim().toUpperCase() } : {}),
          ...(genderType ? { genderType } : {}),
          ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "UPDATE",
          entityType: "JamatClass",
          entityId: cls.id,
          detailsJson: JSON.stringify({ old: existing, updated: cls }),
        },
      });

      return cls;
    });

    return NextResponse.json({ success: true, jamatClass: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "শ্রেণি আপডেট করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const enrollmentCount = await prisma.enrollment.count({
      where: { classId: params.id },
    });

    if (enrollmentCount > 0) {
      return NextResponse.json(
        {
          error: `এই জামাত/শ্রেণিতে ${enrollmentCount} জন ছাত্রের ভর্তি রেকর্ড রয়েছে। ঐতিহাসিক ডেটা সুরক্ষার জন্য এটি মুছে ফেলা যাবে না; প্রয়োজনে নিষ্ক্রিয় (Inactive) করুন।`,
        },
        { status: 400 }
      );
    }

    await prisma.jamatClass.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "শ্রেণি সফলভাবে মুছে ফেলা হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: "মুছে ফেলতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
