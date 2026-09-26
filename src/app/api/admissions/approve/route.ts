import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন এই কার্যক্রম করতে পারেন।" },
        { status: 403 }
      );
    }

    const { applicationId, assignedSectionId } = await req.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: "আবেদন আইডি প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "আবেদনটি খুঁজে পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    if (application.status === "APPROVED") {
      return NextResponse.json(
        { error: "এই আবেদনটি ইতিমধ্যে অনুমোদিত হয়েছে।" },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();

    // 1. Get or create current active academic session
    let session = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });

    if (!session) {
      session = await prisma.academicSession.create({
        data: {
          name: `${currentYear}-${currentYear + 1}`,
          startDate: new Date(`${currentYear}-01-01`),
          endDate: new Date(`${currentYear}-12-31`),
          isCurrent: true,
        },
      });
    }

    // 2. Generate permanent Student ID (e.g. EHRJ-2026-0003)
    const studentCount = await prisma.student.count();
    const studentIdNumber = `EHRJ-${currentYear}-${String(studentCount + 1).padStart(4, "0")}`;

    // 3. Compute roll number for this class & session
    const classEnrollmentsCount = await prisma.enrollment.count({
      where: {
        sessionId: session.id,
        classId: application.desiredClassId,
      },
    });
    const nextRoll = classEnrollmentsCount + 1;

    // 4. Create Student
    const student = await prisma.student.create({
      data: {
        studentIdNumber,
        fullNameBn: application.studentNameBn,
        fullNameEn: application.studentNameEn || application.studentNameBn,
        dateOfBirth: application.dateOfBirth,
        gender: application.gender,
        fatherNameBn: application.guardianName,
        fatherPhone: application.guardianPhone,
        motherNameBn: "মাতা",
        presentAddress: application.address,
        permanentAddress: application.address,
        residentialStatus: application.desiredResidentialStatus,
        isOrphan: application.isOrphan,
        isFinanciallyWeak: application.financialAssistanceRequested,
        status: "ACTIVE",
      },
    });

    // 5. Create Guardian & Link
    let guardian = await prisma.guardian.findUnique({
      where: { phone: application.guardianPhone },
    });

    if (!guardian) {
      guardian = await prisma.guardian.create({
        data: {
          fullNameBn: application.guardianName,
          phone: application.guardianPhone,
          email: application.guardianEmail || null,
          relation: "FATHER",
          address: application.address,
        },
      });
    }

    await prisma.guardianStudent.create({
      data: {
        guardianId: guardian.id,
        studentId: student.id,
        isPrimary: true,
      },
    });

    // 6. Create Enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sessionId: session.id,
        classId: application.desiredClassId,
        sectionId: assignedSectionId || null,
        rollNumber: nextRoll,
        status: "ACTIVE",
      },
    });

    // 7. Update Application status
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "APPROVED",
        remarks: `অনুমোদিত ও তালিকাভুক্ত: আইডি ${studentIdNumber}, রোল ${nextRoll}`,
      },
    });

    // 8. Create Initial Admission Fee Invoice
    const feeCount = await prisma.feeInvoice.count();
    const invoiceNumber = `INV-${currentYear}-${String(feeCount + 1).padStart(5, "0")}`;
    const admissionFeeAmount = application.isOrphan ? 0 : 1500;

    await prisma.feeInvoice.create({
      data: {
        invoiceNumber,
        studentId: student.id,
        sessionId: session.id,
        title: "প্রাথমিক ভর্তি ও সেশন ফি",
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        totalAmount: admissionFeeAmount,
        discountAmount: application.isOrphan ? 1500 : 0,
        waiverAmount: 0,
        netAmount: admissionFeeAmount,
        paidAmount: 0,
        dueAmount: admissionFeeAmount,
        status: admissionFeeAmount === 0 ? "WAIVED" : "UNPAID",
      },
    });

    // 9. Record Audit Log
    await recordAuditLog({
      userId: user.userId,
      action: "APPROVE_ADMISSION",
      entityType: "Application",
      entityId: application.id,
      details: {
        studentIdNumber,
        rollNumber: nextRoll,
        studentName: application.studentNameBn,
      },
    });

    // 10. Send congratulations email if guardian email available
    if (application.guardianEmail) {
      const jamatClass = await prisma.jamatClass.findUnique({
        where: { id: application.desiredClassId },
      });
      const className = jamatClass ? jamatClass.nameBn : "মাদরাসা শ্রেণি";

      import("@/lib/mail").then(({ sendAdmissionApprovalEmail }) => {
        sendAdmissionApprovalEmail({
          to: application.guardianEmail!,
          studentName: application.studentNameBn,
          studentIdNumber,
          className,
          rollNumber: nextRoll,
        }).catch((err) => console.error("Email approval notification error:", err));
      });
    }

    return NextResponse.json({
      success: true,
      message: `ভর্তি আবেদন সফলভাবে অনুমোদিত হয়েছে। আইডি: ${studentIdNumber}, রোল: ${nextRoll}`,
      studentIdNumber,
      rollNumber: nextRoll,
      student,
      enrollment,
    });
  } catch (error: any) {
    console.error("Approve Admission Error:", error);
    return NextResponse.json(
      { error: "আবেদন অনুমোদন প্রক্রিয়াকরণে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
