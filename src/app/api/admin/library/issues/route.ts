import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { issueBookCopy } from "@/lib/libraryEngine";

/**
 * GET /api/admin/library/issues
 * List circulation issues with filters
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const memberId = searchParams.get("memberId") || "";
    const copyId = searchParams.get("copyId") || "";
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (memberId) where.memberId = memberId;
    if (copyId) where.copyId = copyId;
    if (search) {
      where.OR = [
        { issueNumber: { contains: search } },
        { copy: { accessionNo: { contains: search } } },
        { book: { titleBn: { contains: search } } },
        { book: { titleEn: { contains: search } } },
        { member: { memberNumber: { contains: search } } },
        { member: { student: { fullNameBn: { contains: search } } } },
        { member: { user: { name: { contains: search } } } },
      ];
    }

    const [total, issues] = await Promise.all([
      prisma.libraryIssue.count({ where }),
      prisma.libraryIssue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          book: true,
          copy: true,
          member: {
            include: {
              student: { select: { id: true, studentIdNumber: true, fullNameBn: true, fullNameEn: true } },
              user: { select: { id: true, name: true, role: true } },
            },
          },
          issuedByUser: { select: { id: true, name: true } },
          invoice: true,
          renewals: {
            orderBy: { renewDate: "desc" },
            include: { renewedByUser: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    return NextResponse.json({
      issues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার ত্রুটি।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/library/issues
 * Issue a book copy to a member
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন বই ইস্যু করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { copyId, memberId, customLoanDays, notes } = body;

    if (!copyId || !memberId) {
      return NextResponse.json({ error: "বইয়ের কপি ও সদস্য নির্বাচন আবশ্যক।" }, { status: 400 });
    }

    const issue = await issueBookCopy({
      copyId,
      memberId,
      issuedByUserId: user.userId,
      customLoanDays: customLoanDays ? Number(customLoanDays) : undefined,
      notes,
    });

    return NextResponse.json({ success: true, issue }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "বই ইস্যু ব্যর্থ।" }, { status: 400 });
  }
}
