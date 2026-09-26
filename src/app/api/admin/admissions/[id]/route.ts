import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { detectDuplicates } from "@/lib/duplicateDetection";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/admissions/:id
 * Fetches full application profile, academic links, duplicate check, and audit logs.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const { id } = params;
    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: "ভর্তি আবেদনটি খুঁজে পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // Resolve Class, Section, Session
    const [desiredClass, desiredSection, session, createdStudent, auditLogs] = await Promise.all([
      prisma.jamatClass.findUnique({
        where: { id: application.desiredClassId },
        select: { id: true, nameBn: true, nameEn: true, code: true },
      }),
      application.desiredSectionId
        ? prisma.section.findUnique({
            where: { id: application.desiredSectionId },
            select: { id: true, nameBn: true, nameEn: true },
          })
        : null,
      application.sessionId
        ? prisma.academicSession.findUnique({
            where: { id: application.sessionId },
            select: { id: true, name: true, isCurrent: true },
          })
        : null,
      application.createdStudentId
        ? prisma.student.findUnique({
            where: { id: application.createdStudentId },
            include: {
              enrollments: {
                where: { status: "ACTIVE" },
                include: { jamatClass: true, section: true, session: true },
              },
            },
          })
        : null,
      prisma.auditLog.findMany({
        where: {
          entityType: "Application",
          entityId: application.id,
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    // Live Duplicate Check for Admin Cockpit
    const duplicateMatches = await detectDuplicates({
      studentNameBn: application.studentNameBn,
      dateOfBirth: application.dateOfBirth,
      fatherNameBn: application.fatherNameBn || application.guardianName,
      guardianPhone: application.guardianPhone,
      birthCertificateNo: application.birthCertificateNo,
      nidNo: application.nidNo,
      excludeApplicationId: application.id,
    });

    // Parse documents if present
    let documents: any[] = [];
    if (application.documentsJson) {
      try {
        documents = JSON.parse(application.documentsJson);
      } catch {
        documents = [];
      }
    }

    return NextResponse.json({
      success: true,
      application: {
        ...application,
        desiredClass,
        desiredSection,
        session,
        createdStudent,
        documents,
      },
      duplicateMatches,
      auditLogs,
    });
  } catch (error: any) {
    console.error("GET /api/admin/admissions/:id error:", error);
    return NextResponse.json(
      { error: "আবেদনের বিস্তারিত লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/admissions/:id
 * Allows Admin to update editable fields like assigned section, review notes, etc.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস।" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();

    const currentApp = await prisma.application.findUnique({ where: { id } });
    if (!currentApp) {
      return NextResponse.json({ error: "আবেদন খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    // Allowed editable fields
    const {
      desiredSectionId,
      reviewNotes,
      verificationNotes,
      specialAssistanceDetails,
      guardianAddress,
      presentAddress,
    } = body;

    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...(desiredSectionId !== undefined ? { desiredSectionId } : {}),
        ...(reviewNotes !== undefined ? { reviewNotes } : {}),
        ...(verificationNotes !== undefined ? { verificationNotes } : {}),
        ...(specialAssistanceDetails !== undefined ? { specialAssistanceDetails } : {}),
        ...(guardianAddress !== undefined ? { guardianAddress } : {}),
        ...(presentAddress !== undefined ? { presentAddress } : {}),
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "APPLICATION_UPDATE",
      entityType: "Application",
      entityId: id,
      details: { updatedFields: Object.keys(body) },
    });

    return NextResponse.json({
      success: true,
      message: "আবেদন তথ্য সফলভাবে হালনাগাদ করা হয়েছে।",
      application: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/admissions/:id error:", error);
    return NextResponse.json(
      { error: "আবেদন তথ্য হালনাগাদ করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
