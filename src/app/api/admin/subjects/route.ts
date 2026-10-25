import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }
    if (user.role !== "ADMIN" && user.role !== "PRINCIPAL") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস: এই তথ্য শুধুমাত্র অ্যাডমিন বা অধ্যক্ষের জন্য সংরক্ষিত।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const subjects = await prisma.subject.findMany({
      where: {
        ...(classId ? { classId } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { nameBn: "asc" }],
      include: {
        jamatClass: { select: { id: true, nameBn: true, nameEn: true, code: true } },
        _count: {
          select: {
            examMarks: true,
            examSubjects: true,
            examRoutines: true,
          },
        },
      },
    });

    return NextResponse.json({ subjects });
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
    const {
      classId,
      nameBn,
      nameEn,
      nameAr,
      code,
      fullMarks = 100,
      passMarks = 33,
      isOptional = false,
      sortOrder = 0,
    } = body;

    if (!classId || !nameBn || !nameEn || !code) {
      return NextResponse.json(
        { error: "জামাত, বিষয়ের বাংলা ও ইংরেজি নাম এবং বিষয় কোড আবশ্যক।" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Verify class exists
    const jamatClass = await prisma.jamatClass.findUnique({ where: { id: classId } });
    if (!jamatClass) {
      return NextResponse.json({ error: "নির্বাচিত জামাত পাওয়া যায়নি।" }, { status: 404 });
    }

    // Check duplicate code in same class
    const existing = await prisma.subject.findFirst({
      where: { classId, code: cleanCode },
    });
    if (existing) {
      return NextResponse.json({ error: "এই জামাতে এই বিষয়ের কোড ইতিমধ্যে বিদ্যমান।" }, { status: 409 });
    }

    const subject = await prisma.subject.create({
      data: {
        classId,
        nameBn: nameBn.trim(),
        nameEn: nameEn.trim(),
        nameAr: nameAr ? nameAr.trim() : null,
        code: cleanCode,
        fullMarks: Number(fullMarks) || 100,
        passMarks: Number(passMarks) || 33,
        isOptional: Boolean(isOptional),
        sortOrder: Number(sortOrder) || 0,
        isActive: true,
      },
      include: {
        jamatClass: true,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "SUBJECT_CREATED",
      entityType: "Subject",
      entityId: subject.id,
      details: { nameBn: subject.nameBn, code: subject.code, classId: subject.classId },
    });

    return NextResponse.json({ subject, message: "বিষয় সফলভাবে তৈরি হয়েছে।" });
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
    const { id, nameBn, nameEn, nameAr, fullMarks, passMarks, isOptional, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "বিষয় আইডি আবশ্যক।" }, { status: 400 });
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        ...(nameBn ? { nameBn: nameBn.trim() } : {}),
        ...(nameEn ? { nameEn: nameEn.trim() } : {}),
        ...(nameAr !== undefined ? { nameAr: nameAr ? nameAr.trim() : null } : {}),
        ...(fullMarks !== undefined ? { fullMarks: Number(fullMarks) } : {}),
        ...(passMarks !== undefined ? { passMarks: Number(passMarks) } : {}),
        ...(isOptional !== undefined ? { isOptional: Boolean(isOptional) } : {}),
        ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
      include: {
        jamatClass: true,
      },
    });

    return NextResponse.json({ subject: updated, message: "বিষয় সফলভাবে হালনাগাদ হয়েছে।" });
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
      return NextResponse.json({ error: "বিষয় আইডি আবশ্যক।" }, { status: 400 });
    }

    const existing = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            examMarks: true,
            examSubjects: true,
            examRoutines: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "বিষয়টি পাওয়া যায়নি।" }, { status: 404 });
    }

    if (existing._count.examMarks > 0) {
      return NextResponse.json(
        { error: "এই বিষয়ে ইতিমধ্যে পরীক্ষার প্রাপ্ত নম্বর সংরক্ষিত রয়েছে। এটি মুছে ফেলা সম্ভব নয়।" },
        { status: 400 }
      );
    }

    // Clean up dependent exam subjects/routines if safe
    if (existing._count.examSubjects > 0) {
      await prisma.examSubject.deleteMany({ where: { subjectId: id } });
    }
    if (existing._count.examRoutines > 0) {
      await prisma.examRoutine.deleteMany({ where: { subjectId: id } });
    }

    await prisma.subject.delete({ where: { id } });

    await recordAuditLog({
      userId: user.userId,
      action: "SUBJECT_DELETED",
      entityType: "Subject",
      entityId: id,
      details: { nameBn: existing.nameBn, code: existing.code },
    });

    return NextResponse.json({ message: "বিষয় সফলভাবে অপসারিত হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}

