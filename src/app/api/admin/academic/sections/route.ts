import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const sections = await prisma.section.findMany({
      where: {
        ...(classId ? { classId } : {}),
      },
      include: {
        jamatClass: {
          select: {
            id: true,
            nameBn: true,
            nameEn: true,
            code: true,
            genderType: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { nameBn: "asc" },
    });

    return NextResponse.json({ success: true, sections });
  } catch (error: any) {
    console.error("GET Sections API Error:", error);
    return NextResponse.json({ error: "শাখা তালিকা লোড করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন এই কাজ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { classId, nameBn, nameEn, roomNo, maxCapacity = 50 } = body;

    if (!classId || !nameBn) {
      return NextResponse.json(
        { error: "জামাত/শ্রেণি নির্বাচন এবং শাখার নাম আবশ্যক।" },
        { status: 400 }
      );
    }

    const targetClass = await prisma.jamatClass.findUnique({
      where: { id: classId },
    });
    if (!targetClass) {
      return NextResponse.json({ error: "নির্বাচিত শ্রেণি পাওয়া যায়নি।" }, { status: 404 });
    }

    const section = await prisma.section.create({
      data: {
        classId,
        nameBn: nameBn.trim(),
        nameEn: nameEn?.trim() || nameBn.trim(),
        roomNo: roomNo ? String(roomNo).trim() : null,
        maxCapacity: Number(maxCapacity) || 50,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "CREATE",
        entityType: "Section",
        entityId: section.id,
        detailsJson: JSON.stringify({ nameBn: section.nameBn, class: targetClass.nameBn }),
      },
    });

    return NextResponse.json({ success: true, section });
  } catch (error: any) {
    console.error("POST Section Error:", error);
    return NextResponse.json({ error: error.message || "শাখা তৈরি করতে ত্রুটি।" }, { status: 500 });
  }
}
