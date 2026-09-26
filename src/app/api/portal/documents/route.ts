import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { DOCUMENT_TYPES } from "@/lib/documentFactory";

/**
 * GET /api/portal/documents
 * Guardian fetches issued certificates and document requests for linked child
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    // Resolve Guardian record
    const guardian = await prisma.guardian.findFirst({
      where: {
        OR: [
          { userId: user.userId },
          { phone: user.username },
        ],
      },
      include: {
        students: {
          include: {
            student: {
              include: {
                enrollments: {
                  where: { status: "ACTIVE" },
                  include: { jamatClass: true, section: true, session: true },
                },
              },
            },
          },
        },
      },
    });

    if (!guardian || guardian.students.length === 0) {
      return NextResponse.json({ error: "কোনো সংযুক্ত শিক্ষার্থীর তথ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    const linkedStudentIds = guardian.students.map((gs) => gs.studentId);

    // If specific studentId is provided, enforce strict IDOR isolation
    if (studentId && !linkedStudentIds.includes(studentId)) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। এই শিক্ষার্থীর তথ্য দেখার অধিকার আপনার নেই।" },
        { status: 403 }
      );
    }

    const targetStudentId = studentId || linkedStudentIds[0];
    const targetStudentObj = guardian.students.find((gs) => gs.studentId === targetStudentId)?.student;

    // Fetch issued certificates for this student
    const certificates = await prisma.certificate.findMany({
      where: {
        studentId: targetStudentId,
        status: { in: ["ISSUED", "REVOKED"] },
      },
      include: {
        template: { select: { nameBn: true, titleBn: true, documentType: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch document requests for this student
    const requests = await prisma.documentRequest.findMany({
      where: { studentId: targetStudentId },
      include: {
        feeInvoice: { select: { id: true, invoiceNumber: true, status: true, netAmount: true, paidAmount: true } },
        certificates: { select: { id: true, certificateNumber: true, status: true, issueDate: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch active document templates available for request
    const availableTemplates = await prisma.documentTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        documentType: true,
        titleBn: true,
        nameBn: true,
        requiresFee: true,
        feeAmount: true,
      },
    });

    return NextResponse.json({
      success: true,
      student: {
        id: targetStudentObj?.id,
        name: targetStudentObj?.fullNameBn,
        studentIdNumber: targetStudentObj?.studentIdNumber,
        className: targetStudentObj?.enrollments[0]?.jamatClass?.nameBn || "মাদরাসা",
        rollNumber: targetStudentObj?.enrollments[0]?.rollNumber || 1,
      },
      certificates: certificates.map((c) => ({
        id: c.id,
        certificateNumber: c.certificateNumber,
        verificationCode: c.verificationCode,
        documentType: c.certificateType,
        titleBn: c.titleBn,
        issueDate: c.issueDate,
        isRevoked: c.isRevoked,
        revokeReason: c.isRevoked ? "প্রশাসনিক নির্দেশে বাতিলকৃত" : null, // Privacy safe
        qrCodeUrl: c.qrCodeUrl,
        version: c.version,
      })),
      requests,
      availableDocumentTypes: DOCUMENT_TYPES,
      availableTemplates,
    });
  } catch (error: any) {
    console.error("Portal Documents GET error:", error);
    return NextResponse.json({ error: "প্রত্যয়নপত্র তথ্য লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}
