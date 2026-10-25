import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId: params.id },
      include: {
        session: { select: { id: true, name: true, isCurrent: true } },
        section: {
          select: {
            id: true,
            nameBn: true,
            nameEn: true,
            jamatClass: { select: { id: true, nameBn: true, nameEn: true, code: true } },
          },
        },
        subject: {
          select: {
            id: true,
            nameBn: true,
            nameEn: true,
            code: true,
            fullMarks: true,
            passMarks: true,
            jamatClass: { select: { id: true, nameBn: true, nameEn: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error: any) {
    console.error("GET Teacher Assignments Error:", error);
    return NextResponse.json({ error: "অ্যাসাইনমেন্ট লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন ক্লাস ও বিষয় বরাদ্দ করতে পারেন।" }, { status: 403 });
    }

    const clientIp = getClientIp(req);
    const body = await req.json();
    const { sessionId, classId, sectionId, subjectId } = body;

    if (!classId) {
      return NextResponse.json(
        { error: "জামাত বা শ্রেণি নির্বাচন করা আবশ্যক।" },
        { status: 400 }
      );
    }

    let resolvedSessionId = sessionId;
    if (!resolvedSessionId) {
      const activeSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
      resolvedSessionId = activeSession?.id;
    }

    if (!resolvedSessionId) {
      return NextResponse.json(
        { error: "কোনো সক্রিয় শিক্ষাবর্ষ পাওয়া যায়নি।" },
        { status: 400 }
      );
    }

    const teacher = await prisma.user.findFirst({
      where: { id: params.id, role: "TEACHER" },
    });

    if (!teacher) {
      return NextResponse.json({ error: "উস্তাদ/শিক্ষকের তথ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    // Check duplicate assignment
    const existing = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacher.id,
        sessionId: resolvedSessionId,
        classId,
        sectionId: sectionId || null,
        subjectId: subjectId || null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "এই জামাত/শাখা ও বিষয়ের দায়িত্ব ইতিপূর্বেই এই উস্তাদকে বরাদ্দ করা হয়েছে।" },
        { status: 400 }
      );
    }

    const assignment = await prisma.teacherAssignment.create({
      data: {
        teacherId: teacher.id,
        sessionId: resolvedSessionId,
        classId,
        sectionId: sectionId || null,
        subjectId: subjectId || null,
      },
      include: {
        session: true,
        section: { include: { jamatClass: true } },
        subject: { include: { jamatClass: true } },
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "ASSIGN_TEACHER_SUBJECT",
      entityType: "TeacherAssignment",
      entityId: assignment.id,
      details: {
        teacherId: teacher.id,
        teacherName: teacher.name,
        classId,
        sectionId: sectionId || null,
        subjectId: subjectId || null,
        sessionId: resolvedSessionId,
      },
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "শ্রেণি ও বিষয় সফলভাবে বরাদ্দ করা হয়েছে।",
      assignment,
    });
  } catch (error: any) {
    console.error("POST Teacher Assignment Error:", error);
    return NextResponse.json({ error: error.message || "অ্যাসাইনমেন্ট তৈরিতে সমস্যা হয়েছে।" }, { status: 500 });
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

    const clientIp = getClientIp(req);
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json({ error: "অ্যাসাইনমেন্ট আইডি প্রদান করা আবশ্যক।" }, { status: 400 });
    }

    const assignment = await prisma.teacherAssignment.findFirst({
      where: { id: assignmentId, teacherId: params.id },
      include: {
        teacher: { select: { name: true } },
        subject: { select: { nameBn: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "অ্যাসাইনমেন্ট পাওয়া যায়নি।" }, { status: 404 });
    }

    await prisma.teacherAssignment.delete({
      where: { id: assignmentId },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "REMOVE_TEACHER_ASSIGNMENT",
      entityType: "TeacherAssignment",
      entityId: assignmentId,
      details: {
        teacherId: params.id,
        teacherName: assignment.teacher?.name,
        subjectName: assignment.subject?.nameBn,
      },
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "বরাদ্দকৃত বিষয়/শাখার দায়িত্ব সফলভাবে বাতিল করা হয়েছে।",
    });
  } catch (error: any) {
    console.error("DELETE Teacher Assignment Error:", error);
    return NextResponse.json({ error: "অ্যাসাইনমেন্ট মুছতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
