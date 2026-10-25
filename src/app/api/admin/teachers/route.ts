import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { recordAuditLog, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন বা অধ্যক্ষ এই পৃষ্ঠা দেখতে পারেন।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status")?.trim();
    const requestedRole = searchParams.get("role")?.trim();

    const where: any = {
      role: requestedRole && requestedRole !== "ALL"
        ? requestedRole
        : { in: ["TEACHER", "PRINCIPAL", "STAFF"] },
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { username: { contains: q } },
        {
          employee: {
            OR: [
              { nameBn: { contains: q } },
              { nameEn: { contains: q } },
              { employeeId: { contains: q } },
            ],
          },
        },
      ];
    }

    const teachers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            nameBn: true,
            nameEn: true,
            gender: true,
            mobile: true,
            status: true,
            joiningDate: true,
            baseSalary: true,
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
        _count: {
          select: {
            teacherAssignments: true,
            markedAttendances: true,
            sessions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Overview counters
    const [totalTeachers, activeTeachers, inactiveTeachers, archivedTeachers] = await Promise.all([
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "TEACHER", status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "TEACHER", status: "INACTIVE" } }),
      prisma.user.count({ where: { role: "TEACHER", status: "ARCHIVED" } }),
    ]);

    return NextResponse.json({
      success: true,
      teachers,
      stats: {
        total: totalTeachers,
        active: activeTeachers,
        inactive: inactiveTeachers,
        archived: archivedTeachers,
      },
    });
  } catch (error: any) {
    console.error("Admin Teachers GET Error:", error);
    return NextResponse.json({ error: "উস্তাদ/শিক্ষক তালিকা লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন শিক্ষক যুক্ত করতে পারেন।" }, { status: 403 });
    }

    const clientIp = getClientIp(req);
    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      role = "TEACHER",
      designationId,
      departmentId,
      joiningDate,
      baseSalary,
      initialClassId,
      initialSectionId,
      initialSubjectId,
      initialSessionId,
    } = body;

    const assignedRole = role === "PRINCIPAL" ? "PRINCIPAL" : role === "STAFF" ? "STAFF" : "TEACHER";

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "উস্তাদের নাম, অফিসিয়াল ইমেইল ও পাসওয়ার্ড প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    if (password.trim().length < 6) {
      return NextResponse.json(
        { error: "নিরাপত্তা নীতি অনুযায়ী পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone?.trim() || null;

    // Check duplicate
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: cleanEmail },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "এই ইমেইল বা ফোন নম্বরে ইতিমধ্যে একটি অ্যাকাউন্ট নিবন্ধিত রয়েছে।" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password.trim());
    const generatedUsername = cleanEmail.split("@")[0] + "_" + Math.floor(1000 + Math.random() * 9000);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const newTeacher = await tx.user.create({
        data: {
          name: name.trim(),
          username: generatedUsername,
          email: cleanEmail,
          phone: cleanPhone,
          passwordHash,
          role: assignedRole,
          status: "ACTIVE",
        },
      });

      // 2. Optional Employee profile link
      const employeeYear = new Date().getFullYear();
      const empCount = await tx.employee.count();
      const employeeSeq = String(empCount + 1).padStart(4, "0");
      const employeeId = assignedRole === "PRINCIPAL"
        ? `EHRJ-PRIN-${employeeYear}-${employeeSeq}`
        : assignedRole === "STAFF"
        ? `EHRJ-STF-${employeeYear}-${employeeSeq}`
        : `EHRJ-TCH-${employeeYear}-${employeeSeq}`;

      await tx.employee.create({
        data: {
          employeeId,
          userId: newTeacher.id,
          nameBn: name.trim(),
          nameEn: name.trim(),
          mobile: cleanPhone || "01800000000",
          email: cleanEmail,
          employeeType: assignedRole === "PRINCIPAL" ? "PRINCIPAL" : assignedRole === "STAFF" ? "OFFICE" : "TEACHER",
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          baseSalary: baseSalary ? parseFloat(baseSalary) : 0,
          departmentId: departmentId || null,
          designationId: designationId || null,
          status: "ACTIVE",
        },
      });

      // 3. Optional initial teaching assignment
      if (initialClassId) {
        let resolvedSessionId = initialSessionId;
        if (!resolvedSessionId) {
          const currentSess = await tx.academicSession.findFirst({ where: { isCurrent: true } });
          resolvedSessionId = currentSess?.id;
        }

        if (resolvedSessionId) {
          await tx.teacherAssignment.create({
            data: {
              teacherId: newTeacher.id,
              classId: initialClassId,
              sectionId: initialSectionId || null,
              subjectId: initialSubjectId || null,
              sessionId: resolvedSessionId,
            },
          });
        }
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "CREATE_TEACHER",
          entityType: "User",
          entityId: newTeacher.id,
          detailsJson: JSON.stringify({
            name: newTeacher.name,
            email: newTeacher.email,
            phone: newTeacher.phone,
            employeeId,
          }),
          ipAddress: clientIp,
        },
      });

      return newTeacher;
    });

    return NextResponse.json({
      success: true,
      message: `উস্তাদ '${result.name}' এর অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।`,
      teacher: {
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        status: result.status,
      },
    });
  } catch (error: any) {
    console.error("Admin Teachers POST Error:", error);
    return NextResponse.json({ error: error.message || "উস্তাদ অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
