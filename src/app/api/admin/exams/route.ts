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
    const sessionId = searchParams.get("sessionId");

    const exams = await prisma.exam.findMany({
      where: {
        ...(sessionId ? { sessionId } : {}),
      },
      orderBy: { startDate: "desc" },
      include: {
        session: { select: { id: true, name: true, isCurrent: true, status: true } },
        examTypeRef: { select: { id: true, code: true, nameBn: true, nameEn: true } },
        _count: {
          select: {
            examSubjects: true,
            examRoutines: true,
            results: true,
            examMarks: true,
          },
        },
      },
    });

    return NextResponse.json({ exams });
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
      sessionId,
      examTypeId,
      nameBn,
      nameEn,
      startDate,
      endDate,
      instructions,
      status = "DRAFT",
    } = body;

    if (!sessionId || !nameBn || !nameEn || !startDate || !endDate) {
      return NextResponse.json(
        { error: "শিক্ষাবর্ষ, পরীক্ষার বাংলা নাম, ইংরেজি নাম এবং তারিখ আবশ্যক।" },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = await prisma.academicSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return NextResponse.json({ error: "নির্বাচিত শিক্ষাবর্ষটি পাওয়া যায়নি।" }, { status: 404 });
    }

    let examTypeCode = "GENERAL";
    if (examTypeId) {
      const et = await prisma.examType.findUnique({ where: { id: examTypeId } });
      if (et) examTypeCode = et.code;
    }

    const exam = await prisma.exam.create({
      data: {
        sessionId,
        examTypeId: examTypeId || null,
        examType: examTypeCode,
        nameBn: nameBn.trim(),
        nameEn: nameEn.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        instructions: instructions ? instructions.trim() : null,
        status,
        isPublished: status === "PUBLISHED",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
      include: {
        session: true,
        examTypeRef: true,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "EXAM_CREATED",
      entityType: "Exam",
      entityId: exam.id,
      details: { nameBn: exam.nameBn, sessionId: exam.sessionId, status: exam.status },
    });

    return NextResponse.json({ exam, message: "পরীক্ষা সফলভাবে তৈরি হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}
