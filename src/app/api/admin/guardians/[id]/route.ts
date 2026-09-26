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

    const guardian = await prisma.guardian.findUnique({
      where: { id: params.id },
      include: {
        students: {
          include: {
            student: {
              include: {
                enrollments: {
                  include: {
                    jamatClass: true,
                    section: true,
                    session: true,
                  },
                  orderBy: { enrolledAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!guardian) {
      return NextResponse.json({ error: "অভিভাবকের তথ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, guardian });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch guardian" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন এই কাজ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { fullNameBn, fullNameEn, relation, phone, email, nidNo, occupation, address } = body;

    const existing = await prisma.guardian.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "অভিভাবক পাওয়া যায়নি।" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const g = await tx.guardian.update({
        where: { id: params.id },
        data: {
          ...(fullNameBn ? { fullNameBn: fullNameBn.trim() } : {}),
          ...(fullNameEn !== undefined ? { fullNameEn } : {}),
          ...(relation ? { relation } : {}),
          ...(phone ? { phone: phone.trim() } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(nidNo !== undefined ? { nidNo } : {}),
          ...(occupation !== undefined ? { occupation } : {}),
          ...(address !== undefined ? { address } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "UPDATE",
          entityType: "Guardian",
          entityId: g.id,
          detailsJson: JSON.stringify({ old: existing, new: g }),
        },
      });

      return g;
    });

    return NextResponse.json({ success: true, guardian: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "অভিভাবকের তথ্য আপডেট করতে ত্রুটি।" }, { status: 500 });
  }
}
