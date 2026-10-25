import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { issueOfficialDocument, ensureDefaultTemplates } from "@/lib/documentFactory";

/**
 * GET /api/admin/documents
 * List all generated official documents with filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const sessionId = searchParams.get("sessionId") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20", 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (type) where.certificateType = type;
    if (status) where.status = status;
    if (sessionId) where.sessionId = sessionId;

    if (search) {
      where.OR = [
        { certificateNumber: { contains: search } },
        { verificationCode: { contains: search } },
        { titleBn: { contains: search } },
        {
          student: {
            OR: [
              { fullNameBn: { contains: search } },
              { fullNameEn: { contains: search } },
              { studentIdNumber: { contains: search } },
            ],
          },
        },
      ];
    }

    const [total, documents] = await Promise.all([
      prisma.certificate.count({ where }),
      prisma.certificate.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              studentIdNumber: true,
              fullNameBn: true,
              fullNameEn: true,
              gender: true,
              photoUrl: true,
            },
          },
          session: {
            select: { id: true, name: true },
          },
          template: {
            select: { id: true, nameBn: true, version: true },
          },
          issuedByUser: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // Statistics counts
    const [totalIssued, totalRevoked, pendingRequests] = await Promise.all([
      prisma.certificate.count({ where: { status: "ISSUED" } }),
      prisma.certificate.count({ where: { status: "REVOKED" } }),
      prisma.documentRequest.count({ where: { status: "SUBMITTED" } }),
    ]);

    return NextResponse.json({
      success: true,
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalDocuments: total,
        totalIssued,
        totalRevoked,
        pendingRequests,
      },
    });
  } catch (error: any) {
    console.error("Admin Documents GET error:", error);
    return NextResponse.json({ error: "সনদপত্র তালিকা লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/documents
 * Generate and issue a new official document directly
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন নতুন প্রত্যয়নপত্র ইস্যু করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentId,
      documentType,
      sessionId,
      templateId,
      requestId,
      customNotes,
      selectedExamId,
      selectedReceiptId,
      selectedInvoiceId,
      transferReason,
      adminConductConfirmed,
    } = body;

    if (!studentId || !documentType) {
      return NextResponse.json(
        { error: "শিক্ষার্থী এবং প্রত্যয়নপত্রের ধরন নির্বাচন করা আবশ্যক।" },
        { status: 400 }
      );
    }

    await ensureDefaultTemplates();

    const cert = await issueOfficialDocument({
      studentId,
      documentType,
      sessionId,
      templateId,
      requestId,
      issuedByUserId: user.userId,
      customNotes,
      selectedExamId,
      selectedReceiptId,
      selectedInvoiceId,
      transferReason,
      adminConductConfirmed: adminConductConfirmed ?? true,
    });

    await recordAuditLog({
      userId: user.userId,
      action: "ISSUE_OFFICIAL_DOCUMENT",
      entityType: "Certificate",
      entityId: cert.id,
      details: {
        certificateNumber: cert.certificateNumber,
        verificationCode: cert.verificationCode,
        documentType: cert.certificateType,
        studentId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "প্রত্যয়নপত্র সফলভাবে ইস্যু করা হয়েছে।",
      certificate: cert,
    });
  } catch (error: any) {
    console.error("Admin Document POST error:", error);
    return NextResponse.json(
      { error: error.message || "প্রত্যয়নপত্র তৈরি করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
