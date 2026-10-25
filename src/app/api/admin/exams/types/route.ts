import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const types = await prisma.examType.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: { exams: true },
        },
      },
    });

    return NextResponse.json({ examTypes: types });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const body = await req.json();
    const { code, nameBn, nameEn, sortOrder = 0 } = body;

    if (!code || !nameBn || !nameEn) {
      return NextResponse.json({ error: "পরীক্ষার ধরনের কোড, বাংলা ও ইংরেজি নাম আবশ্যক।" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "_");

    const existing = await prisma.examType.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json({ error: "এই কোডের একটি পরীক্ষার ধরন ইতিমধ্যে বিদ্যমান।" }, { status: 409 });
    }

    const newType = await prisma.examType.create({
      data: {
        code: cleanCode,
        nameBn: nameBn.trim(),
        nameEn: nameEn.trim(),
        sortOrder: Number(sortOrder) || 0,
        isActive: true,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "EXAM_TYPE_CREATED",
      entityType: "ExamType",
      entityId: newType.id,
      details: { code: newType.code, nameBn: newType.nameBn },
    });

    return NextResponse.json({ examType: newType, message: "পরীক্ষার ধরন সফলভাবে তৈরি হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const body = await req.json();
    const { id, nameBn, nameEn, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "আইডি আবশ্যক।" }, { status: 400 });
    }

    const updated = await prisma.examType.update({
      where: { id },
      data: {
        ...(nameBn ? { nameBn: nameBn.trim() } : {}),
        ...(nameEn ? { nameEn: nameEn.trim() } : {}),
        ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return NextResponse.json({ examType: updated, message: "পরীক্ষার ধরন সফলভাবে হালনাগাদ হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "আইডি আবশ্যক।" }, { status: 400 });
    }

    const existing = await prisma.examType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { exams: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "পরীক্ষার ধরন পাওয়া যায়নি।" }, { status: 404 });
    }

    if (existing._count.exams > 0) {
      return NextResponse.json(
        { error: "এই ধরনের অধীনে ইতিমধ্যে পরীক্ষা তৈরি করা রয়েছে। এটি মুছে ফেলা সম্ভব নয়।" },
        { status: 400 }
      );
    }

    await prisma.examType.delete({ where: { id } });

    await recordAuditLog({
      userId: user.userId,
      action: "EXAM_TYPE_DELETED",
      entityType: "ExamType",
      entityId: id,
      details: { code: existing.code, nameBn: existing.nameBn },
    });

    return NextResponse.json({ message: "পরীক্ষার ধরন সফলভাবে অপসারিত হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}

