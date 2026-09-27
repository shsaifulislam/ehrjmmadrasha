import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/**
 * GET /api/portal/library
 * Guardian fetches library circulation history and active borrowed books for authorized linked child
 * Strict IDOR enforcement
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    // 1. Resolve Guardian
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

    const linkedStudents = guardian.students.map((gs) => ({
      id: gs.student.id,
      nameBn: gs.student.fullNameBn,
      nameEn: gs.student.fullNameEn,
      studentIdNumber: gs.student.studentIdNumber,
      className: gs.student.enrollments[0]?.jamatClass?.nameBn || "N/A",
      sectionName: gs.student.enrollments[0]?.section?.nameBn || "N/A",
    }));

    const linkedStudentIds = linkedStudents.map((s) => s.id);

    // 2. Strict IDOR Check
    if (studentId && !linkedStudentIds.includes(studentId)) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। এই শিক্ষার্থীর লাইব্রেরি তথ্য দেখার অধিকার আপনার নেই।" },
        { status: 403 }
      );
    }

    const targetStudentId = studentId || linkedStudentIds[0];
    const currentStudent = linkedStudents.find((s) => s.id === targetStudentId);

    // 3. Find Library Member
    const member = await prisma.libraryMember.findUnique({
      where: {
        memberType_studentId: {
          memberType: "STUDENT",
          studentId: targetStudentId,
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
            invoice: true,
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
          coverImage: i.book.coverImage,
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
        invoice: i.invoice
          ? {
              id: i.invoice.id,
              invoiceNumber: i.invoice.invoiceNumber,
              status: i.invoice.status,
              dueAmount: i.invoice.dueAmount,
              paidAmount: i.invoice.paidAmount,
            }
          : null,
      }));

    // 4. Invoices linked to Library Fine
    const libraryInvoices = await prisma.feeInvoice.findMany({
      where: {
        studentId: targetStudentId,
        feeType: "LIBRARY_FINE",
      },
      orderBy: { createdAt: "desc" },
      include: {
        receipts: true,
      },
    });

    return NextResponse.json({
      students: linkedStudents,
      selectedStudentId: targetStudentId,
      currentStudent,
      membership: member
        ? {
            id: member.id,
            memberNumber: member.memberNumber,
            status: member.status,
            maxBooks: member.maxBooks || 2,
            activeCount: activeLoans.length,
          }
        : null,
      activeLoans,
      returnedHistory,
      libraryInvoices,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার ত্রুটি।" }, { status: 500 });
  }
}
