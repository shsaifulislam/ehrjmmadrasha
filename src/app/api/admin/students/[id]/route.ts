import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

import { validateDocumentEligibility } from "@/lib/documentFactory";

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        guardianLinks: {
          include: {
            guardian: true,
          },
          orderBy: { isPrimary: "desc" },
        },
        enrollments: {
          include: {
            session: true,
            jamatClass: true,
            section: true,
          },
          orderBy: { enrolledAt: "desc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        certificates: {
          orderBy: { issueDate: "desc" },
        },
        results: {
          include: {
            exam: {
              include: {
                session: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        examMarks: {
          include: {
            subject: true,
            exam: true,
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        },
        feeInvoices: {
          orderBy: { createdAt: "desc" },
        },
        paymentReceipts: {
          orderBy: { receiptDate: "desc" },
        },
        attendances: {
          orderBy: { date: "desc" },
          take: 35,
        },
        documentRequests: {
          orderBy: { createdAt: "desc" },
        },
        supportRequests: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "ছাত্রের তথ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    // Authorization & IDOR enforcement:
    // 1. If Guardian: Must be linked to this student
    if (user.role === "GUARDIAN") {
      const isLinked = student.guardianLinks.some(
        (gl) => gl.guardian.userId === user.userId || gl.guardian.phone === user.username
      );
      if (!isLinked) {
        return NextResponse.json(
          { error: "নিরাপত্তা সতর্কতা: আপনি শুধুমাত্র আপনার নিবন্ধিত সন্তানের তথ্য দেখতে পারেন।" },
          { status: 403 }
        );
      }
    }

    // 2. If Teacher: Must be assigned to student's current class/section
    if (user.role === "TEACHER") {
      const currentEnrollment = student.enrollments[0];
      if (!currentEnrollment) {
        return NextResponse.json({ error: "শিক্ষার্থী কোনো জামাতে অন্তর্ভুক্ত নয়।" }, { status: 403 });
      }

      const assignment = await prisma.teacherAssignment.findFirst({
        where: {
          teacherId: user.userId,
          classId: currentEnrollment.classId,
          ...(currentEnrollment.sectionId ? { sectionId: currentEnrollment.sectionId } : {}),
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "নিরাপত্তা সতর্কতা: আপনি শুধুমাত্র আপনার দায়িত্বপ্রাপ্ত জামাত ও শাখার ছাত্র দেখতে পারবেন।" },
          { status: 403 }
        );
      }
    }

    // Compute Attendance Summary Metrics
    const totalAttendanceDays = student.attendances.length;
    const presentDays = student.attendances.filter((a) => a.status === "PRESENT").length;
    const absentDays = student.attendances.filter((a) => a.status === "ABSENT").length;
    const lateDays = student.attendances.filter((a) => a.status === "LATE").length;
    const leaveDays = student.attendances.filter((a) => a.status === "LEAVE").length;
    const attendanceRate = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 100;

    // Compute Financial Summary Metrics
    const totalInvoiced = student.feeInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalPaid = student.feeInvoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
    const totalDue = student.feeInvoices.reduce((acc, inv) => acc + inv.dueAmount, 0);

    // Compute Document Eligibility Matrix for Canonical Document Types
    const canonicalDocTypes = [
      "STUDENT_ID",
      "ADMISSION_CONFIRMATION",
      "STUDY_CERTIFICATE",
      "PRATYAYAN_PATRA",
      "CHARACTER_CERTIFICATE",
      "TESTIMONIAL",
      "TRANSFER_CERTIFICATE",
      "STUDENT_STATUS",
      "HIFZ_CERTIFICATE",
      "MISHKAT_CERTIFICATE",
      "DAWRA_CERTIFICATE",
      "ADMIT_CARD",
      "RESULT_MARKSHEET",
    ];

    const documentEligibility: Record<string, any> = {};
    for (const dType of canonicalDocTypes) {
      try {
        const evalResult = await validateDocumentEligibility(student.id, dType);
        // Find if already issued
        const alreadyIssued = student.certificates.find(
          (c) => c.certificateType === dType && !c.isRevoked && c.status === "ISSUED"
        );
        documentEligibility[dType] = {
          eligible: evalResult.eligible,
          reason: evalResult.reason || null,
          issuedDoc: alreadyIssued || evalResult.activeDocument || null,
        };
      } catch {
        documentEligibility[dType] = { eligible: false, reason: "যাচাইকরণে ত্রুটি", issuedDoc: null };
      }
    }

    // Fetch related audit logs for this student
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: "Student",
        entityId: student.id,
      },
      include: {
        user: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return NextResponse.json({
      success: true,
      student,
      attendanceStats: {
        totalDays: totalAttendanceDays,
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        attendanceRate,
      },
      financeStats: {
        totalInvoiced,
        totalPaid,
        totalDue,
      },
      documentEligibility,
      auditLogs,
    });
  } catch (error: any) {
    console.error("GET Student Details Error:", error);
    return NextResponse.json({ error: "ছাত্রের বিস্তারিত তথ্য আনতে ত্রুটি।" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন এই পরিবর্তন করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const existing = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          orderBy: { enrolledAt: "desc" },
          take: 1,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "ছাত্র পাওয়া যায়নি।" }, { status: 404 });
    }

    const {
      fullNameBn,
      fullNameEn,
      fullNameAr,
      dateOfBirth,
      gender,
      bloodGroup,
      nationality,
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
      residentialStatus,
      isOrphan,
      isFinanciallyWeak,
      status,
      // Roll adjustment support
      adjustRollNumber,
      enrollmentId,
    } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Student master details
      const updatedStudent = await tx.student.update({
        where: { id: params.id },
        data: {
          ...(fullNameBn ? { fullNameBn: fullNameBn.trim() } : {}),
          ...(fullNameEn ? { fullNameEn: fullNameEn.trim() } : {}),
          ...(fullNameAr !== undefined ? { fullNameAr: fullNameAr ? fullNameAr.trim() : null } : {}),
          ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
          ...(gender ? { gender } : {}),
          ...(bloodGroup !== undefined ? { bloodGroup } : {}),
          ...(nationality ? { nationality } : {}),
          ...(birthCertificateNo !== undefined ? { birthCertificateNo: birthCertificateNo ? birthCertificateNo.trim() : null } : {}),
          ...(nidNo !== undefined ? { nidNo: nidNo ? nidNo.trim() : null } : {}),
          ...(fatherNameBn ? { fatherNameBn: fatherNameBn.trim() } : {}),
          ...(fatherNameEn !== undefined ? { fatherNameEn } : {}),
          ...(fatherPhone !== undefined ? { fatherPhone } : {}),
          ...(fatherOccupation !== undefined ? { fatherOccupation } : {}),
          ...(motherNameBn ? { motherNameBn: motherNameBn.trim() } : {}),
          ...(motherNameEn !== undefined ? { motherNameEn } : {}),
          ...(motherPhone !== undefined ? { motherPhone } : {}),
          ...(presentAddress ? { presentAddress: presentAddress.trim() } : {}),
          ...(permanentAddress ? { permanentAddress: permanentAddress.trim() } : {}),
          ...(residentialStatus ? { residentialStatus } : {}),
          ...(isOrphan !== undefined ? { isOrphan: Boolean(isOrphan) } : {}),
          ...(isFinanciallyWeak !== undefined ? { isFinanciallyWeak: Boolean(isFinanciallyWeak) } : {}),
          ...(status ? { status } : {}),
        },
      });

      // 2. Roll adjustment with strict audit logging
      if (adjustRollNumber !== undefined && adjustRollNumber !== null && (enrollmentId || existing.enrollments[0]?.id)) {
        const targetEnrollmentId = enrollmentId || existing.enrollments[0].id;
        const targetRoll = parseInt(adjustRollNumber, 10);

        if (!isNaN(targetRoll) && targetRoll > 0) {
          const oldEnrollment = await tx.enrollment.findUnique({
            where: { id: targetEnrollmentId },
          });

          if (oldEnrollment && oldEnrollment.rollNumber !== targetRoll) {
            await tx.enrollment.update({
              where: { id: targetEnrollmentId },
              data: { rollNumber: targetRoll },
            });

            await tx.auditLog.create({
              data: {
                userId: user.userId,
                action: "ROLL_CHANGE",
                entityType: "Enrollment",
                entityId: targetEnrollmentId,
                detailsJson: JSON.stringify({
                  studentId: existing.id,
                  studentName: existing.fullNameBn,
                  oldRoll: oldEnrollment.rollNumber,
                  newRoll: targetRoll,
                }),
              },
            });
          }
        }
      }

      // 3. Master audit log for student record update
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "UPDATE",
          entityType: "Student",
          entityId: updatedStudent.id,
          detailsJson: JSON.stringify({
            changes: {
              status: status !== existing.status ? { old: existing.status, new: status } : undefined,
              residentialStatus:
                residentialStatus !== existing.residentialStatus
                  ? { old: existing.residentialStatus, new: residentialStatus }
                  : undefined,
            },
          }),
        },
      });

      return updatedStudent;
    });

    return NextResponse.json({
      success: true,
      student: result,
      message: "ছাত্রের তথ্য সফলভাবে হালনাগাদ করা হয়েছে।",
    });
  } catch (error: any) {
    console.error("PATCH Student Details Error:", error);
    return NextResponse.json({ error: error.message || "হালনাগাদ করতে ত্রুটি হয়েছে।" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    // Historical records protection - do not destructively delete students with academic history
    const existing = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            enrollments: true,
            feeInvoices: true,
            results: true,
            attendances: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "ছাত্র পাওয়া যায়নি।" }, { status: 404 });
    }

    if (
      existing._count.enrollments > 0 ||
      existing._count.feeInvoices > 0 ||
      existing._count.results > 0
    ) {
      // Soft deactivate instead of destructive deletion
      await prisma.$transaction(async (tx) => {
        await tx.student.update({
          where: { id: params.id },
          data: { status: "WITHDRAWN" },
        });

        await tx.auditLog.create({
          data: {
            userId: user.userId,
            action: "UPDATE",
            entityType: "Student",
            entityId: params.id,
            detailsJson: JSON.stringify({ action: "ARCHIVE_STUDENT", status: "WITHDRAWN" }),
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "ছাত্রটির পূর্ববর্তী পরীক্ষার ফলাফল/ফি/ভর্তি ইতিহাস সংরক্ষিত থাকায় ডিলিট করার পরিবর্তে প্রোফাইলটি প্রত্যাহার (WITHDRAWN) হিসেবে চিহ্নিত করা হয়েছে।",
      });
    }

    // Safe deletion if no historical ties
    await prisma.student.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "ছাত্রের প্রোফাইল মুছে ফেলা হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: "মুছে ফেলতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
