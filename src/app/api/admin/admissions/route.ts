import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateApplicationNumber } from "@/lib/admissionId";
import { detectDuplicates } from "@/lib/duplicateDetection";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/admissions
 * Dashboard listing, search, multi-filters, and metrics counters.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন এই তালিকা দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status")?.trim();
    const sessionId = searchParams.get("sessionId")?.trim();
    const classId = searchParams.get("classId")?.trim();
    const source = searchParams.get("source")?.trim();
    const search = searchParams.get("search")?.trim();
    const residentialStatus = searchParams.get("residentialStatus")?.trim();
    const isOrphan = searchParams.get("isOrphan");
    const isFinanciallyWeak = searchParams.get("isFinanciallyWeak");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }
    if (sessionId) {
      where.sessionId = sessionId;
    }
    if (classId) {
      where.desiredClassId = classId;
    }
    if (source && source !== "ALL") {
      where.source = source;
    }
    if (residentialStatus && residentialStatus !== "ALL") {
      where.desiredResidentialStatus = residentialStatus;
    }
    if (isOrphan !== null && isOrphan !== undefined && isOrphan !== "") {
      where.isOrphan = isOrphan === "true";
    }
    if (isFinanciallyWeak !== null && isFinanciallyWeak !== undefined && isFinanciallyWeak !== "") {
      where.isFinanciallyWeak = isFinanciallyWeak === "true";
    }

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search } },
        { studentNameBn: { contains: search } },
        { studentNameEn: { contains: search } },
        { guardianName: { contains: search } },
        { guardianPhone: { contains: search } },
        { birthCertificateNo: { contains: search } },
        { nidNo: { contains: search } },
      ];
    }

    // Execute queries in parallel
    const [admissions, totalCount, statsRaw] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
      prisma.application.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    // Format metrics counters
    const stats: Record<string, number> = {
      TOTAL: 0,
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      VERIFICATION: 0,
      EXAM_INTERVIEW: 0,
      CORRECTION_REQUESTED: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    let grandTotal = 0;
    for (const item of statsRaw) {
      stats[item.status] = item._count.id;
      grandTotal += item._count.id;
    }
    stats.TOTAL = grandTotal;

    // Enrich admissions with JamatClass and Session information
    const classIds = Array.from(new Set(admissions.map((a) => a.desiredClassId).filter(Boolean)));
    const sessionIds = Array.from(new Set(admissions.map((a) => a.sessionId).filter(Boolean) as string[]));

    const [classes, sessions] = await Promise.all([
      prisma.jamatClass.findMany({
        where: { id: { in: classIds } },
        select: { id: true, nameBn: true, nameEn: true, code: true },
      }),
      prisma.academicSession.findMany({
        where: { id: { in: sessionIds } },
        select: { id: true, name: true, isCurrent: true },
      }),
    ]);

    // Enrich admissions with created student details (student ID & roll number)
    const studentIds = admissions.map((a) => a.createdStudentId).filter(Boolean) as string[];
    const createdStudents = studentIds.length > 0 ? await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        studentIdNumber: true,
        enrollments: {
          where: { status: "ACTIVE" },
          select: { rollNumber: true, section: { select: { nameBn: true } } },
          take: 1,
        },
      },
    }) : [];

    const classMap = new Map(classes.map((c) => [c.id, c]));
    const sessionMap = new Map(sessions.map((s) => [s.id, s]));
    const studentMap = new Map(createdStudents.map((s) => [s.id, s]));

    const enrichedAdmissions = admissions.map((app) => ({
      ...app,
      desiredClass: classMap.get(app.desiredClassId) || null,
      session: app.sessionId ? sessionMap.get(app.sessionId) || null : null,
      createdStudent: app.createdStudentId ? studentMap.get(app.createdStudentId) || null : null,
    }));

    return NextResponse.json({
      success: true,
      admissions: enrichedAdmissions,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/admissions error:", error);
    return NextResponse.json(
      { error: "ভর্তি আবেদন তালিকা লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/admissions
 * Office Admission Entry by Admin/Office Staff.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন অফিস ভর্তি এন্ট্রি করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      sessionId,
      desiredClassId,
      desiredSectionId,
      studentNameBn,
      studentNameEn,
      studentNameAr,
      dateOfBirth,
      gender = "MALE",
      bloodGroup,
      birthCertificateNo,
      nidNo,
      nationality = "Bangladeshi",
      desiredResidentialStatus = "NON_RESIDENTIAL",
      fatherNameBn,
      fatherPhone,
      fatherOccupation,
      motherNameBn,
      motherPhone,
      guardianName,
      guardianPhone,
      guardianEmail,
      guardianRelation = "FATHER",
      guardianAddress,
      address,
      presentAddress,
      permanentAddress,
      previousInstitute,
      previousClass,
      isOrphan = false,
      isFinanciallyWeak = false,
      financialAssistanceRequested = false,
      specialAssistanceDetails,
      documents,
      submissionToken,
    } = body;

    // Validation
    if (!studentNameBn || !dateOfBirth || !desiredClassId || !guardianName || !guardianPhone) {
      return NextResponse.json(
        { error: "আবশ্যক তথ্য (শিক্ষার্থীর বাংলা নাম, জন্মতারিখ, জামাত, অভিভাবকের নাম ও ফোন) প্রদান করুন।" },
        { status: 400 }
      );
    }

    // Resolve session
    let resolvedSessionId = sessionId;
    if (!resolvedSessionId) {
      const activeSess = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
      resolvedSessionId = activeSess?.id;
    }

    // Duplicate check
    const duplicateMatches = await detectDuplicates({
      studentNameBn,
      dateOfBirth,
      fatherNameBn: fatherNameBn || guardianName,
      guardianPhone,
      birthCertificateNo,
      nidNo,
    });

    const currentYear = new Date().getFullYear();
    const applicationNumber = await generateApplicationNumber(currentYear);

    const application = await prisma.application.create({
      data: {
        applicationNumber,
        source: "OFFICE",
        sessionId: resolvedSessionId,
        desiredClassId,
        desiredSectionId: desiredSectionId || null,
        studentNameBn: studentNameBn.trim(),
        studentNameEn: studentNameEn?.trim() || studentNameBn.trim(),
        studentNameAr: studentNameAr?.trim() || null,
        dateOfBirth: new Date(dateOfBirth),
        gender: gender || "MALE",
        bloodGroup: bloodGroup || null,
        birthCertificateNo: birthCertificateNo ? birthCertificateNo.trim() : null,
        nidNo: nidNo ? nidNo.trim() : null,
        nationality: nationality || "Bangladeshi",
        desiredResidentialStatus: desiredResidentialStatus || "NON_RESIDENTIAL",
        fatherNameBn: fatherNameBn ? fatherNameBn.trim() : guardianName.trim(),
        fatherPhone: fatherPhone ? fatherPhone.trim() : guardianPhone.trim(),
        fatherOccupation: fatherOccupation || null,
        motherNameBn: motherNameBn ? motherNameBn.trim() : null,
        motherPhone: motherPhone ? motherPhone.trim() : null,
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        guardianEmail: guardianEmail ? guardianEmail.trim() : null,
        guardianRelation: guardianRelation || "FATHER",
        guardianAddress: guardianAddress || address || presentAddress || null,
        address: address || presentAddress || "",
        presentAddress: presentAddress || address || "",
        permanentAddress: permanentAddress || presentAddress || address || "",
        previousInstitute: previousInstitute || null,
        previousClass: previousClass || null,
        isOrphan: Boolean(isOrphan),
        isFinanciallyWeak: Boolean(isFinanciallyWeak),
        financialAssistanceRequested: Boolean(financialAssistanceRequested),
        specialAssistanceDetails: specialAssistanceDetails || null,
        documentsJson: documents ? JSON.stringify(documents) : null,
        submissionToken: submissionToken || null,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    // Record audit
    await recordAuditLog({
      userId: user.userId,
      action: "OFFICE_ADMISSION_CREATE",
      entityType: "Application",
      entityId: application.id,
      details: {
        applicationNumber,
        source: "OFFICE",
        duplicateCount: duplicateMatches.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `অফিস ভর্তি আবেদন সফলভাবে এন্ট্রি হয়েছে। ট্র্যাকিং আইডি: ${applicationNumber}`,
      applicationNumber,
      application,
      duplicateMatches,
      hasDuplicateWarning: duplicateMatches.length > 0,
    });
  } catch (error: any) {
    console.error("POST /api/admin/admissions error:", error);
    return NextResponse.json(
      { error: error.message || "অফিস ভর্তি আবেদন তৈরি করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
