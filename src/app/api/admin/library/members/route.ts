import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { generateNextMemberNumber } from "@/lib/libraryEngine";

/**
 * GET /api/admin/library/members
 * List library members with active borrowing stats
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const memberType = searchParams.get("memberType") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (memberType && memberType !== "ALL") where.memberType = memberType;
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { memberNumber: { contains: search } },
        { student: { fullNameBn: { contains: search } } },
        { student: { fullNameEn: { contains: search } } },
        { student: { studentIdNumber: { contains: search } } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    const [total, members] = await Promise.all([
      prisma.libraryMember.count({ where }),
      prisma.libraryMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: {
              id: true,
              studentIdNumber: true,
              fullNameBn: true,
              fullNameEn: true,
              enrollments: {
                where: { session: { isCurrent: true } },
                include: { jamatClass: true, section: true },
                take: 1,
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          issues: {
            where: { status: { in: ["ISSUED", "OVERDUE"] } },
            select: { id: true, status: true, dueDate: true },
          },
        },
      }),
    ]);

    const formattedMembers = members.map((m) => {
      const activeLoansCount = m.issues.length;
      const overdueLoansCount = m.issues.filter((i) => i.status === "OVERDUE" || new Date(i.dueDate) < new Date()).length;
      return {
        ...m,
        stats: {
          activeLoansCount,
          overdueLoansCount,
        },
      };
    });

    return NextResponse.json({
      members: formattedMembers,
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
 * POST /api/admin/library/members
 * Register a student or teacher as library member
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন নতুন লাইব্রেরি সদস্য নিবন্ধন করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { memberType, studentId, userId, maxBooks, notes } = body;

    if (!memberType || (memberType !== "STUDENT" && memberType !== "TEACHER")) {
      return NextResponse.json({ error: "সদস্যের ধরন STUDENT অথবা TEACHER হতে হবে।" }, { status: 400 });
    }

    if (memberType === "STUDENT" && !studentId) {
      return NextResponse.json({ error: "শিক্ষার্থী নির্বাচন আবশ্যক।" }, { status: 400 });
    }

    if (memberType === "TEACHER" && !userId) {
      return NextResponse.json({ error: "শিক্ষক ব্যবহারকারী নির্বাচন আবশ্যক।" }, { status: 400 });
    }

    // Check duplicate
    if (memberType === "STUDENT") {
      const existing = await prisma.libraryMember.findUnique({
        where: {
          memberType_studentId: { memberType: "STUDENT", studentId },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: `এই শিক্ষার্থী ইতিমধ্যে সদস্য হিসেবে নিবন্ধিত (কার্ড নং: ${existing.memberNumber})।` },
          { status: 409 }
        );
      }
    } else {
      const existing = await prisma.libraryMember.findUnique({
        where: {
          memberType_userId: { memberType: "TEACHER", userId },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: `এই শিক্ষক ইতিমধ্যে সদস্য হিসেবে নিবন্ধিত (কার্ড নং: ${existing.memberNumber})।` },
          { status: 409 }
        );
      }
    }

    const memberNumber = await generateNextMemberNumber();

    const member = await prisma.libraryMember.create({
      data: {
        memberNumber,
        memberType,
        studentId: memberType === "STUDENT" ? studentId : null,
        userId: memberType === "TEACHER" ? userId : null,
        maxBooks: maxBooks ? parseInt(maxBooks, 10) : null,
        notes,
        status: "ACTIVE",
      },
      include: {
        student: true,
        user: true,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "CREATE",
      entityType: "LibraryMember",
      entityId: member.id,
      details: { memberNumber, memberType, studentId, userId },
    });

    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সদস্য নিবন্ধন ব্যর্থ।" }, { status: 500 });
  }
}
