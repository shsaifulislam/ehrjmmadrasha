import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: {
        session: true,
        examTypeRef: true,
        examSubjects: {
          include: {
            jamatClass: true,
            subject: true,
          },
          orderBy: { examDate: "asc" },
        },
        examRoutines: {
          include: {
            jamatClass: true,
            section: true,
            subject: true,
          },
          orderBy: [{ examDate: "asc" }, { startTime: "asc" }],
        },
        _count: {
          select: {
            examMarks: true,
            results: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "পরীক্ষাটি পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ exam });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const body = await req.json();
    const { nameBn, nameEn, examTypeId, startDate, endDate, instructions, status } = body;

    const existing = await prisma.exam.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "পরীক্ষাটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (nameBn) dataToUpdate.nameBn = nameBn.trim();
    if (nameEn) dataToUpdate.nameEn = nameEn.trim();
    if (examTypeId !== undefined) dataToUpdate.examTypeId = examTypeId || null;
    if (startDate) dataToUpdate.startDate = new Date(startDate);
    if (endDate) dataToUpdate.endDate = new Date(endDate);
    if (instructions !== undefined) dataToUpdate.instructions = instructions ? instructions.trim() : null;

    if (status && status !== existing.status) {
      dataToUpdate.status = status;
      if (status === "PUBLISHED") {
        dataToUpdate.isPublished = true;
        if (!existing.publishedAt) {
          dataToUpdate.publishedAt = new Date();
        }
      } else if (status === "CLOSED") {
        dataToUpdate.isPublished = true;
      } else {
        dataToUpdate.isPublished = false;
      }
    }

    const updated = await prisma.exam.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        session: true,
        examTypeRef: true,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "EXAM_UPDATED",
      entityType: "Exam",
      entityId: updated.id,
      details: {
        previousStatus: existing.status,
        newStatus: updated.status,
        nameBn: updated.nameBn,
      },
    });

    return NextResponse.json({ exam: updated, message: "পরীক্ষার তথ্য সফলভাবে হালনাগাদ হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const existing = await prisma.exam.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            results: true,
            examMarks: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "পরীক্ষাটি পাওয়া যায়নি।" }, { status: 404 });
    }

    if (existing._count.results > 0 || existing._count.examMarks > 0) {
      return NextResponse.json(
        { error: "এই পরীক্ষায় ইতিমধ্যে ফলাফল বা নম্বর সংরক্ষিত রয়েছে। এটি মুছে ফেলা সম্ভব নয়।" },
        { status: 400 }
      );
    }

    await prisma.exam.delete({
      where: { id: params.id },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "EXAM_DELETED",
      entityType: "Exam",
      entityId: params.id,
      details: { nameBn: existing.nameBn },
    });

    return NextResponse.json({ message: "পরীক্ষা সফলভাবে মুছে ফেলা হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}
