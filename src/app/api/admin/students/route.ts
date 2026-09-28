import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateStudentIdNumber, getNextRollNumber } from "@/lib/studentId";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    if (user.role === "GUARDIAN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস: অভিভাবকগণের জন্য প্রশাসনিক শিক্ষার্থী তালিকা নিষিদ্ধ।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const query = searchParams.get("q")?.trim();
    const sessionId = searchParams.get("sessionId");
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const gender = searchParams.get("gender");
    const residentialStatus = searchParams.get("residentialStatus");
    const status = searchParams.get("status");
    const isOrphan = searchParams.get("isOrphan");
    const isFinanciallyWeak = searchParams.get("isFinanciallyWeak");

    // Teacher academic scoping (Prevent unauthorized teacher snooping)
    let teacherAllowedClassIds: string[] | null = null;
    if (user.role === "TEACHER") {
      const assignments = await prisma.teacherAssignment.findMany({
        where: { teacherId: user.userId },
        select: { classId: true },
      });
      teacherAllowedClassIds = assignments.map((a) => a.classId);
    }

    // Build enrollment filter condition
    const enrollmentWhere: any = {};
    if (sessionId) enrollmentWhere.sessionId = sessionId;
    if (classId) {
      // If teacher, ensure requested classId is within assignments
      if (teacherAllowedClassIds && !teacherAllowedClassIds.includes(classId)) {
        return NextResponse.json({ success: true, students: [], total: 0, page, totalPages: 0 });
      }
      enrollmentWhere.classId = classId;
    } else if (teacherAllowedClassIds) {
      enrollmentWhere.classId = { in: teacherAllowedClassIds };
    }
    if (sectionId) enrollmentWhere.sectionId = sectionId;

    // Main student where clause
    const where: any = {
      ...(status ? { status } : {}),
      ...(gender ? { gender } : {}),
      ...(residentialStatus ? { residentialStatus } : {}),
      ...(isOrphan !== null && isOrphan !== undefined && isOrphan !== "" ? { isOrphan: isOrphan === "true" } : {}),
      ...(isFinanciallyWeak !== null && isFinanciallyWeak !== undefined && isFinanciallyWeak !== ""
        ? { isFinanciallyWeak: isFinanciallyWeak === "true" }
        : {}),
      ...(Object.keys(enrollmentWhere).length > 0
        ? { enrollments: { some: enrollmentWhere } }
        : teacherAllowedClassIds
        ? { enrollments: { some: { classId: { in: teacherAllowedClassIds } } } }
        : {}),
    };

    if (query) {
      where.OR = [
        { studentIdNumber: { contains: query } },
        { fullNameBn: { contains: query } },
        { fullNameEn: { contains: query } },
        { fullNameAr: { contains: query } },
        { fatherNameBn: { contains: query } },
        { motherNameBn: { contains: query } },
        { fatherPhone: { contains: query } },
        { birthCertificateNo: { contains: query } },
        {
          enrollments: {
            some: {
              rollNumber: isNaN(parseInt(query, 10)) ? undefined : parseInt(query, 10),
            },
          },
        },
      ];
    }

    const [total, students, activeSession] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        include: {
          enrollments: {
            include: {
              jamatClass: { select: { id: true, nameBn: true, nameEn: true, code: true } },
              section: { select: { id: true, nameBn: true, nameEn: true } },
              session: { select: { id: true, name: true, isCurrent: true } },
            },
            orderBy: { enrolledAt: "desc" },
            take: 1,
          },
          guardianLinks: {
            include: {
              guardian: {
                select: { id: true, fullNameBn: true, phone: true, relation: true },
              },
            },
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: {
              documents: true,
              feeInvoices: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.academicSession.findFirst({
        where: { isCurrent: true },
        select: { id: true, name: true },
      }),
    ]);

    const formatted = students.map((s) => {
      const currentEnrollment = s.enrollments[0];
      const primaryGuardian = s.guardianLinks[0]?.guardian;

      return {
        id: s.id,
        studentIdNumber: s.studentIdNumber,
        fullNameBn: s.fullNameBn,
        fullNameEn: s.fullNameEn,
        fullNameAr: s.fullNameAr,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth,
        fatherNameBn: s.fatherNameBn,
        motherNameBn: s.motherNameBn,
        fatherPhone: s.fatherPhone,
        residentialStatus: s.residentialStatus,
        isOrphan: s.isOrphan,
        isFinanciallyWeak: s.isFinanciallyWeak,
        status: s.status,
        sessionName: currentEnrollment?.session?.name || "বরাদ্দহীন",
        className: currentEnrollment?.jamatClass?.nameBn || "বরাদ্দহীন",
        classId: currentEnrollment?.jamatClass?.id,
        sectionName: currentEnrollment?.section?.nameBn || "সাধারণ",
        rollNumber: currentEnrollment?.rollNumber || 0,
        primaryGuardianName: primaryGuardian?.fullNameBn || s.fatherNameBn,
        guardianPhone: primaryGuardian?.phone || s.fatherPhone,
        documentsCount: s._count.documents,
        createdAt: s.createdAt,
      };
    });

    // Overview counters for quick admin stats
    const [totalCount, residentialCount, dayCareCount, orphanCount] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { residentialStatus: "RESIDENTIAL" } }),
      prisma.student.count({ where: { residentialStatus: "DAY_CARE" } }),
      prisma.student.count({ where: { isOrphan: true } }),
    ]);

    return NextResponse.json({
      success: true,
      students: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalStudents: totalCount,
        residential: residentialCount,
        dayCare: dayCareCount,
        orphan: orphanCount,
        activeSession: activeSession?.name || "চলতি সেশন নেই",
      },
    });
  } catch (error: any) {
    console.error("GET Students API Error:", error);
    return NextResponse.json({ error: "ছাত্র তালিকা আনতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন নতুন ছাত্র ভর্তি করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      fullNameBn,
      fullNameEn,
      fullNameAr,
      dateOfBirth,
      gender = "MALE",
      bloodGroup,
      nationality = "Bangladeshi",
      birthCertificateNo,
      nidNo,
      fatherNameBn,
      fatherNameEn,
      fatherPhone,
      fatherOccupation,
      motherNameBn,
      motherNameEn,
      motherPhone,
      presentAddress,
      permanentAddress,
      residentialStatus = "NON_RESIDENTIAL",
      isOrphan = false,
      isFinanciallyWeak = false,
      status = "ACTIVE",
      // Academic Enrollment fields
      sessionId,
      classId,
      sectionId,
      customRoll,
      // Guardian Info
      guardianNameBn,
      guardianPhone,
      guardianRelation = "FATHER",
      guardianAddress,
    } = body;

    // Validations
    if (!fullNameBn || !dateOfBirth || !fatherNameBn || !motherNameBn || !presentAddress) {
      return NextResponse.json(
        { error: "আবশ্যকীয় তথ্য (বাংলা নাম, জন্মতারিখ, পিতার নাম, মাতার নাম ও বর্তমান ঠিকানা) পূরণ করুন।" },
        { status: 400 }
      );
    }

    // Check birth certificate uniqueness if provided
    if (birthCertificateNo) {
      const existingDoc = await prisma.student.findUnique({
        where: { birthCertificateNo: birthCertificateNo.trim() },
      });
      if (existingDoc) {
        return NextResponse.json(
          { error: "এই জন্ম নিবন্ধন নম্বর ইতিমধ্যে অন্য একজন ছাত্রের প্রোফাইলে নিবন্ধিত।" },
          { status: 400 }
        );
      }
    }

    // Generate permanent Student ID (EHRJ-YYYY-XXXX)
    const currentYear = new Date().getFullYear();
    const studentIdNumber = await generateStudentIdNumber(currentYear);

    // Transaction for atomic creation
    const newStudent = await prisma.$transaction(async (tx) => {
      // 1. Create Student Master Record
      const student = await tx.student.create({
        data: {
          studentIdNumber,
          fullNameBn: fullNameBn.trim(),
          fullNameEn: fullNameEn?.trim() || fullNameBn.trim(),
          fullNameAr: fullNameAr?.trim() || null,
          dateOfBirth: new Date(dateOfBirth),
          gender: gender || "MALE",
          bloodGroup: bloodGroup || null,
          nationality: nationality || "Bangladeshi",
          birthCertificateNo: birthCertificateNo ? birthCertificateNo.trim() : null,
          nidNo: nidNo ? nidNo.trim() : null,
          fatherNameBn: fatherNameBn.trim(),
          fatherNameEn: fatherNameEn?.trim() || null,
          fatherPhone: fatherPhone ? fatherPhone.trim() : null,
          fatherOccupation: fatherOccupation || null,
          motherNameBn: motherNameBn.trim(),
          motherNameEn: motherNameEn?.trim() || null,
          motherPhone: motherPhone ? motherPhone.trim() : null,
          presentAddress: presentAddress.trim(),
          permanentAddress: permanentAddress ? permanentAddress.trim() : presentAddress.trim(),
          residentialStatus: residentialStatus || "NON_RESIDENTIAL",
          isOrphan: Boolean(isOrphan),
          isFinanciallyWeak: Boolean(isFinanciallyWeak),
          status: status || "ACTIVE",
        },
      });

      // 2. Academic Enrollment if Session & Class are specified
      let resolvedSessionId = sessionId;
      if (!resolvedSessionId) {
        const activeSess = await tx.academicSession.findFirst({ where: { isCurrent: true } });
        resolvedSessionId = activeSess?.id;
      }

      if (resolvedSessionId && classId) {
        let assignedRoll = Number(customRoll);
        if (!assignedRoll || isNaN(assignedRoll) || assignedRoll <= 0) {
          const nextRoll = await getNextRollNumber(resolvedSessionId, classId, sectionId);
          assignedRoll = nextRoll;
        }

        await tx.enrollment.create({
          data: {
            studentId: student.id,
            sessionId: resolvedSessionId,
            classId,
            sectionId: sectionId || null,
            rollNumber: assignedRoll,
            status: "ACTIVE",
          },
        });
      }

      // 3. Guardian Linking if guardian details provided
      const targetPhone = (guardianPhone || fatherPhone || "").trim();
      const targetGuardianName = (guardianNameBn || fatherNameBn).trim();

      if (targetPhone && targetGuardianName) {
        // Find existing guardian by unique phone or create new
        let guardian = await tx.guardian.findUnique({
          where: { phone: targetPhone },
        });

        if (!guardian) {
          guardian = await tx.guardian.create({
            data: {
              fullNameBn: targetGuardianName,
              fullNameEn: fullNameEn || null,
              relation: guardianRelation || "FATHER",
              phone: targetPhone,
              address: guardianAddress || presentAddress.trim(),
            },
          });
        }

        // Link guardian to student
        await tx.guardianStudent.create({
          data: {
            guardianId: guardian.id,
            studentId: student.id,
            isPrimary: true,
          },
        });
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "CREATE",
          entityType: "Student",
          entityId: student.id,
          detailsJson: JSON.stringify({
            studentIdNumber: student.studentIdNumber,
            name: student.fullNameBn,
            residentialStatus: student.residentialStatus,
            classId,
            sessionId: resolvedSessionId,
          }),
        },
      });

      return student;
    });

    return NextResponse.json({
      success: true,
      student: newStudent,
      message: `ছাত্র '${newStudent.fullNameBn}' সফলভাবে নিবন্ধিত হয়েছে। স্টুডেন্ট আইডি: ${newStudent.studentIdNumber}`,
    });
  } catch (error: any) {
    console.error("POST Student API Error:", error);
    return NextResponse.json(
      { error: error.message || "নতুন ছাত্র নিবন্ধন করতে ত্রুটি হয়েছে।" },
      { status: 500 }
    );
  }
}
