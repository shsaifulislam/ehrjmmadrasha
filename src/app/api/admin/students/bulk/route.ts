import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/students/bulk
 * Comprehensive Bulk Operations for Students
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন এই কাজ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { action, studentIds, payload = {} } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "অন্তত একজন শিক্ষার্থী নির্বাচন করা আবশ্যক।" }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: "অ্যাকশন টাইপ উল্লেখ করা আবশ্যক।" }, { status: 400 });
    }

    switch (action) {
      case "CHANGE_RESIDENTIAL_STATUS": {
        const { residentialStatus } = payload;
        if (!["RESIDENTIAL", "NON_RESIDENTIAL", "DAY_CARE"].includes(residentialStatus)) {
          return NextResponse.json({ error: "সঠিক আবাসিক স্থিতি নির্বাচন করুন।" }, { status: 400 });
        }

        const updated = await prisma.$transaction(async (tx) => {
          const res = await tx.student.updateMany({
            where: { id: { in: studentIds } },
            data: { residentialStatus },
          });

          await tx.auditLog.create({
            data: {
              userId: user.userId,
              action: "BULK_UPDATE_RESIDENTIAL",
              entityType: "Student",
              entityId: "BULK",
              detailsJson: JSON.stringify({
                studentCount: studentIds.length,
                residentialStatus,
                performedBy: user.name,
                timestamp: new Date().toISOString(),
              }),
            },
          });

          return res;
        });

        return NextResponse.json({
          success: true,
          message: `${updated.count} জন শিক্ষার্থীর আবাসিক স্থিতি সফলভাবে পরিবর্তন করা হয়েছে।`,
          count: updated.count,
        });
      }

      case "CHANGE_STATUS": {
        const { status } = payload;
        if (!["ACTIVE", "INACTIVE", "SUSPENDED", "ARCHIVED", "TRANSFERRED"].includes(status)) {
          return NextResponse.json({ error: "সঠিক স্ট্যাটাস নির্বাচন করুন।" }, { status: 400 });
        }

        const updated = await prisma.$transaction(async (tx) => {
          const res = await tx.student.updateMany({
            where: { id: { in: studentIds } },
            data: { status },
          });

          await tx.auditLog.create({
            data: {
              userId: user.userId,
              action: "BULK_UPDATE_STATUS",
              entityType: "Student",
              entityId: "BULK",
              detailsJson: JSON.stringify({
                studentCount: studentIds.length,
                status,
                performedBy: user.name,
                timestamp: new Date().toISOString(),
              }),
            },
          });

          return res;
        });

        return NextResponse.json({
          success: true,
          message: `${updated.count} জন শিক্ষার্থীর অবস্থা (${status}) সফলভাবে আপডেট করা হয়েছে।`,
          count: updated.count,
        });
      }

      case "ASSIGN_CLASS_SECTION": {
        const { sessionId, classId, sectionId } = payload;
        if (!sessionId || !classId) {
          return NextResponse.json({ error: "সেশন এবং জামাত/শ্রেণি নির্বাচন আবশ্যক।" }, { status: 400 });
        }

        const updated = await prisma.$transaction(async (tx) => {
          let count = 0;
          for (const sId of studentIds) {
            // Find current enrollment in this session
            const existingEnrollment = await tx.enrollment.findFirst({
              where: { studentId: sId, sessionId },
            });

            if (existingEnrollment) {
              await tx.enrollment.update({
                where: { id: existingEnrollment.id },
                data: {
                  classId,
                  sectionId: sectionId || null,
                },
              });
            } else {
              // Get max roll in this class/section
              const lastEnrollment = await tx.enrollment.findFirst({
                where: { sessionId, classId, ...(sectionId ? { sectionId } : {}) },
                orderBy: { rollNumber: "desc" },
              });
              const nextRoll = (lastEnrollment?.rollNumber || 0) + 1;

              await tx.enrollment.create({
                data: {
                  studentId: sId,
                  sessionId,
                  classId,
                  sectionId: sectionId || null,
                  rollNumber: nextRoll,
                  status: "ACTIVE",
                },
              });
            }
            count++;
          }

          await tx.auditLog.create({
            data: {
              userId: user.userId,
              action: "BULK_ASSIGN_CLASS_SECTION",
              entityType: "Enrollment",
              entityId: "BULK",
              detailsJson: JSON.stringify({
                studentCount: count,
                sessionId,
                classId,
                sectionId,
                performedBy: user.name,
                timestamp: new Date().toISOString(),
              }),
            },
          });

          return count;
        });

        return NextResponse.json({
          success: true,
          message: `${updated} জন শিক্ষার্থীর জামাত ও শাখা সফলভাবে বরাদ্দ করা হয়েছে।`,
          count: updated,
        });
      }

      case "EXPORT_DATA": {
        const students = await prisma.student.findMany({
          where: { id: { in: studentIds } },
          include: {
            enrollments: {
              include: {
                session: true,
                jamatClass: true,
                section: true,
              },
              orderBy: { enrolledAt: "desc" },
              take: 1,
            },
            guardianLinks: {
              include: { guardian: true },
              where: { isPrimary: true },
            },
          },
        });

        const exportRows = students.map((s) => {
          const currentEnr = s.enrollments[0];
          const primaryGuardian = s.guardianLinks[0]?.guardian;
          return {
            id: s.id,
            studentIdNumber: s.studentIdNumber,
            fullNameBn: s.fullNameBn,
            fullNameEn: s.fullNameEn,
            gender: s.gender,
            residentialStatus: s.residentialStatus,
            sessionName: currentEnr?.session?.name || "—",
            className: currentEnr?.jamatClass?.nameBn || "—",
            sectionName: currentEnr?.section?.nameBn || "—",
            rollNumber: currentEnr?.rollNumber || "—",
            guardianName: primaryGuardian?.fullNameBn || s.fatherNameBn || "—",
            guardianPhone: primaryGuardian?.phone || s.fatherPhone || "—",
            address: s.presentAddress || "—",
            status: s.status,
          };
        });

        return NextResponse.json({
          success: true,
          students: exportRows,
          count: exportRows.length,
        });
      }

      default:
        return NextResponse.json({ error: `অজানা বাল্ক অ্যাকশন: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Bulk Student Operation Error:", error);
    return NextResponse.json({ error: error.message || "বাল্ক অপারেশন সম্পন্ন করতে ত্রুটি।" }, { status: 500 });
  }
}
