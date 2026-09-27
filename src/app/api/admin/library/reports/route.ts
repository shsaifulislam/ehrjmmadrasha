import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/**
 * GET /api/admin/library/reports
 * Complete Library Cockpit Statistics, Inventory, Circulation, and Overdue Reports
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      totalTitles,
      totalCopies,
      availableCopies,
      issuedCopies,
      overdueCopies,
      lostCopies,
      damagedCopies,
      repairCopies,
      activeMembers,
      studentMembers,
      teacherMembers,
      todayIssuesCount,
      todayReturnsCount,
      recentIssues,
      topBorrowedBooks,
      overdueIssues,
      categories,
    ] = await Promise.all([
      prisma.libraryBook.count({ where: { status: "ACTIVE" } }),
      prisma.libraryBookCopy.count(),
      prisma.libraryBookCopy.count({ where: { status: "AVAILABLE" } }),
      prisma.libraryBookCopy.count({ where: { status: "ISSUED" } }),
      prisma.libraryIssue.count({ where: { status: { in: ["ISSUED", "OVERDUE"] }, dueDate: { lt: now } } }),
      prisma.libraryBookCopy.count({ where: { status: "LOST" } }),
      prisma.libraryBookCopy.count({ where: { status: "DAMAGED" } }),
      prisma.libraryBookCopy.count({ where: { status: "REPAIR" } }),
      prisma.libraryMember.count({ where: { status: "ACTIVE" } }),
      prisma.libraryMember.count({ where: { status: "ACTIVE", memberType: "STUDENT" } }),
      prisma.libraryMember.count({ where: { status: "ACTIVE", memberType: "TEACHER" } }),
      prisma.libraryIssue.count({ where: { issueDate: { gte: todayStart, lte: todayEnd } } }),
      prisma.libraryIssue.count({ where: { returnDate: { gte: todayStart, lte: todayEnd } } }),
      prisma.libraryIssue.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          book: true,
          copy: true,
          member: {
            include: {
              student: { select: { fullNameBn: true, studentIdNumber: true } },
              user: { select: { name: true, role: true } },
            },
          },
        },
      }),
      prisma.libraryBook.findMany({
        take: 8,
        orderBy: { issues: { _count: "desc" } },
        include: {
          category: true,
          author: true,
          _count: { select: { issues: true, copies: true } },
        },
      }),
      prisma.libraryIssue.findMany({
        where: {
          status: { in: ["ISSUED", "OVERDUE"] },
          dueDate: { lt: now },
        },
        take: 15,
        orderBy: { dueDate: "asc" },
        include: {
          book: true,
          copy: true,
          member: {
            include: {
              student: { select: { fullNameBn: true, studentIdNumber: true } },
              user: { select: { name: true } },
            },
          },
        },
      }),
      prisma.libraryCategory.findMany({
        include: {
          _count: { select: { books: true } },
        },
      }),
    ]);

    // Fines aggregates
    const finesAggregate = await prisma.libraryIssue.aggregate({
      _sum: { fineAmount: true },
      where: { fineAmount: { gt: 0 } },
    });

    const totalFinesAssessed = finesAggregate._sum.fineAmount || 0;

    return NextResponse.json({
      summary: {
        totalTitles,
        totalCopies,
        availableCopies,
        issuedCopies,
        overdueCopies,
        lostCopies,
        damagedCopies,
        repairCopies,
        activeMembers,
        studentMembers,
        teacherMembers,
        todayIssuesCount,
        todayReturnsCount,
        totalFinesAssessed,
      },
      topBorrowedBooks,
      overdueIssues,
      recentIssues,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "রিপোর্ট লোড করতে ব্যর্থ।" }, { status: 500 });
  }
}
