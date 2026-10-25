import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/**
 * GET /api/admin/documents/search-student
 * Instant Autocomplete Search for Document Generation
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();
    const classId = searchParams.get("classId") || "";
    const sessionId = searchParams.get("sessionId") || "";
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    const where: any = {};

    if (query) {
      where.OR = [
        { studentIdNumber: { contains: query } },
        { fullNameBn: { contains: query } },
        { fullNameEn: { contains: query } },
        { fatherNameBn: { contains: query } },
        { fatherPhone: { contains: query } },
      ];
    }

    if (classId || sessionId) {
      where.enrollments = {
        some: {
          ...(classId ? { classId } : {}),
          ...(sessionId ? { sessionId } : {}),
        },
      };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        enrollments: {
          include: {
            jamatClass: true,
            section: true,
            session: true,
          },
          orderBy: { enrolledAt: "desc" },
          take: 3,
        },
        guardianLinks: {
          include: { guardian: true },
        },
        feeInvoices: {
          select: {
            id: true,
            invoiceNumber: true,
            title: true,
            totalAmount: true,
            paidAmount: true,
            dueAmount: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        results: {
          include: {
            exam: {
              include: { session: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        admitCards: {
          include: {
            exam: true,
          },
          take: 3,
        },
      },
      take: limit,
      orderBy: { fullNameBn: "asc" },
    });

    const formattedStudents = (students as any[]).map((s: any) => {
      const activeEnrollment = s.enrollments?.find((e: any) => e.status === "ACTIVE") || s.enrollments?.[0];
      const primaryGuardian = s.guardianLinks?.find((gl: any) => gl.isPrimary)?.guardian || s.guardianLinks?.[0]?.guardian;

      let totalDue = 0;
      let totalBilled = 0;
      let totalPaid = 0;
      for (const inv of s.feeInvoices || []) {
        totalBilled += inv.totalAmount;
        totalPaid += inv.paidAmount;
        totalDue += inv.dueAmount;
      }

      return {
        id: s.id,
        studentIdNumber: s.studentIdNumber,
        fullNameBn: s.fullNameBn,
        fullNameEn: s.fullNameEn || s.fullNameBn,
        fullNameAr: s.fullNameAr || "",
        gender: s.gender,
        bloodGroup: s.bloodGroup || "N/A",
        photoUrl: s.photoUrl || null,
        residentialStatus: s.residentialStatus,
        status: s.status,
        dateOfBirth: s.dateOfBirth,
        fatherNameBn: s.fatherNameBn,
        motherNameBn: s.motherNameBn,
        presentAddress: s.presentAddress,
        permanentAddress: s.permanentAddress,
        activeEnrollment: activeEnrollment
          ? {
              id: activeEnrollment.id,
              classId: activeEnrollment.classId,
              className: activeEnrollment.jamatClass?.nameBn || "সাধারণ",
              classNameEn: activeEnrollment.jamatClass?.nameEn || "",
              sectionName: activeEnrollment.section?.nameBn || "ক শাখা",
              sessionId: activeEnrollment.sessionId,
              sessionName: activeEnrollment.session?.name || new Date().getFullYear().toString(),
              rollNumber: activeEnrollment.rollNumber,
            }
          : null,
        guardian: primaryGuardian
          ? {
              fullNameBn: primaryGuardian.fullNameBn,
              phone: primaryGuardian.phone,
              relation: primaryGuardian.relation || "পিতা",
            }
          : {
              fullNameBn: s.fatherNameBn,
              phone: s.fatherPhone || "N/A",
              relation: "পিতা",
            },
        financialClearance: {
          totalBilled,
          totalPaid,
          totalDue,
          hasOutstandingDues: totalDue > 0,
          invoices: s.feeInvoices,
        },
        examsAvailable: (s.results || []).map((r: any) => ({
          examId: r.examId,
          examName: r.exam.name,
          examNameBn: r.exam.nameBn || r.exam.name,
          finalGradeBn: r.finalGradeBn,
          totalObtained: r.totalObtained,
          percentage: r.percentage,
          isPassed: r.isPassed,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      students: formattedStudents,
    });
  } catch (error: any) {
    console.error("Search Student API error:", error);
    return NextResponse.json({ error: "শিক্ষার্থী তথ্য অনুসন্ধান করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
