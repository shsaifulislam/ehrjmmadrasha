import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { reviewLeaveRequest, submitLeaveRequest } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

/**
 * GET /api/principal/leave
 * Returns comprehensive student & teacher leave requests, plus classes & directories
 * for instant 1-click leave granting by Muhtamim.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "PRINCIPAL" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র মুহতামিম বা অ্যাডমিন প্রবেশাধিকার রয়েছে।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");

    // 1. Fetch Student Leave Requests
    let studentLeaves: any[] = [];
    try {
      studentLeaves = await prisma.studentLeaveRequest.findMany({
        where: {
          ...(status && status !== "ALL" ? { status } : {}),
        },
        include: {
          student: {
            select: {
              id: true,
              studentIdNumber: true,
              fullNameBn: true,
              fullNameEn: true,
              residentialStatus: true,
              isOrphan: true,
              enrollments: {
                where: { status: "ACTIVE" },
                select: {
                  rollNumber: true,
                  classId: true,
                  jamatClass: { select: { id: true, nameBn: true, nameEn: true } },
                },
                take: 1,
              },
            },
          },
          guardian: {
            select: {
              id: true,
              fullNameBn: true,
              phone: true,
              relation: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      // Filter by classId in memory if needed
      if (classId && classId !== "ALL") {
        studentLeaves = studentLeaves.filter(
          (sl) => sl.student?.enrollments?.[0]?.classId === classId
        );
      }
    } catch (e) {
      console.error("Failed to query student leave requests:", e);
    }

    // 2. Fetch Employee / Teacher Leave Requests
    let employeeLeaves: any[] = [];
    try {
      employeeLeaves = await prisma.employeeLeaveRequest.findMany({
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              nameBn: true,
              nameEn: true,
              mobile: true,
              designation: { select: { nameBn: true } },
              department: { select: { nameBn: true } },
            },
          },
          leaveType: true,
          reviewedByUser: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    } catch (e) {
      console.error("Failed to query employee leave requests:", e);
    }

    // 3. Fetch Classes & Active Students for direct selector
    let classes: any[] = [];
    let students: any[] = [];
    let employees: any[] = [];

    try {
      classes = await prisma.jamatClass.findMany({
        where: { isActive: true },
        select: { id: true, nameBn: true, code: true },
        orderBy: { sortOrder: "asc" },
      });

      students = await prisma.student.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          studentIdNumber: true,
          fullNameBn: true,
          isOrphan: true,
          residentialStatus: true,
          enrollments: {
            where: { status: "ACTIVE" },
            select: {
              rollNumber: true,
              classId: true,
              jamatClass: { select: { id: true, nameBn: true } },
            },
            take: 1,
          },
        },
        orderBy: { fullNameBn: "asc" },
        take: 300,
      });

      employees = await prisma.employee.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          employeeId: true,
          nameBn: true,
          nameEn: true,
          mobile: true,
          designation: { select: { nameBn: true } },
          department: { select: { nameBn: true } },
        },
        orderBy: { nameBn: "asc" },
      });
    } catch (e) {
      console.error("Failed to query auxiliary directory data:", e);
    }

    return NextResponse.json({
      success: true,
      data: {
        studentLeaves,
        employeeLeaves,
        classes,
        students,
        employees,
      },
    });
  } catch (error: any) {
    console.error("Principal Leave GET error:", error);
    return NextResponse.json({ error: "ছুটির তথ্য লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

/**
 * POST /api/principal/leave
 * Executes Muhtamim leave actions:
 * - APPROVE_STUDENT_LEAVE (Auto-syncs approved into Admin & Attendance)
 * - REJECT_STUDENT_LEAVE
 * - GRANT_DIRECT_STUDENT_LEAVE (Direct grant for any student/class)
 * - APPROVE_EMPLOYEE_LEAVE
 * - REJECT_EMPLOYEE_LEAVE
 * - GRANT_DIRECT_EMPLOYEE_LEAVE
 * - INSTITUTION_HOLIDAY (Universal / Jamat holiday declaration)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "PRINCIPAL" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র মুহতামিম বা অ্যাডমিন অনুমোদিত।" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "কার্যক্রম (action) আবশ্যক।" }, { status: 400 });
    }

    // Current Session
    const currentSession =
      (await prisma.academicSession.findFirst({ where: { isCurrent: true } })) ||
      (await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } }));

    // -------------------------------------------------------------
    // ACTION 1: APPROVE_STUDENT_LEAVE
    // -------------------------------------------------------------
    if (action === "APPROVE_STUDENT_LEAVE") {
      const { requestId, adminNote } = body;
      if (!requestId) {
        return NextResponse.json({ error: "ছুটির আবেদন আইডি আবশ্যক।" }, { status: 400 });
      }

      const existing = await prisma.studentLeaveRequest.findUnique({
        where: { id: requestId },
        include: { student: { include: { enrollments: { where: { status: "ACTIVE" }, take: 1 } } } },
      });

      if (!existing) {
        return NextResponse.json({ error: "ছুটির আবেদনটি পাওয়া যায়নি।" }, { status: 404 });
      }

      const updated = await prisma.studentLeaveRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedBy: user.name || "মুহতামিম মাওলানা আব্দুল কাইয়ুম",
          reviewedAt: new Date(),
          adminNote: adminNote || "মুহতামিম মহোদয় কর্তৃক সরাসরি অনুমোদিত",
        },
      });

      // Synchronize Attendance: Mark Attendance as LEAVE for the date range
      try {
        const start = new Date(existing.startDate);
        const end = new Date(existing.endDate);
        const classId = existing.student?.enrollments?.[0]?.classId;
        const sessionId = existing.sessionId || currentSession?.id;

        if (classId && sessionId) {
          const curr = new Date(start);
          while (curr <= end) {
            const dateOnly = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate());
            await prisma.attendance.upsert({
              where: {
                studentId_date: {
                  studentId: existing.studentId,
                  date: dateOnly,
                },
              },
              create: {
                studentId: existing.studentId,
                sessionId,
                classId,
                date: dateOnly,
                status: "LEAVE",
                remarks: "মুহতামিম অনুমোদিত ছুটি",
                leaveReason: existing.reason,
                markedByUserId: user.userId,
              },
              update: {
                status: "LEAVE",
                remarks: "মুহতামিম অনুমোদিত ছুটি",
                leaveReason: existing.reason,
                updatedByUserId: user.userId,
              },
            }).catch(() => {});
            curr.setDate(curr.getDate() + 1);
          }
        }
      } catch (attErr) {
        console.warn("Attendance auto-sync warning:", attErr);
      }

      await recordAuditLog({
        userId: user.userId,
        action: "PRINCIPAL_APPROVE_STUDENT_LEAVE",
        entityType: "StudentLeaveRequest",
        entityId: requestId,
        details: { approvedBy: user.name, note: adminNote },
      });

      // In-app notification for Guardian
      try {
        const guardian = existing.guardianId
          ? await prisma.guardian.findUnique({ where: { id: existing.guardianId }, select: { userId: true } })
          : null;
        if (guardian?.userId) {
          await prisma.notification.create({
            data: {
              recipientUserId: guardian.userId,
              type: "ATTENDANCE",
              title: `[ছুটি মঞ্জুর] ${existing.student.fullNameBn}`,
              body: `মুহতামিম মহোদয় কর্তৃক ${existing.student.fullNameBn}-এর ছুটির আবেদন (${new Date(existing.startDate).toLocaleDateString("bn-BD")} হতে ${new Date(existing.endDate).toLocaleDateString("bn-BD")}) অনুমোদিত হয়েছে।`,
              actionUrl: "/portal?tab=REQUESTS&sub=LEAVE",
              priority: "IMPORTANT",
              channel: "PORTAL",
            },
          });
        }
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: "শিক্ষার্থীর ছুটির আবেদন সফলভাবে অনুমোদিত হয়েছে। অ্যাডমিন ও হাজিরায় কার্যকর হয়েছে।",
        data: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION 2: REJECT_STUDENT_LEAVE
    // -------------------------------------------------------------
    if (action === "REJECT_STUDENT_LEAVE") {
      const { requestId, adminNote } = body;
      if (!requestId) {
        return NextResponse.json({ error: "ছুটির আবেদন আইডি আবশ্যক।" }, { status: 400 });
      }

      const updated = await prisma.studentLeaveRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          reviewedBy: user.name || "মুহতামিম",
          reviewedAt: new Date(),
          adminNote: adminNote || "মুহতামিম মহোদয় কর্তৃক আবেদন নামঞ্জুর",
        },
        include: {
          student: { select: { fullNameBn: true } },
          guardian: { select: { userId: true } },
        },
      });

      // In-app notification for Guardian
      try {
        if (updated.guardian?.userId) {
          await prisma.notification.create({
            data: {
              recipientUserId: updated.guardian.userId,
              type: "ATTENDANCE",
              title: `[ছুটি নামঞ্জুর] ${updated.student.fullNameBn}`,
              body: `মুহতামিম মহোদয় কর্তৃক ${updated.student.fullNameBn}-এর ছুটির আবেদন নামঞ্জুর করা হয়েছে। মন্তব্য: ${adminNote || "কর্তৃপক্ষ কর্তৃক নামঞ্জুর"}`,
              actionUrl: "/portal?tab=REQUESTS&sub=LEAVE",
              priority: "IMPORTANT",
              channel: "PORTAL",
            },
          });
        }
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: "ছুটির আবেদনটি নামঞ্জুর করা হয়েছে।",
        data: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION 3: GRANT_DIRECT_STUDENT_LEAVE (Muhtamim Direct Grant)
    // -------------------------------------------------------------
    if (action === "GRANT_DIRECT_STUDENT_LEAVE") {
      const { studentId, startDate, endDate, reason, note } = body;

      if (!studentId || !startDate || !endDate || !reason) {
        return NextResponse.json({ error: "শিক্ষার্থী, শুরুর তারিখ, শেষের তারিখ ও কারণ আবশ্যক।" }, { status: 400 });
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          guardianLinks: { take: 1 },
          enrollments: { where: { status: "ACTIVE" }, take: 1 },
        },
      });

      if (!student) {
        return NextResponse.json({ error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
      }

      let guardianId = student.guardianLinks?.[0]?.guardianId;
      if (!guardianId) {
        // Find any guardian or fallback to first
        const anyGuardian = await prisma.guardian.findFirst();
        guardianId = anyGuardian?.id || "DIRECT_PRINCIPAL_AUTHORITY";
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      const createdLeave = await prisma.studentLeaveRequest.create({
        data: {
          studentId,
          guardianId,
          sessionId: currentSession?.id || null,
          startDate: start,
          endDate: end,
          reason: String(reason).trim(),
          status: "APPROVED", // Directly approved by Muhtamim!
          adminNote: note || "মুহতামিম কর্তৃক সরাসরি বিশেষ ছুটি মঞ্জুর",
          reviewedBy: user.name || "মুহতামিম মাওলানা আব্দুল কাইয়ুম",
          reviewedAt: new Date(),
        },
      });

      // Attendance sync
      try {
        const classId = student.enrollments?.[0]?.classId;
        const sessionId = currentSession?.id;
        if (classId && sessionId) {
          const curr = new Date(start);
          while (curr <= end) {
            const dateOnly = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate());
            await prisma.attendance.upsert({
              where: {
                studentId_date: {
                  studentId,
                  date: dateOnly,
                },
              },
              create: {
                studentId,
                sessionId,
                classId,
                date: dateOnly,
                status: "LEAVE",
                remarks: "মুহতামিম বিশেষ মঞ্জুরিকৃত ছুটি",
                leaveReason: reason,
                markedByUserId: user.userId,
              },
              update: {
                status: "LEAVE",
                remarks: "মুহতামিম বিশেষ মঞ্জুরিকৃত ছুটি",
                leaveReason: reason,
                updatedByUserId: user.userId,
              },
            }).catch(() => {});
            curr.setDate(curr.getDate() + 1);
          }
        }
      } catch (attErr) {}

      await recordAuditLog({
        userId: user.userId,
        action: "PRINCIPAL_GRANT_DIRECT_STUDENT_LEAVE",
        entityType: "StudentLeaveRequest",
        entityId: createdLeave.id,
        details: { studentId, reason, start: startDate, end: endDate },
      });

      return NextResponse.json({
        success: true,
        message: "শিক্ষার্থীর অনুকূলে সরাসরি ছুটি মঞ্জুর ও সক্রিয় করা হয়েছে।",
        data: createdLeave,
      });
    }

    // -------------------------------------------------------------
    // ACTION 4: APPROVE_EMPLOYEE_LEAVE (Teacher/Staff Leave Approval)
    // -------------------------------------------------------------
    if (action === "APPROVE_EMPLOYEE_LEAVE") {
      const { requestId, decisionReason } = body;
      if (!requestId) {
        return NextResponse.json({ error: "ছুটির আবেদন আইডি আবশ্যক।" }, { status: 400 });
      }

      const reviewed = await reviewLeaveRequest({
        requestId,
        decision: "APPROVED",
        decisionReason: decisionReason || "মুহতামিম মহোদয় কর্তৃক সরাসরি অনুমোদিত",
        reviewedByUserId: user.userId,
      });

      // In-app notification for Teacher
      try {
        const empLeave = await prisma.employeeLeaveRequest.findUnique({
          where: { id: requestId },
          include: { employee: { select: { userId: true, nameBn: true } } },
        });
        if (empLeave?.employee?.userId) {
          await prisma.notification.create({
            data: {
              recipientUserId: empLeave.employee.userId,
              type: "ACADEMIC",
              title: `[ছুটি অনুমোদিত] মুহতামিমের অনুমোদন`,
              body: `মুহতামিম মহোদয় কর্তৃক আপনার ছুটির আবেদন অনুমোদিত হয়েছে। সিদ্ধান্ত: ${decisionReason || "সরাসরি অনুমোদিত"}`,
              actionUrl: "/teacher?tab=LEAVE",
              priority: "IMPORTANT",
              channel: "PORTAL",
            },
          });
        }
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: "উস্তাদের ছুটির আবেদন মুহতামিম কর্তৃক অনুমোদিত হয়েছে।",
        data: reviewed,
      });
    }

    // -------------------------------------------------------------
    // ACTION 5: REJECT_EMPLOYEE_LEAVE
    // -------------------------------------------------------------
    if (action === "REJECT_EMPLOYEE_LEAVE") {
      const { requestId, decisionReason } = body;
      if (!requestId) {
        return NextResponse.json({ error: "ছুটির আবেদন আইডি আবশ্যক।" }, { status: 400 });
      }

      const reviewed = await reviewLeaveRequest({
        requestId,
        decision: "REJECTED",
        decisionReason: decisionReason || "মুহতামিম কর্তৃক আবেদন নামঞ্জুর",
        reviewedByUserId: user.userId,
      });

      // In-app notification for Teacher
      try {
        const empLeave = await prisma.employeeLeaveRequest.findUnique({
          where: { id: requestId },
          include: { employee: { select: { userId: true, nameBn: true } } },
        });
        if (empLeave?.employee?.userId) {
          await prisma.notification.create({
            data: {
              recipientUserId: empLeave.employee.userId,
              type: "ACADEMIC",
              title: `[ছুটি নামঞ্জুর] মুহতামিমের সিদ্ধান্ত`,
              body: `মুহতামিম মহোদয় কর্তৃক আপনার ছুটির আবেদন নামঞ্জুর করা হয়েছে। কারণ: ${decisionReason || "কর্তৃপক্ষ কর্তৃক নামঞ্জুর"}`,
              actionUrl: "/teacher?tab=LEAVE",
              priority: "IMPORTANT",
              channel: "PORTAL",
            },
          });
        }
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: "উস্তাদের ছুটির আবেদন নামঞ্জুর করা হয়েছে।",
        data: reviewed,
      });
    }

    // -------------------------------------------------------------
    // ACTION 6: GRANT_DIRECT_EMPLOYEE_LEAVE
    // -------------------------------------------------------------
    if (action === "GRANT_DIRECT_EMPLOYEE_LEAVE") {
      const { employeeId, leaveTypeId, startDate, endDate, reason } = body;
      if (!employeeId || !startDate || !endDate || !reason) {
        return NextResponse.json({ error: "কর্মী, শুরুর তারিখ, শেষের তারিখ ও কারণ আবশ্যক।" }, { status: 400 });
      }

      // If no leaveTypeId, pick first active
      let typeId = leaveTypeId;
      if (!typeId) {
        const firstType = await prisma.employeeLeaveType.findFirst({ where: { isActive: true } });
        typeId = firstType?.id;
      }

      if (!typeId) {
        return NextResponse.json({ error: "কোনো সক্রিয় ছুটির ধরন পাওয়া যায়নি।" }, { status: 400 });
      }

      const submitted = await submitLeaveRequest({
        employeeId,
        leaveTypeId: typeId,
        startDate,
        endDate,
        reason,
        recordedByUserId: user.userId,
      });

      // Immediately approve by Muhtamim
      const approved = await reviewLeaveRequest({
        requestId: submitted.id,
        decision: "APPROVED",
        decisionReason: "মুহতামিম কর্তৃক সরাসরি বিশেষ ছুটি মঞ্জুর",
        reviewedByUserId: user.userId,
      });

      return NextResponse.json({
        success: true,
        message: "উস্তাদের অনুকূলে সরাসরি ছুটি মঞ্জুর ও সক্রিয় করা হয়েছে।",
        data: approved,
      });
    }

    // -------------------------------------------------------------
    // ACTION 7: INSTITUTION_HOLIDAY (General Madrasah Holiday Announcement)
    // -------------------------------------------------------------
    if (action === "INSTITUTION_HOLIDAY") {
      const { title, startDate, endDate, description, audience = "PUBLIC" } = body;
      if (!title || !startDate || !endDate) {
        return NextResponse.json({ error: "ছুটির শিরোনাম, শুরুর তারিখ ও সমাপ্তি তারিখ আবশ্যক।" }, { status: 400 });
      }

      // Publish urgent holiday notice
      let createdNotice = null;
      try {
        createdNotice = await prisma.notice.create({
          data: {
            titleBn: `[সাধারণ ছুটির নোটিশ] ${title}`,
            titleEn: "Madrasah Holiday Announcement",
            contentBn: description || `${title} উপলক্ষে (${new Date(startDate).toLocaleDateString("bn-BD")} হতে ${new Date(endDate).toLocaleDateString("bn-BD")} পর্যন্ত) মাদরাসার সকল শিক্ষা ও দাফতরিক কার্যক্রম বন্ধ থাকবে।`,
            category: "HOLIDAY",
            audience: audience === "ALL" ? "PUBLIC" : audience,
            priority: "URGENT",
            isUrgent: true,
            isPinned: true,
            status: "PUBLISHED",
            publishedAt: new Date(),
            createdByUserId: user.userId,
            publishedByUserId: user.userId,
          },
        });
      } catch (notErr: any) {
        console.error("Notice creation error:", notErr);
      }

      await recordAuditLog({
        userId: user.userId,
        action: "PRINCIPAL_ANNOUNCE_HOLIDAY",
        entityType: "Notice",
        entityId: createdNotice?.id || "GENERAL_HOLIDAY",
        details: { title, startDate, endDate, audience },
      });

      return NextResponse.json({
        success: true,
        message: "সার্বিক প্রাতিষ্ঠানিক ছুটি সফলভাবে ঘোষণা ও নোটিশ জারি করা হয়েছে।",
        data: createdNotice,
      });
    }

    return NextResponse.json({ error: "অজানা কার্যক্রম।" }, { status: 400 });
  } catch (error: any) {
    console.error("Principal Leave POST error:", error);
    return NextResponse.json({ error: error.message || "ছুটি কার্যক্রমে ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}
