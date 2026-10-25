import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const session = await prisma.academicSession.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            enrollments: true,
            attendances: true,
            feeInvoices: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "সেশনটি পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন এই কাজ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { name, startDate, endDate, status } = body;

    const existing = await prisma.academicSession.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "সেশন পাওয়া যায়নি।" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const sess = await tx.academicSession.update({
        where: { id: params.id },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(startDate ? { startDate: new Date(startDate) } : {}),
          ...(endDate ? { endDate: new Date(endDate) } : {}),
          ...(status ? { status } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "UPDATE",
          entityType: "AcademicSession",
          entityId: sess.id,
          detailsJson: JSON.stringify({ old: existing, updated: sess }),
        },
      });

      return sess;
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "আপডেট করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    // Check dependent records - rule: session deletion must be prevented when dependent academic data exists!
    const enrollmentCount = await prisma.enrollment.count({
      where: { sessionId: params.id },
    });
    const invoiceCount = await prisma.feeInvoice.count({
      where: { sessionId: params.id },
    });

    if (enrollmentCount > 0 || invoiceCount > 0) {
      return NextResponse.json(
        {
          error: `এই সেশনে ${enrollmentCount} জন ছাত্রের ভর্তি ও ${invoiceCount} টি হিসাব রেকর্ড রয়েছে। তাই সেশন মুছে ফেলা যাবে না; প্রয়োজনে সেশনটি বন্ধ (CLOSED) করুন।`,
        },
        { status: 400 }
      );
    }

    await prisma.academicSession.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "সেশন সফলভাবে মুছে ফেলা হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: "মুছে ফেলতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
