import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const module = searchParams.get("module")?.toUpperCase() || "OVERVIEW";
    const user = await getSessionUser(req).catch(() => null);

    // 1. STUDENTS MODULE
    if (module === "STUDENTS") {
      const classId = searchParams.get("classId");
      const search = searchParams.get("search")?.trim();
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
      const skip = (page - 1) * limit;

      const status = searchParams.get("status");
      const where: any = {};
      if (status && status !== "ALL") {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { fullNameBn: { contains: search } },
          { fullNameEn: { contains: search } },
          { studentIdNumber: { contains: search } },
          { fatherPhone: { contains: search } },
        ];
      }

      if (classId && classId !== "ALL") {
        where.enrollments = {
          some: {
            classId,
            status: "ACTIVE",
          },
        };
      }

      const [total, students] = await Promise.all([
        prisma.student.count({ where }),
        prisma.student.findMany({
          where,
          skip,
          take: limit,
          orderBy: { studentIdNumber: "asc" },
          include: {
            enrollments: {
              where: { status: "ACTIVE" },
              take: 1,
              include: {
                jamatClass: { select: { id: true, nameBn: true, code: true } },
                section: { select: { id: true, nameBn: true } },
              },
            },
          },
        }),
      ]);

      const formatted = students.map((s) => ({
        id: s.id,
        studentId: s.studentIdNumber,
        nameBn: s.fullNameBn,
        nameEn: s.fullNameEn,
        fatherName: s.fatherNameBn,
        guardianPhone: s.fatherPhone || "০১৮৪৫-১৬২৬৬৪",
        className: s.enrollments[0]?.jamatClass?.nameBn || "সাধারণ",
        classCode: s.enrollments[0]?.jamatClass?.code || "GEN",
        sectionName: s.enrollments[0]?.section?.nameBn || "শাখা-ক",
        rollNumber: s.enrollments[0]?.rollNumber || 1,
        residentialStatus: s.residentialStatus,
        bloodGroup: s.bloodGroup || "O+",
        status: s.status,
      }));

      return NextResponse.json({
        success: true,
        data: {
          students: formatted,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // 2. FEES & FINANCE MODULE
    if (module === "FEES") {
      const status = searchParams.get("status");
      const search = searchParams.get("search")?.trim();
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status && status !== "ALL") {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { invoiceNumber: { contains: search } },
          { title: { contains: search } },
          { student: { fullNameBn: { contains: search } } },
          { student: { studentIdNumber: { contains: search } } },
        ];
      }

      const [total, invoices, summary] = await Promise.all([
        prisma.feeInvoice.count({ where }),
        prisma.feeInvoice.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            student: {
              select: {
                id: true,
                fullNameBn: true,
                studentIdNumber: true,
                enrollments: {
                  where: { status: "ACTIVE" },
                  take: 1,
                  include: { jamatClass: true },
                },
              },
            },
            receipts: {
              take: 1,
              select: { receiptNumber: true, paymentMethod: true, transactionId: true, receiptDate: true },
            },
          },
        }),
        prisma.feeInvoice.aggregate({
          _sum: { netAmount: true, paidAmount: true, dueAmount: true },
        }),
      ]);

      const formatted = invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        studentName: inv.student?.fullNameBn,
        studentId: inv.student?.studentIdNumber,
        className: inv.student?.enrollments[0]?.jamatClass?.nameBn || "সাধারণ",
        title: inv.title,
        feeType: inv.feeType,
        netAmount: inv.netAmount,
        paidAmount: inv.paidAmount,
        dueAmount: inv.dueAmount,
        status: inv.status,
        dueDate: inv.dueDate.toLocaleDateString("bn-BD"),
        receiptNumber: inv.receipts[0]?.receiptNumber || null,
        transactionId: inv.receipts[0]?.transactionId || null,
      }));

      return NextResponse.json({
        success: true,
        data: {
          invoices: formatted,
          total,
          summary: {
            totalInvoiced: summary._sum.netAmount || 0,
            totalCollected: summary._sum.paidAmount || 0,
            totalDue: summary._sum.dueAmount || 0,
          },
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // 3. ADMISSION APPLICATIONS MODULE
    if (module === "ADMISSIONS") {
      const status = searchParams.get("status");
      const search = searchParams.get("search")?.trim();
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status && status !== "ALL") {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { applicationNumber: { contains: search } },
          { studentNameBn: { contains: search } },
          { guardianName: { contains: search } },
          { guardianPhone: { contains: search } },
        ];
      }

      const [total, applications, counts, classes] = await Promise.all([
        prisma.application.count({ where }),
        prisma.application.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.application.groupBy({
          by: ["status"],
          _count: { status: true },
        }),
        prisma.jamatClass.findMany({ select: { id: true, nameBn: true } }),
      ]);

      const classMap = new Map(classes.map((c) => [c.id, c.nameBn]));

      const formatted = applications.map((app) => ({
        id: app.id,
        trackingCode: app.applicationNumber,
        studentName: app.studentNameBn,
        guardianName: app.guardianName,
        guardianPhone: app.guardianPhone,
        desiredClass: (app.desiredClassId && classMap.get(app.desiredClassId)) || "হিফজুল কুরআন বিভাগ",
        status: app.status,
        dateOfBirth: app.dateOfBirth.toLocaleDateString("bn-BD"),
        submittedAt: app.createdAt.toLocaleDateString("bn-BD"),
      }));

      const countMap: Record<string, number> = {};
      counts.forEach((c) => {
        countMap[c.status] = c._count.status;
      });

      return NextResponse.json({
        success: true,
        data: {
          applications: formatted,
          total,
          counts: countMap,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // 4. NOTICES MODULE
    if (module === "NOTICES") {
      const category = searchParams.get("category");
      const search = searchParams.get("search")?.trim();

      const where: any = { isPublished: true };
      if (category && category !== "ALL") {
        where.category = category;
      }
      if (search) {
        where.OR = [
          { titleBn: { contains: search } },
          { contentBn: { contains: search } },
        ];
      }

      const notices = await prisma.notice.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 20,
        select: {
          id: true,
          titleBn: true,
          contentBn: true,
          category: true,
          priority: true,
          isPinned: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          notices: notices.map((n) => ({
            id: n.id,
            title: n.titleBn,
            content: n.contentBn,
            category: n.category,
            priority: n.priority,
            isPinned: n.isPinned,
            date: n.createdAt.toLocaleDateString("bn-BD"),
          })),
        },
      });
    }

    // 5. GATEPASS MODULE
    if (module === "GATEPASS") {
      const status = searchParams.get("status");
      const where: any = {};
      if (status && status !== "ALL") {
        where.status = status;
      }

      const leaveRequests = await prisma.studentLeaveRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          student: {
            select: { id: true, fullNameBn: true, studentIdNumber: true },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          gatepasses: leaveRequests.map((gp) => ({
            id: gp.id,
            passNumber: `GP-${gp.id.slice(0, 8).toUpperCase()}`,
            studentName: gp.student.fullNameBn,
            studentId: gp.student.studentIdNumber,
            reason: gp.reason,
            destination: "বাসায় গমন",
            status: gp.status,
            issuedAt: gp.createdAt.toLocaleDateString("bn-BD"),
            expectedReturn: gp.endDate ? gp.endDate.toLocaleDateString("bn-BD") : "প্রযোজ্য নয়",
          })),
        },
      });
    }

    // 6. CLASSES AND DEPARTMENTS MODULE
    if (module === "CLASSES") {
      const classes = await prisma.jamatClass.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { enrollments: true, subjects: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          classes: classes.map((c) => ({
            id: c.id,
            nameBn: c.nameBn,
            nameEn: c.nameEn,
            code: c.code,
            studentCount: c._count.enrollments,
            subjectCount: c._count.subjects,
          })),
        },
      });
    }

    // 7. EXAMS MODULE
    if (module === "EXAMS") {
      const exams = await prisma.exam.findMany({
        orderBy: { startDate: "desc" },
        take: 10,
        include: {
          _count: { select: { examMarks: true, results: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          exams: exams.map((e) => ({
            id: e.id,
            nameBn: e.nameBn,
            nameEn: e.nameEn,
            examType: e.examType,
            status: e.status,
            startDate: e.startDate.toLocaleDateString("bn-BD"),
            endDate: e.endDate.toLocaleDateString("bn-BD"),
            marksCount: e._count.examMarks,
            resultsCount: e._count.results,
          })),
        },
      });
    }

    return NextResponse.json({ error: "অজানা মডিউল রিকোয়েস্ট।" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in /api/app/module-data:", error);
    return NextResponse.json({ error: "মডিউল তথ্য লোড করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req).catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত: অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, payload } = body;
    const clientIp = getClientIp(req);

    // 1. UPDATE ADMISSION STATUS (Admin / Principal only)
    if (action === "UPDATE_ADMISSION_STATUS") {
      if (!["ADMIN", "PRINCIPAL"].includes(user.role)) {
        return NextResponse.json({ error: "শুধুমাত্র অ্যাডমিন ভর্তি আবেদন অনুমোদন বা বাতিল করতে পারেন।" }, { status: 403 });
      }

      const targetStatus = payload?.newStatus || payload?.status;
      const remarks = payload?.remarks;
      const applicationId = payload?.applicationId;
      if (!applicationId || !targetStatus) {
        return NextResponse.json({ error: "আবেদন আইডি এবং নতুন স্ট্যাটাস আবশ্যক।" }, { status: 400 });
      }

      const updated = await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: targetStatus,
          remarks: remarks || null,
          ...(targetStatus === "APPROVED" ? { approvedByUserId: user.userId, approvedAt: new Date() } : {}),
          ...(targetStatus === "REJECTED" ? { rejectedByUserId: user.userId, rejectionReason: remarks || "অপ্রতুল তথ্য", rejectedAt: new Date() } : {}),
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: `ADMISSION_APPLICATION_${targetStatus}`,
        entityType: "Application",
        entityId: applicationId,
        details: { targetStatus, remarks, clientIp },
        ipAddress: clientIp,
      });

      return NextResponse.json({
        success: true,
        message: `ভর্তি আবেদন সফলভাবে ${targetStatus === "APPROVED" ? "অনুমোদিত" : "বাতিল"} করা হয়েছে।`,
        application: updated,
      });
    }

    // 2. ISSUE GATEPASS
    if (action === "ISSUE_GATEPASS") {
      if (!["ADMIN", "PRINCIPAL", "TEACHER"].includes(user.role)) {
        return NextResponse.json({ error: "শুধুমাত্র অনুমোদিত শিক্ষক বা অ্যাডমিন গেটপাস ইস্যু করতে পারেন।" }, { status: 403 });
      }

      const { studentId, reason, destination, expectedReturnHours } = payload || {};
      if (!studentId || !reason) {
        return NextResponse.json({ error: "শিক্ষার্থী এবং প্রস্থানের কারণ আবশ্যক।" }, { status: 400 });
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          guardianLinks: { take: 1, select: { guardianId: true } },
        },
      });

      if (!student) {
        return NextResponse.json({ error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
      }

      let guardianId = student.guardianLinks[0]?.guardianId;
      if (!guardianId) {
        const anyGuardian = await prisma.guardian.findFirst({ select: { id: true } });
        guardianId = anyGuardian?.id || "";
      }

      const startDate = new Date();
      const endDate = expectedReturnHours ? new Date(Date.now() + expectedReturnHours * 3600000) : new Date(Date.now() + 86400000);

      const newPass = await prisma.studentLeaveRequest.create({
        data: {
          studentId,
          guardianId,
          startDate,
          endDate,
          reason: destination ? `${reason} (গন্তব্য: ${destination})` : reason,
          status: "APPROVED",
          adminNote: `অনুমোদনকারী: ${user.name} (${user.role})`,
          reviewedBy: user.userId,
          reviewedAt: new Date(),
        },
      });

      const passNumber = `GP-${newPass.id.slice(0, 8).toUpperCase()}`;

      await recordAuditLog({
        userId: user.userId,
        action: "GATEPASS_ISSUED",
        entityType: "StudentLeaveRequest",
        entityId: newPass.id,
        details: { passNumber, studentId, destination, clientIp },
        ipAddress: clientIp,
      });

      return NextResponse.json({
        success: true,
        message: `গেটপাস সফলভাবে ইস্যু করা হয়েছে (পাস নং: ${passNumber})।`,
        gatepass: { ...newPass, passNumber },
      });
    }

    return NextResponse.json({ error: "অজানা অ্যাকশন রিকোয়েস্ট।" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in POST /api/app/module-data:", error);
    return NextResponse.json({ error: error.message || "অ্যাকশন সম্পন্ন করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
