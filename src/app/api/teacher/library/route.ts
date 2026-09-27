import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/**
 * GET /api/teacher/library
 * Teacher views own library membership, active loans, and history
 * Strictly isolated to session user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র শিক্ষক এই তথ্য দেখতে পারেন।" }, { status: 403 });
    }

    const member = await prisma.libraryMember.findUnique({
      where: {
        memberType_userId: {
          memberType: "TEACHER",
          userId: user.userId,
        },
      },
      include: {
        issues: {
          orderBy: { issueDate: "desc" },
          include: {
            book: {
              include: { category: true, author: true },
            },
            copy: true,
            renewals: {
              orderBy: { renewDate: "desc" },
            },
          },
        },
      },
    });

    const now = new Date();

    const activeLoans = (member?.issues || [])
      .filter((i) => i.status === "ISSUED" || i.status === "OVERDUE")
      .map((i) => {
        const isOverdue = new Date(i.dueDate) < now;
        const diffDays = Math.ceil((new Date(i.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: i.id,
          issueNumber: i.issueNumber,
          bookTitle: i.book.titleBn,
          authorName: i.book.author.nameBn,
          categoryName: i.book.category.nameBn,
          accessionNo: i.copy.accessionNo,
          issueDate: i.issueDate,
          dueDate: i.dueDate,
          isOverdue,
          daysRemaining: diffDays,
          renewCount: i.renewCount,
          fineAmount: i.fineAmount,
          status: i.status,
        };
      });

    const returnedHistory = (member?.issues || [])
      .filter((i) => i.status === "RETURNED" || i.status === "LOST" || i.status === "DAMAGED")
      .map((i) => ({
        id: i.id,
        issueNumber: i.issueNumber,
        bookTitle: i.book.titleBn,
        authorName: i.book.author.nameBn,
        accessionNo: i.copy.accessionNo,
        issueDate: i.issueDate,
        dueDate: i.dueDate,
        returnDate: i.returnDate,
        status: i.status,
        fineAmount: i.fineAmount,
      }));

    return NextResponse.json({
      teacherName: user.name,
      membership: member
        ? {
            id: member.id,
            memberNumber: member.memberNumber,
            status: member.status,
            maxBooks: member.maxBooks || 5,
            activeCount: activeLoans.length,
          }
        : null,
      activeLoans,
      returnedHistory,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার ত্রুটি।" }, { status: 500 });
  }
}
