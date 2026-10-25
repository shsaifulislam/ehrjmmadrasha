import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { recordAuditLog, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const teacher = await prisma.user.findFirst({
      where: { id: params.id, role: { in: ["TEACHER", "PRINCIPAL", "STAFF"] } },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        role: true,
        photoUrl: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            nameBn: true,
            nameEn: true,
            gender: true,
            dateOfBirth: true,
            bloodGroup: true,
            mobile: true,
            presentAddress: true,
            permanentAddress: true,
            emergencyContact: true,
            joiningDate: true,
            baseSalary: true,
            status: true,
            department: { select: { id: true, nameBn: true, nameEn: true } },
            designation: { select: { id: true, nameBn: true, nameEn: true } },
          },
        },
        teacherAssignments: {
          include: {
            session: { select: { id: true, name: true, isCurrent: true } },
            subject: {
              select: {
                id: true,
                nameBn: true,
                nameEn: true,
                code: true,
                jamatClass: { select: { id: true, nameBn: true, nameEn: true } },
              },
            },
            section: {
              select: {
                id: true,
                nameBn: true,
                nameEn: true,
                jamatClass: { select: { id: true, nameBn: true, nameEn: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        sessions: {
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
            expiresAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            markedAttendances: true,
            teacherAssignments: true,
            sessions: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "উস্তাদ/শিক্ষকের তথ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    // Recent audit logs regarding this teacher
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: "User",
        entityId: teacher.id,
      },
      include: {
        user: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    return NextResponse.json({
      success: true,
      teacher,
      auditLogs,
    });
  } catch (error: any) {
    console.error("GET Teacher Detail Error:", error);
    return NextResponse.json({ error: "উস্তাদের তথ্য লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন প্রোফাইল সম্পাদনা করতে পারেন।" }, { status: 403 });
    }

    const clientIp = getClientIp(req);
    const body = await req.json();
    const { name, email, phone, designationId, departmentId, baseSalary, presentAddress, permanentAddress, status, role, password } = body;

    const teacher = await prisma.user.findFirst({
      where: { id: params.id, role: { in: ["TEACHER", "PRINCIPAL", "STAFF"] } },
      include: { employee: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "উস্তাদ/কর্মকর্তার তথ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    let passwordHash: string | undefined = undefined;
    if (password && typeof password === "string" && password.trim().length >= 6) {
      passwordHash = await hashPassword(password.trim());
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update user credentials if changed
      const updated = await tx.user.update({
        where: { id: params.id },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(email ? { email: email.trim().toLowerCase() } : {}),
          ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
          ...(status ? { status } : {}),
          ...(role && ["TEACHER", "PRINCIPAL", "STAFF"].includes(role) ? { role } : {}),
          ...(passwordHash ? { passwordHash } : {}),
        },
      });

      // 2. Update or create employee record
      if (teacher.employee) {
        await tx.employee.update({
          where: { id: teacher.employee.id },
          data: {
            ...(name ? { nameBn: name.trim(), nameEn: name.trim() } : {}),
            ...(email ? { email: email.trim().toLowerCase() } : {}),
            ...(phone !== undefined ? { mobile: phone?.trim() || teacher.employee.mobile } : {}),
            ...(designationId !== undefined ? { designationId: designationId || null } : {}),
            ...(departmentId !== undefined ? { departmentId: departmentId || null } : {}),
            ...(baseSalary !== undefined ? { baseSalary: parseFloat(baseSalary) || 0 } : {}),
            ...(presentAddress !== undefined ? { presentAddress: presentAddress || null } : {}),
            ...(permanentAddress !== undefined ? { permanentAddress: permanentAddress || null } : {}),
            ...(status ? { status } : {}),
          },
        });
      }

      // 3. Record Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "UPDATE_TEACHER",
          entityType: "User",
          entityId: teacher.id,
          detailsJson: JSON.stringify({
            updatedFields: { name, email, phone, status, designationId, departmentId },
          }),
          ipAddress: clientIp,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: "উস্তাদের তথ্য সফলভাবে হালনাগাদ করা হয়েছে।",
      teacher: updatedUser,
    });
  } catch (error: any) {
    console.error("PUT Teacher Error:", error);
    return NextResponse.json({ error: error.message || "উস্তাদের তথ্য হালনাগাদে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন শিক্ষক আর্কাইভ করতে পারেন।" }, { status: 403 });
    }

    const clientIp = getClientIp(req);
    const teacher = await prisma.user.findFirst({
      where: { id: params.id, role: { in: ["TEACHER", "PRINCIPAL", "STAFF"] } },
      include: {
        _count: {
          select: {
            teacherAssignments: true,
            markedAttendances: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "উস্তাদের তথ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const forcePermanent = searchParams.get("permanent") === "true";

    // Historical records protection - do not destructively hard-delete if teaching records exist unless explicit permanent purge
    if (!forcePermanent && (teacher._count.teacherAssignments > 0 || teacher._count.markedAttendances > 0)) {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: teacher.id },
          data: { status: "ARCHIVED" },
        });

        // Revoke active sessions immediately
        await tx.session.deleteMany({
          where: { userId: teacher.id },
        });

        // Also update linked employee if any
        await tx.employee.updateMany({
          where: { userId: teacher.id },
          data: { status: "INACTIVE" },
        });

        await tx.auditLog.create({
          data: {
            userId: user.userId,
            action: "ARCHIVE_TEACHER",
            entityType: "User",
            entityId: teacher.id,
            detailsJson: JSON.stringify({
              reason: "Historical records preserved. Status transitioned to ARCHIVED.",
              assignmentsCount: teacher._count.teacherAssignments,
              attendancesCount: teacher._count.markedAttendances,
            }),
            ipAddress: clientIp,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "উস্তাদের পূর্ববর্তী ক্লাস অ্যাসাইনমেন্ট ও ক্লাসের উপস্থিতির ইতিহাস সুরক্ষিত রাখতে প্রোফাইলটি 'আর্কাইভ / সাবেক' (ARCHIVED) হিসেবে সংরক্ষণ করা হয়েছে এবং সমস্ত অ্যাক্টিভ লগইন বাতিল করা হয়েছে।",
      });
    }

    // Permanent deletion: clean up related dependencies and delete user record
    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId: teacher.id } });
      await tx.teacherAssignment.deleteMany({ where: { teacherId: teacher.id } });
      await tx.employee.deleteMany({ where: { userId: teacher.id } });
      await tx.user.delete({ where: { id: teacher.id } });

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "DELETE_TEACHER",
          entityType: "User",
          entityId: teacher.id,
          detailsJson: JSON.stringify({ name: teacher.name, email: teacher.email, mode: forcePermanent ? "FORCE_PERMANENT" : "CLEAN_DELETE" }),
          ipAddress: clientIp,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: forcePermanent ? "উস্তাদের প্রোফাইল ও সমস্ত রেফারেন্স স্থায়ীভাবে মুছে ফেলা হয়েছে।" : "উস্তাদের প্রোফাইল সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    console.error("DELETE Teacher Error:", error);
    return NextResponse.json({ error: "শিক্ষক মুছতে বা আর্কাইভ করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
