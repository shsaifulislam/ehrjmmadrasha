import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const query = searchParams.get("q");

    const students = await prisma.student.findMany({
      where: {
        ...(query
          ? {
              OR: [
                { fullNameBn: { contains: query } },
                { fullNameEn: { contains: query } },
                { studentIdNumber: { contains: query } },
                { fatherPhone: { contains: query } },
              ],
            }
          : {}),
      },
      include: {
        enrollments: {
          include: {
            jamatClass: true,
            session: true,
          },
          orderBy: { enrolledAt: "desc" },
          take: 1,
        },
        feeInvoices: {
          select: {
            dueAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = students.map((s) => {
      const currentEnrollment = s.enrollments[0];
      const totalDue = s.feeInvoices.reduce((acc, inv) => acc + (inv.dueAmount || 0), 0);

      return {
        id: s.id,
        studentIdNumber: s.studentIdNumber,
        fullNameBn: s.fullNameBn,
        fullNameEn: s.fullNameEn,
        fatherNameBn: s.fatherNameBn,
        fatherPhone: s.fatherPhone,
        residentialStatus: s.residentialStatus,
        isOrphan: s.isOrphan,
        status: s.status,
        className: currentEnrollment?.jamatClass?.nameBn || "বরাদ্দহীন",
        rollNumber: currentEnrollment?.rollNumber || 0,
        totalDue,
        createdAt: s.createdAt,
      };
    });

    return NextResponse.json({ success: true, students: formatted });
  } catch (error: any) {
    console.error("Admin Students API Error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
