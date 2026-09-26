import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { generateNextRequestNumber } from "@/lib/documentFactory";

/**
 * POST /api/portal/documents/request
 * Guardian submits a certificate / document request for a linked child
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, documentType, purpose, requiredDate, notes, attachmentUrl } = body;

    if (!studentId || !documentType || !purpose || !purpose.trim()) {
      return NextResponse.json(
        { error: "শিক্ষার্থী, প্রত্যয়নপত্রের ধরন এবং আবেদনের উদ্দেশ্য উল্লেখ করা আবশ্যক।" },
        { status: 400 }
      );
    }

    // Resolve Guardian and verify child linkage (Strict IDOR prevention)
    const guardian = await prisma.guardian.findFirst({
      where: {
        OR: [
          { userId: user.userId },
          { phone: user.username },
        ],
      },
      include: {
        students: true,
      },
    });

    if (!guardian) {
      return NextResponse.json({ error: "অভিভাবক প্রোফাইল পাওয়া যায়নি।" }, { status: 404 });
    }

    const isLinked = guardian.students.some((gs) => gs.studentId === studentId);
    if (!isLinked) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। আপনি কেবল আপনার সংযুক্ত সন্তানের জন্য আবেদন করতে পারেন।" },
        { status: 403 }
      );
    }

    // Check for existing pending request of the same type for this student
    const existingPending = await prisma.documentRequest.findFirst({
      where: {
        studentId,
        documentType,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "এই ধরনের প্রত্যয়নপত্রের জন্য আপনার একটি আবেদন ইতিমধ্যে প্রক্রিয়াধীন রয়েছে।" },
        { status: 409 }
      );
    }

    // Find active academic session
    const activeSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } });

    const requestNumber = await generateNextRequestNumber();

    const newRequest = await prisma.documentRequest.create({
      data: {
        requestNumber,
        studentId,
        guardianId: guardian.id,
        sessionId: activeSession ? activeSession.id : null,
        documentType,
        purpose: purpose.trim(),
        requiredDate: requiredDate ? new Date(requiredDate) : null,
        notes: notes ? notes.trim() : null,
        attachmentUrl: attachmentUrl || null,
        status: "SUBMITTED",
      },
      include: {
        student: { select: { fullNameBn: true, studentIdNumber: true } },
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "SUBMIT_DOCUMENT_REQUEST",
      entityType: "DocumentRequest",
      entityId: newRequest.id,
      details: {
        requestNumber,
        studentId,
        documentType,
      },
    });

    return NextResponse.json({
      success: true,
      message: `প্রত্যয়নপত্রের আবেদন সফলভাবে দাখিল করা হয়েছে। ট্র্যাকিং নম্বর: ${requestNumber}`,
      request: newRequest,
    });
  } catch (error: any) {
    console.error("Portal Document Request error:", error);
    return NextResponse.json({ error: "আবেদন জমা দেওয়া সম্ভব হয়নি।" }, { status: 500 });
  }
}
