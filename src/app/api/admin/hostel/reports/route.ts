import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/hostel/reports
 * Comprehensive aggregated reporting for Hostel & Residential management:
 * 1. summary: Residential vs Day Care vs Non-residential breakdown
 * 2. checkins: Check-in register by date range
 * 3. checkouts: Check-out register by date range
 * 4. history: Full residential history trail
 * 5. finance: Hostel & Food billing vs collected summary
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "summary";
    const sessionId = searchParams.get("sessionId") || undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      dateFilter.lte = eDate;
    }

    if (reportType === "summary") {
      const [totalStudents, residential, dayCare, nonResidential, activeEnrollments] = await Promise.all([
        prisma.student.count({ where: { status: "ACTIVE" } }),
        prisma.student.count({ where: { status: "ACTIVE", residentialStatus: "RESIDENTIAL" } }),
        prisma.student.count({ where: { status: "ACTIVE", residentialStatus: "DAY_CARE" } }),
        prisma.student.count({ where: { status: "ACTIVE", residentialStatus: "NON_RESIDENTIAL" } }),
        prisma.residentialEnrollment.groupBy({
          by: ["status"],
          where: sessionId ? { sessionId } : {},
          _count: true,
        }),
      ]);

      const financeAgg = await prisma.feeInvoice.aggregate({
        where: {
          feeType: { in: ["HOSTEL", "FOOD"] },
          ...(sessionId ? { sessionId } : {}),
        },
        _sum: {
          netAmount: true,
          paidAmount: true,
          dueAmount: true,
        },
      });

      return NextResponse.json({
        success: true,
        summary: {
          totalStudents,
          residential,
          dayCare,
          nonResidential,
          enrollmentsByStatus: activeEnrollments,
          finance: {
            totalBilled: financeAgg._sum.netAmount || 0,
            totalPaid: financeAgg._sum.paidAmount || 0,
            totalDue: financeAgg._sum.dueAmount || 0,
          },
        },
      });
    }

    if (reportType === "checkins") {
      const where: any = {
        checkInDate: Object.keys(dateFilter).length > 0 ? dateFilter : { not: null },
        ...(sessionId ? { sessionId } : {}),
      };

      const checkins = await prisma.residentialEnrollment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              studentIdNumber: true,
              fullNameBn: true,
              gender: true,
              enrollments: {
                where: { status: "ACTIVE" },
                include: { jamatClass: true, section: true },
                take: 1,
              },
            },
          },
          session: { select: { id: true, name: true } },
        },
        orderBy: { checkInDate: "desc" },
        take: 100,
      });

      return NextResponse.json({ success: true, checkins });
    }

    if (reportType === "checkouts") {
      const where: any = {
        checkOutDate: Object.keys(dateFilter).length > 0 ? dateFilter : { not: null },
        ...(sessionId ? { sessionId } : {}),
      };

      const checkouts = await prisma.residentialEnrollment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              studentIdNumber: true,
              fullNameBn: true,
              enrollments: {
                where: { status: "ACTIVE" },
                include: { jamatClass: true, section: true },
                take: 1,
              },
            },
          },
          session: { select: { id: true, name: true } },
        },
        orderBy: { checkOutDate: "desc" },
        take: 100,
      });

      return NextResponse.json({ success: true, checkouts });
    }

    if (reportType === "history") {
      const where: any = {
        ...(Object.keys(dateFilter).length > 0 ? { effectiveDate: dateFilter } : {}),
        ...(sessionId ? { sessionId } : {}),
      };

      const histories = await prisma.residentialHistory.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              studentIdNumber: true,
              fullNameBn: true,
            },
          },
          session: { select: { id: true, name: true } },
          recordedByUser: { select: { id: true, name: true, role: true } },
        },
        orderBy: { effectiveDate: "desc" },
        take: 100,
      });

      return NextResponse.json({ success: true, histories });
    }

    return NextResponse.json({ error: "অবৈধ রিপোর্ট ধরন।" }, { status: 400 });
  } catch (error: any) {
    console.error("GET /api/admin/hostel/reports error:", error);
    return NextResponse.json(
      { error: error.message || "রিপোর্ট সংগ্রহে ত্রুটি ঘটেছে।" },
      { status: 500 }
    );
  }
}
