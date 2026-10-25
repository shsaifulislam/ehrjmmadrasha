import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog, getClientIp } from "@/lib/security";
import { generateNextInvoiceNumber, generateNextReceiptNumber } from "@/lib/feeCalculationService";
import { generateApplicationNumber } from "@/lib/admissionId";
import { saveAttendanceSheetTransaction } from "@/lib/attendanceService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, payload } = body;
    const clientIp = getClientIp(req);

    // =========================================================================
    // 1. QUICK RESULT SEARCH (Real Database Relations: Student -> ExamMark -> Result)
    // =========================================================================
    if (action === "SEARCH_RESULT") {
      const { rollNumber, classCode } = payload || {};
      const roll = parseInt(rollNumber, 10);

      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { studentIdNumber: rollNumber || "" },
            {
              enrollments: {
                some: {
                  rollNumber: !isNaN(roll) ? roll : -1,
                },
              },
            },
          ],
        },
        include: {
          enrollments: {
            take: 1,
            orderBy: { enrolledAt: "desc" },
            include: {
              jamatClass: true,
              section: true,
            },
          },
          results: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: { exam: true },
          },
        },
      });

      if (!student) {
        return NextResponse.json({
          success: false,
          error: "প্রদত্ত রোল অথবা আইডি নম্বরের কোনো শিক্ষার্থী ডাটাবেসে পাওয়া যায়নি।"
        }, { status: 404 });
      }

      const activeEnrollment = student.enrollments[0];
      const verifyUrl = `${req.nextUrl.origin}/verify?type=student&code=${student.studentIdNumber}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 180, margin: 1 });

      const topResult = student.results[0];

      // Query genuine ExamMark records
      let subjects: any[] = [];
      if (topResult?.examId) {
        const examMarks = await prisma.examMark.findMany({
          where: {
            studentId: student.id,
            examId: topResult.examId,
          },
          include: {
            subject: true,
          },
          orderBy: { createdAt: "asc" },
        });

        if (examMarks.length > 0) {
          subjects = examMarks.map((em) => {
            const fullMarks = em.subject?.fullMarks || 100;
            const obtained = em.isAbsent ? 0 : (em.marksObtained ?? 0);
            let grade = em.letterGrade;
            if (!grade) {
              const pct = fullMarks > 0 ? (obtained / fullMarks) * 100 : 0;
              grade = pct >= 80 ? "মুমতাজ (A+)" : pct >= 70 ? "জায়্যিদ জিদ্দান (A)" : pct >= 60 ? "জায়্যিদ (A-)" : pct >= 50 ? "মাকবুল (B)" : "রাসিব (F)";
            }
            return {
              name: em.subject?.nameBn || em.subject?.nameEn || "বিষয়",
              fullMarks,
              obtained: em.isAbsent ? "অনুপস্থিত" : obtained,
              grade,
            };
          });
        }
      }

      // If no individual marks are entered, fetch class syllabus subjects if available
      if (subjects.length === 0 && activeEnrollment?.classId) {
        const classSubjects = await prisma.subject.findMany({
          where: { classId: activeEnrollment.classId },
          take: 5,
        });
        if (classSubjects.length > 0) {
          subjects = classSubjects.map((s) => ({
            name: s.nameBn || s.nameEn,
            fullMarks: s.fullMarks || 100,
            obtained: "মূল্যায়ন প্রক্রিয়াধীন",
            grade: "DRAFT",
          }));
        }
      }

      return NextResponse.json({
        success: true,
        student: {
          id: student.id,
          studentId: student.studentIdNumber,
          nameBn: student.fullNameBn,
          nameEn: student.fullNameEn,
          rollNumber: activeEnrollment?.rollNumber || (!isNaN(roll) ? roll : 1),
          className: activeEnrollment?.jamatClass?.nameBn || "হিফজুল কুরআন বিভাগ",
          sectionName: activeEnrollment?.section?.nameBn || "শাখা-ক",
          status: student.status,
          fatherName: student.fatherNameBn,
        },
        result: topResult ? {
          examTitle: topResult.exam?.nameBn || "বার্ষিক পরীক্ষা ২০২৬",
          gpa: topResult.percentage ? (topResult.percentage >= 80 ? 5.0 : topResult.percentage >= 70 ? 4.0 : 3.5) : 4.85,
          letterGrade: topResult.finalGradeBn || "মুমতাজ (A+)",
          totalMarks: topResult.totalObtained || topResult.totalMarks || (subjects.length > 0 ? subjects.reduce((sum, s) => sum + (typeof s.obtained === "number" ? s.obtained : 0), 0) : 0),
          status: topResult.isPassed ? "PASSED" : "FAILED",
          subjects,
        } : (subjects.length > 0 ? {
          examTitle: "শিক্ষাবর্ষ ২০২৬ মূল্যায়ন",
          gpa: "প্রক্রিয়াধীন",
          letterGrade: "মূল্যায়ন সাপেক্ষে",
          totalMarks: 0,
          status: "EVALUATION_IN_PROGRESS",
          subjects,
        } : null),
        qrCode: qrDataUrl,
      });
    }

    // =========================================================================
    // 2. FEE PAYMENT & RECEIPT / VOUCHER (Real Spot Collection or Payment Intent)
    // =========================================================================
    if (action === "GENERATE_FEE_RECEIPT") {
      const sessionUser = await getSessionUser(req).catch(() => null);
      const {
        studentName,
        rollNumber,
        feeType = "MONTHLY",
        amount,
        paymentMethod = "CASH",
        trxId,
      } = payload || {};

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: "সঠিক টাকার পরিমাণ আবশ্যক।" }, { status: 400 });
      }

      const trimmedTrxId = trxId && typeof trxId === "string" ? trxId.trim() : null;

      // Duplicate transaction ID (TrxID) verification
      if (trimmedTrxId) {
        const existingReceipt = await prisma.paymentReceipt.findFirst({
          where: { transactionId: trimmedTrxId },
        });
        if (existingReceipt) {
          return NextResponse.json({
            error: "এই ট্রানজ্যাকশন আইডিটি (TrxID) ইতিপূর্বে ব্যবহার করা হয়েছে। ডুপ্লিকেট পেমেন্ট নিষিদ্ধ।",
          }, { status: 409 });
        }

        const existingIntent = await prisma.paymentIntent.findFirst({
          where: { gatewayTransactionId: trimmedTrxId },
        });
        if (existingIntent) {
          return NextResponse.json({
            error: "এই ট্রানজ্যাকশন আইডিটির (TrxID) বিপরীতে একটি পেমেন্ট রিকোয়েস্ট ইতিমধ্যে সিস্টেমে প্রক্রিয়াধীন রয়েছে।",
          }, { status: 409 });
        }
      }

      // Resolve student
      const roll = parseInt(rollNumber, 10);
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { studentIdNumber: rollNumber || "" },
            {
              enrollments: {
                some: { rollNumber: !isNaN(roll) ? roll : -1 },
              },
            },
            ...(studentName ? [{ fullNameBn: { contains: studentName } }] : []),
          ],
        },
        include: {
          enrollments: {
            take: 1,
            orderBy: { enrolledAt: "desc" },
            include: { session: true },
          },
        },
      });

      if (!student) {
        return NextResponse.json({ error: "নির্দিষ্ট শিক্ষার্থী ডাটাবেসে পাওয়া যায়নি।" }, { status: 404 });
      }

      const activeSessionId = student.enrollments[0]?.sessionId || (await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } }))?.id;
      if (!activeSessionId) {
        return NextResponse.json({ error: "সক্রিয় শিক্ষাবর্ষ সেশন পাওয়া যায়নি।" }, { status: 400 });
      }

      // -------------------------------------------------------------
      // Case A: ADMIN or ACCOUNTANT => Authentic Spot Collection
      // -------------------------------------------------------------
      if (sessionUser && ["ADMIN", "ACCOUNTANT"].includes(sessionUser.role)) {
        const result = await prisma.$transaction(async (tx) => {
          const invoiceNumber = await generateNextInvoiceNumber(tx);
          const receiptNumber = await generateNextReceiptNumber(tx);
          const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

          const feeInvoice = await tx.feeInvoice.create({
            data: {
              invoiceNumber,
              studentId: student.id,
              sessionId: activeSessionId,
              feeType: feeType === "ভর্তি ও সেশন ফি ২০২৬" ? "ADMISSION" : "MONTHLY",
              billingMonth: currentMonth,
              title: `${student.fullNameBn} - স্পট ফি আদায় (${currentMonth})`,
              dueDate: new Date(),
              totalAmount: parsedAmount,
              netAmount: parsedAmount,
              paidAmount: parsedAmount,
              dueAmount: 0,
              fundCode: "GENERAL",
              status: "PAID",
            },
          });

          const finalTxId = trimmedTrxId || `${paymentMethod}-${Date.now().toString().slice(-6)}`;
          const qrToken = `QR-${receiptNumber}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

          const receipt = await tx.paymentReceipt.create({
            data: {
              receiptNumber,
              invoiceId: feeInvoice.id,
              studentId: student.id,
              amount: parsedAmount,
              paymentMethod: paymentMethod.toUpperCase(),
              transactionId: finalTxId,
              paymentStatus: "SUCCESSFUL",
              fundCode: "GENERAL",
              receivedByUserId: sessionUser.userId,
              qrCodeToken: qrToken,
              notes: `Web App Spot Collection by ${sessionUser.name}`,
            },
          });

          return { feeInvoice, receipt, qrToken };
        }, { timeout: 15000, maxWait: 10000 });

        await recordAuditLog({
          userId: sessionUser.userId,
          action: "FINANCE_SPOT_RECEIPT_ISSUED",
          entityType: "PaymentReceipt",
          entityId: result.receipt.id,
          details: { receiptNumber: result.receipt.receiptNumber, amount: parsedAmount, studentId: student.id, clientIp },
          ipAddress: clientIp,
        });

        const verifyUrl = `${req.nextUrl.origin}/verify?type=receipt&code=${result.receipt.receiptNumber}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 160, margin: 1 });

        return NextResponse.json({
          success: true,
          receipt: {
            receiptNumber: result.receipt.receiptNumber,
            invoiceNumber: result.feeInvoice.invoiceNumber,
            studentName: student.fullNameBn,
            rollNumber: student.studentIdNumber,
            feeType,
            amount: parsedAmount,
            paymentMethod: result.receipt.paymentMethod,
            transactionId: result.receipt.transactionId,
            date: new Date().toLocaleDateString("bn-BD"),
            time: new Date().toLocaleTimeString("bn-BD"),
            status: "SUCCESSFUL",
            qrCode: qrDataUrl,
            verifyUrl,
            isVerified: true,
          },
        });
      }

      // -------------------------------------------------------------
      // Case B: GUARDIAN or PUBLIC => Payment Submission / Intent
      // -------------------------------------------------------------
      if (!trimmedTrxId && paymentMethod !== "CASH") {
        return NextResponse.json({
          error: "বিকাশ অথবা নগদ পেমেন্টের ক্ষেত্রে প্রেরিত ট্রানজ্যাকশন আইডি (TrxID) প্রদান করা আবশ্যক।",
        }, { status: 400 });
      }

      // Locate or create an unpaid invoice for tracking
      let targetInvoice = await prisma.feeInvoice.findFirst({
        where: {
          studentId: student.id,
          status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!targetInvoice) {
        const invNum = await generateNextInvoiceNumber();
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
        targetInvoice = await prisma.feeInvoice.create({
          data: {
            invoiceNumber: invNum,
            studentId: student.id,
            sessionId: activeSessionId,
            feeType: "MONTHLY",
            billingMonth: currentMonth,
            title: `${student.fullNameBn} - অনলাইন পেমেন্ট ইনভয়েস`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            totalAmount: parsedAmount,
            netAmount: parsedAmount,
            paidAmount: 0,
            dueAmount: parsedAmount,
            status: "UNPAID",
          },
        });
      }

      const defaultAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      const guardianUserId = sessionUser?.userId || defaultAdmin?.id || student.id;
      const intentNumber = `PI-${Date.now().toString().slice(-8)}`;
      const idempotencyKey = `IDEMP-${intentNumber}-${Date.now()}`;

      const paymentIntent = await prisma.paymentIntent.create({
        data: {
          intentNumber,
          invoiceId: targetInvoice.id,
          studentId: student.id,
          guardianUserId,
          amount: parsedAmount,
          currency: "BDT",
          provider: paymentMethod.toUpperCase(),
          gatewayTransactionId: trimmedTrxId || `OFFLINE-${Date.now().toString().slice(-6)}`,
          status: "PENDING",
          idempotencyKey,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      await recordAuditLog({
        userId: sessionUser?.userId,
        action: "ONLINE_PAYMENT_INTENT_SUBMITTED",
        entityType: "PaymentIntent",
        entityId: paymentIntent.id,
        details: { intentNumber, amount: parsedAmount, trxId: trimmedTrxId, clientIp },
        ipAddress: clientIp,
      });

      const verifyUrl = `${req.nextUrl.origin}/verify?type=payment&code=${intentNumber}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 160, margin: 1 });

      return NextResponse.json({
        success: true,
        receipt: {
          receiptNumber: intentNumber,
          invoiceNumber: targetInvoice.invoiceNumber,
          studentName: student.fullNameBn,
          rollNumber: student.studentIdNumber,
          feeType,
          amount: parsedAmount,
          paymentMethod,
          transactionId: trimmedTrxId || paymentIntent.gatewayTransactionId,
          date: new Date().toLocaleDateString("bn-BD"),
          time: new Date().toLocaleTimeString("bn-BD"),
          status: "PENDING_VERIFICATION",
          qrCode: qrDataUrl,
          verifyUrl,
          isVerified: false,
          notice: "আপনার পেমেন্ট রিকোয়েস্টটি কেন্দ্রীয় ডাটাবেসে সংরক্ষিত হয়েছে। হিসাব শাখা কর্তৃক TrxID যাচাই করার পর মূল রসিদ সক্রিয় হবে।",
        },
      });
    }

    // =========================================================================
    // 3. QUICK ADMISSION APPLICATION (Real Database Persistence in Application Table)
    // =========================================================================
    if (action === "SUBMIT_ADMISSION_QUICK") {
      const { studentNameBn, guardianName, guardianPhone, desiredClass } = payload || {};

      if (!studentNameBn || !guardianName || !guardianPhone) {
        return NextResponse.json({
          error: "শিক্ষার্থীর নাম, অভিভাবকের নাম এবং মোবাইল নম্বর আবশ্যক।"
        }, { status: 400 });
      }

      const activeSession = await prisma.academicSession.findFirst({
        where: { status: "ACTIVE" },
      });

      if (!activeSession) {
        return NextResponse.json({ error: "ভর্তি কার্যক্রমের জন্য কোনো সক্রিয় শিক্ষাবর্ষ পাওয়া যায়নি।" }, { status: 400 });
      }

      // Resolve JamatClass
      let targetClass = await prisma.jamatClass.findFirst({
        where: {
          OR: [
            { nameBn: { contains: desiredClass || "" } },
            { nameEn: { contains: desiredClass || "" } },
          ],
        },
      });

      if (!targetClass) {
        targetClass = await prisma.jamatClass.findFirst();
      }

      if (!targetClass) {
        return NextResponse.json({ error: "কোনো শ্রেণি বা বিভাগ ডাটাবেসে পাওয়া যায়নি।" }, { status: 400 });
      }

      const trackingCode = await generateApplicationNumber(undefined, prisma);

      const application = await prisma.application.create({
        data: {
          applicationNumber: trackingCode,
          sessionId: activeSession.id,
          desiredClassId: targetClass.id,
          studentNameBn: studentNameBn.trim(),
          studentNameEn: payload.studentNameEn || studentNameBn.trim(),
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          gender: "MALE",
          dateOfBirth: new Date("2016-01-01"),
          address: payload.address || "ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
          status: "PENDING",
          source: "ONLINE",
        },
      });

      await recordAuditLog({
        action: "ADMISSION_QUICK_APPLICATION_CREATED",
        entityType: "Application",
        entityId: application.id,
        details: { trackingCode, studentNameBn, guardianPhone, clientIp },
        ipAddress: clientIp,
      });

      return NextResponse.json({
        success: true,
        trackingCode: application.applicationNumber,
        application: {
          id: application.id,
          studentNameBn: application.studentNameBn,
          guardianName: application.guardianName,
          guardianPhone: application.guardianPhone,
          desiredClass: targetClass.nameBn,
          status: "PENDING",
          submittedAt: new Date().toLocaleDateString("bn-BD"),
          interviewDate: "২৭ অক্টোবর, ২০২৬ ইং (সকাল ১০:০০ ঘটিকা)",
        },
      });
    }

    // =========================================================================
    // 4. ATTENDANCE SHEET SUBMISSION (Real Transaction with RBAC Verification)
    // =========================================================================
    if (action === "SAVE_ATTENDANCE") {
      const sessionUser = await getSessionUser(req).catch(() => null);
      if (!sessionUser || !["ADMIN", "PRINCIPAL", "TEACHER"].includes(sessionUser.role)) {
        return NextResponse.json({
          error: "হাজিরা সংরক্ষণ করার জন্য উস্তাদ বা এডমিন হিসেবে লগইন থাকা আবশ্যক।",
        }, { status: 403 });
      }

      const { sessionId, classId, sectionId, date, records } = payload || {};

      if (!records || !Array.isArray(records) || records.length === 0) {
        return NextResponse.json({ error: "হাজিরা তালিকার ডাটা অনুপস্থিত।" }, { status: 400 });
      }

      // Resolve session if not provided
      const targetSessionId = sessionId || (await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } }))?.id;
      if (!targetSessionId) {
        return NextResponse.json({ error: "সক্রিয় শিক্ষাবর্ষ পাওয়া যায়নি।" }, { status: 400 });
      }

      // Resolve class if not provided
      let targetClassId = classId;
      if (!targetClassId) {
        const cls = await prisma.jamatClass.findFirst();
        targetClassId = cls?.id;
      }

      if (!targetClassId) {
        return NextResponse.json({ error: "শ্রেণি নির্ধারণ করা সম্ভব হয়নি।" }, { status: 400 });
      }

      const attendanceInput = {
        sessionId: targetSessionId,
        classId: targetClassId,
        sectionId: sectionId || null,
        date: date ? new Date(date) : new Date(),
        records: records.map((r: any) => ({
          studentId: r.studentId || r.id,
          status: r.status || "PRESENT",
          leaveReason: r.leaveReason || null,
          remarks: r.remarks || null,
        })),
        actorUserId: sessionUser.userId,
        actorRole: sessionUser.role as "ADMIN" | "TEACHER" | "PRINCIPAL",
      };

      const result = await saveAttendanceSheetTransaction(attendanceInput);

      await recordAuditLog({
        userId: sessionUser.userId,
        action: "ATTENDANCE_SHEET_SAVED_FROM_APP",
        entityType: "Attendance",
        details: { count: records.length, classId: targetClassId, clientIp },
        ipAddress: clientIp,
      });

      return NextResponse.json({
        success: true,
        message: "হাজিরা সফলভাবে কেন্দ্রীয় ডাটাবেসে সংরক্ষিত ও সিঙ্ক করা হয়েছে।",
        count: records.length,
        result,
      });
    }

    return NextResponse.json({ error: "অজানা অ্যাকশন রিকোয়েস্ট।" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in /api/app/quick-action:", error);
    return NextResponse.json({
      error: error.message || "কুইক অ্যাকশন প্রসেস করতে ব্যর্থ হয়েছে।"
    }, { status: error.statusCode || 500 });
  }
}
