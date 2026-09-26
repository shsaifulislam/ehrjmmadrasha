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
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const section = await prisma.section.findUnique({
      where: { id: params.id },
      include: {
        jamatClass: true,
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: "শাখা পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, section });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch section" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন এই পরিবর্তন করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { nameBn, nameEn, roomNo, maxCapacity } = body;

    const existing = await prisma.section.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "শাখা পাওয়া যায়নি।" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const sec = await tx.section.update({
        where: { id: params.id },
        data: {
          ...(nameBn ? { nameBn: nameBn.trim() } : {}),
          ...(nameEn ? { nameEn: nameEn.trim() } : {}),
          ...(roomNo !== undefined ? { roomNo: roomNo ? String(roomNo).trim() : null } : {}),
          ...(maxCapacity !== undefined ? { maxCapacity: Number(maxCapacity) } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "UPDATE",
          entityType: "Section",
          entityId: sec.id,
          detailsJson: JSON.stringify({ old: existing, updated: sec }),
        },
      });

      return sec;
    });

    return NextResponse.json({ success: true, section: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "শাখা আপডেট ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const enrollmentCount = await prisma.enrollment.count({
      where: { sectionId: params.id },
    });

    if (enrollmentCount > 0) {
      return NextResponse.json(
        {
          error: `এই শাখায় ${enrollmentCount} জন ছাত্রের রেকর্ড সংরক্ষিত রয়েছে। ডেটা সুরক্ষার জন্য এটি মুছে ফেলা সম্ভব নয়।`,
        },
        { status: 400 }
      );
    }

    await prisma.section.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "শাখা সফলভাবে মুছে ফেলা হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: "মুছে ফেলতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
