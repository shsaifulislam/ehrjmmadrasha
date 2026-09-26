import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const sessions = await prisma.academicSession.findMany({
      include: {
        _count: {
          select: {
            enrollments: true,
            attendances: true,
            feeInvoices: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    console.error("GET Academic Sessions Error:", error);
    return NextResponse.json({ error: "সেশন তালিকা লোড করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন এই কাজ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { name, startDate, endDate, status = "DRAFT", isCurrent = false } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "সেশনের নাম, শুরুর তারিখ এবং শেষের তারিখ আবশ্যক।" },
        { status: 400 }
      );
    }

    // Check duplicate name
    const existing = await prisma.academicSession.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "এই নামের শিক্ষাবর্ষ বা সেশন ইতিমধ্যে বিদ্যমান।" },
        { status: 400 }
      );
    }

    // If setting as current/active, update others if requested
    const result = await prisma.$transaction(async (tx) => {
      if (isCurrent || status === "ACTIVE") {
        await tx.academicSession.updateMany({
          data: { isCurrent: false },
        });
      }

      const session = await tx.academicSession.create({
        data: {
          name: name.trim(),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: status || "ACTIVE",
          isCurrent: Boolean(isCurrent || status === "ACTIVE"),
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "CREATE",
          entityType: "AcademicSession",
          entityId: session.id,
          detailsJson: JSON.stringify({ name: session.name, status: session.status, isCurrent: session.isCurrent }),
        },
      });

      return session;
    });

    return NextResponse.json({ success: true, session: result });
  } catch (error: any) {
    console.error("POST Academic Session Error:", error);
    return NextResponse.json({ error: error.message || "নতুন সেশন তৈরিতে ত্রুটি।" }, { status: 500 });
  }
}
