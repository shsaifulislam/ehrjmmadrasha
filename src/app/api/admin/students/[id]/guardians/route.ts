import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
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
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
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

export async function PUT(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন এই কাজ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { guardianName, relation = "FATHER", phone, email, address } = body;

    if (!guardianName?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "অভিভাবকের নাম এবং মোবাইল নম্বর আবশ্যক।" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        guardianLinks: {
          include: { guardian: true },
          where: { isPrimary: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
    }

    const oldValues = {
      fatherNameBn: student.fatherNameBn,
      fatherPhone: student.fatherPhone,
      presentAddress: student.presentAddress,
      primaryGuardian: student.guardianLinks[0]?.guardian?.fullNameBn || null,
      primaryGuardianPhone: student.guardianLinks[0]?.guardian?.phone || null,
    };

    const newValues = {
      guardianName: guardianName.trim(),
      relation: relation.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      address: address?.trim() || null,
    };

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update or create Guardian
      let guardian = await tx.guardian.findUnique({
        where: { phone: newValues.phone },
      });

      if (guardian) {
        guardian = await tx.guardian.update({
          where: { id: guardian.id },
          data: {
            fullNameBn: newValues.guardianName,
            relation: newValues.relation,
            ...(newValues.email ? { email: newValues.email } : {}),
            ...(newValues.address ? { address: newValues.address } : {}),
          },
        });
      } else {
        guardian = await tx.guardian.create({
          data: {
            fullNameBn: newValues.guardianName,
            relation: newValues.relation,
            phone: newValues.phone,
            email: newValues.email,
            address: newValues.address,
          },
        });
      }

      // 2. Set primary link
      await tx.guardianStudent.updateMany({
        where: { studentId: params.id },
        data: { isPrimary: false },
      });

      const existingLink = await tx.guardianStudent.findUnique({
        where: {
          guardianId_studentId: {
            guardianId: guardian.id,
            studentId: params.id,
          },
        },
      });

      if (existingLink) {
        await tx.guardianStudent.update({
          where: { id: existingLink.id },
          data: { isPrimary: true },
        });
      } else {
        await tx.guardianStudent.create({
          data: {
            guardianId: guardian.id,
            studentId: params.id,
            isPrimary: true,
          },
        });
      }

      // 3. Update student table fallback fields
      const isFather =
        newValues.relation.toUpperCase().includes("FATHER") ||
        newValues.relation.includes("পিতা") ||
        newValues.relation.includes("বাবা");

      await tx.student.update({
        where: { id: params.id },
        data: {
          ...(isFather
            ? { fatherNameBn: newValues.guardianName, fatherPhone: newValues.phone }
            : { fatherNameBn: student.fatherNameBn === "অজানা" ? newValues.guardianName : student.fatherNameBn }),
          ...(newValues.address ? { presentAddress: newValues.address } : {}),
        },
      });

      // 4. Record Audit Log with strict who/old/new/timestamp
      const auditLog = await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "UPDATE",
          entityType: "StudentGuardian",
          entityId: params.id,
          detailsJson: JSON.stringify({
            whoUpdated: user.name,
            whoUpdatedRole: user.role,
            studentId: student.id,
            studentIdNumber: student.studentIdNumber,
            studentName: student.fullNameBn,
            oldValues,
            newValues,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return { guardian, auditLog };
    });

    return NextResponse.json({
      success: true,
      message: "অভিভাবকের তথ্য সফলভাবে হালনাগাদ ও অডিট লগ সংরক্ষিত হয়েছে।",
      guardian: updated.guardian,
    });
  } catch (error: any) {
    console.error("PUT Student Guardian Error:", error);
    return NextResponse.json({ error: error.message || "অভিভাবকের তথ্য সংরক্ষণে ত্রুটি।" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন এই কাজ করতে পারেন।" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    let guardianId = searchParams.get("guardianId");

    if (!guardianId) {
      try {
        const body = await req.json();
        guardianId = body?.guardianId;
      } catch {}
    }

    if (!guardianId) {
      return NextResponse.json({ error: "অভিভাবক আইডি আবশ্যক।" }, { status: 400 });
    }

    const link = await prisma.guardianStudent.findUnique({
      where: {
        guardianId_studentId: {
          guardianId,
          studentId: params.id,
        },
      },
      include: { guardian: true, student: true },
    });

    if (!link) {
      return NextResponse.json({ error: "এই শিক্ষার্থীর সাথে উক্ত অভিভাবকের সংযোগ পাওয়া যায়নি।" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.guardianStudent.delete({
        where: { id: link.id },
      });

      // If deleted link was primary, promote another link if available
      if (link.isPrimary) {
        const remaining = await tx.guardianStudent.findFirst({
          where: { studentId: params.id },
          orderBy: { createdAt: "asc" },
        });
        if (remaining) {
          await tx.guardianStudent.update({
            where: { id: remaining.id },
            data: { isPrimary: true },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "DELETE",
          entityType: "GuardianStudent",
          entityId: link.id,
          detailsJson: JSON.stringify({
            action: "UNLINK_GUARDIAN",
            studentId: params.id,
            studentName: link.student.fullNameBn,
            guardianId,
            guardianName: link.guardian.fullNameBn,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "অভিভাবকের সংযোগ সফলভাবে বিচ্ছিন্ন করা হয়েছে।",
    });
  } catch (error: any) {
    console.error("DELETE Student Guardian Link Error:", error);
    return NextResponse.json({ error: error.message || "অভিভাবকের সংযোগ বিচ্ছিন্ন করতে ত্রুটি।" }, { status: 500 });
  }
}

