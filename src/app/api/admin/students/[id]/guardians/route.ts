import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    if (user.role !== "ADMIN" && user.role !== "PRINCIPAL") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন ও মুহতামিম অভিভাবক তালিকা দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const links = await prisma.guardianStudent.findMany({
      where: { studentId: params.id },
      include: { guardian: true },
      orderBy: { isPrimary: "desc" },
    });

    return NextResponse.json({ success: true, guardians: links });
  } catch (error: any) {
    return NextResponse.json({ error: "অভিভাবক তথ্য আনতে ত্রুটি।" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন এই কাজ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { guardianId, isPrimary = false } = body;

    if (!guardianId) {
      return NextResponse.json({ error: "অভিভাবক নির্বাচন আবশ্যক।" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: params.id },
    });
    if (!student) {
      return NextResponse.json({ error: "ছাত্র পাওয়া যায়নি।" }, { status: 404 });
    }

    const guardian = await prisma.guardian.findUnique({
      where: { id: guardianId },
    });
    if (!guardian) {
      return NextResponse.json({ error: "অভিভাবক পাওয়া যায়নি।" }, { status: 404 });
    }

    const link = await prisma.$transaction(async (tx) => {
      if (isPrimary) {
        // Demote existing primary links for this student
        await tx.guardianStudent.updateMany({
          where: { studentId: params.id },
          data: { isPrimary: false },
        });
      }

      const existingLink = await tx.guardianStudent.findUnique({
        where: {
          guardianId_studentId: {
            guardianId,
            studentId: params.id,
          },
        },
      });

      let savedLink;
      if (existingLink) {
        savedLink = await tx.guardianStudent.update({
          where: { id: existingLink.id },
          data: { isPrimary: Boolean(isPrimary) },
        });
      } else {
        savedLink = await tx.guardianStudent.create({
          data: {
            guardianId,
            studentId: params.id,
            isPrimary: Boolean(isPrimary),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "UPDATE",
          entityType: "GuardianStudent",
          entityId: savedLink.id,
          detailsJson: JSON.stringify({
            studentId: params.id,
            studentName: student.fullNameBn,
            guardianName: guardian.fullNameBn,
            isPrimary: savedLink.isPrimary,
          }),
        },
      });

      return savedLink;
    });

    return NextResponse.json({
      success: true,
      link,
      message: `অভিভাবক '${guardian.fullNameBn}' সফলভাবে সংযুক্ত করা হয়েছে।`,
    });
  } catch (error: any) {
    console.error("POST Student Guardian Link Error:", error);
    return NextResponse.json({ error: error.message || "সংযুক্ত করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
