import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeAttendanceDate } from "@/lib/attendanceCalculations";
import { sendStudentAttendanceSms, AttendanceSmsResult } from "@/lib/smsGateway";
import { checkRateLimit, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Format Date to 12-hour AM/PM string with Bangla numbers
 */
function formatTime12h(date: Date): { enTime: string; bnTime: string } {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const ampmBn = hours >= 12 ? "অপরাহ্ন" : "পূর্বাহ্ন";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const hrStr = hours < 10 ? `0${hours}` : `${hours}`;

  const enTime = `${hrStr}:${minStr} ${ampm}`;

  // Bengali digits converter
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  const bnTime = `${hrStr.replace(/\d/g, (d) => bnDigits[Number(d)])}:${minStr.replace(/\d/g, (d) => bnDigits[Number(d)])} ${ampmBn}`;

  return { enTime, bnTime };
}

/**
 * GET /api/attendance/scan
 * Fetch live digital attendance summary and recent scans for today's kiosk display.
 */
export async function GET(req: NextRequest) {
  try {
    const today = normalizeAttendanceDate(new Date());

    // 1. Fetch current active academic session
    const currentSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });

    // 2. Fetch today's scan logs
    const scanLogs = await prisma.biometricScanLog.findMany({
      where: {
        date: {
          gte: today,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            fullNameEn: true,
            photoUrl: true,
            fatherPhone: true,
            enrollments: {
              where: {
                status: "ACTIVE",
                ...(currentSession ? { sessionId: currentSession.id } : {}),
              },
              take: 1,
              include: {
                jamatClass: { select: { nameBn: true } },
                section: { select: { nameBn: true } },
              },
            },
          },
        },
      },
    });

    // 3. Compute statistics for today
    const todayAttendances = await prisma.attendance.findMany({
      where: {
        date: today,
        ...(currentSession ? { sessionId: currentSession.id } : {}),
      },
      select: {
        id: true,
        status: true,
        checkInTime: true,
        checkOutTime: true,
        checkInSmsSent: true,
        checkOutSmsSent: true,
      },
    });

    const checkInCount = todayAttendances.filter((a) => a.checkInTime !== null).length;
    const checkOutCount = todayAttendances.filter((a) => a.checkOutTime !== null).length;
    const onTimeCount = todayAttendances.filter((a) => a.status === "PRESENT" && a.checkInTime !== null).length;
    const lateCount = todayAttendances.filter((a) => a.status === "LATE" && a.checkInTime !== null).length;
    const smsCount = todayAttendances.filter((a) => a.checkInSmsSent || a.checkOutSmsSent).length;

    const formattedScans = scanLogs.map((log) => {
      const activeEnrollment = log.student.enrollments[0];
      const timeFormatted = formatTime12h(log.createdAt);
      return {
        id: log.id,
        studentId: log.student.id,
        studentIdNumber: log.student.studentIdNumber,
        studentName: log.student.fullNameBn,
        photoUrl: log.student.photoUrl,
        className: activeEnrollment?.jamatClass?.nameBn || "সাধারণ",
        sectionName: activeEnrollment?.section?.nameBn || null,
        rollNumber: activeEnrollment?.rollNumber || null,
        scanType: log.scanType,
        method: log.method,
        status: log.status,
        smsSent: log.smsSent,
        time: timeFormatted.bnTime,
        timeEn: timeFormatted.enTime,
        timestamp: log.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      date: today.toISOString().split("T")[0],
      sessionName: currentSession?.name || "চলতি শিক্ষাবর্ষ",
      stats: {
        checkInCount,
        checkOutCount,
        onTimeCount,
        lateCount,
        smsCount,
        totalScansToday: scanLogs.length,
      },
      recentScans: formattedScans,
    });
  } catch (error: any) {
    console.error("GET /api/attendance/scan error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "স্ক্যানার হিস্ট্রি লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attendance/scan
 * Record biometric / QR / Face / PIN attendance scan and trigger guardian SMS notification
 */
export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`scan:${clientIp}`, 120, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "অতিরিক্ত স্ক্যান অনুরোধ করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      identifier,
      scanType: requestedScanType = "AUTO",
      method = "QR_CODE",
      deviceUid = "KIOSK-MAIN-GATE",
    } = body;

    if (!identifier || typeof identifier !== "string" || identifier.trim() === "") {
      return NextResponse.json(
        { success: false, error: "আইডি, ফিঙ্গারপ্রিন্ট বা কিউআর কোড আবশ্যক।" },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim();

    // 1. Resolve Student by ID, studentIdNumber, or birthCertificateNo
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { id: cleanIdentifier },
          { studentIdNumber: cleanIdentifier },
          { studentIdNumber: cleanIdentifier.toUpperCase() },
          { birthCertificateNo: cleanIdentifier },
        ],
        status: "ACTIVE",
      },
      include: {
        guardianLinks: {
          include: {
            guardian: true,
          },
          take: 1,
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: `শিক্ষার্থী খুঁজে পাওয়া যায়নি। আইডি: "${cleanIdentifier}" পরীক্ষা করে পুনরায় চেষ্টা করুন।`,
          code: "STUDENT_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // 2. Fetch active session and active enrollment
    const currentSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });

    if (!currentSession) {
      return NextResponse.json(
        { success: false, error: "কোনো শিক্ষাবর্ষ সক্রিয় নেই।" },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        sessionId: currentSession.id,
        status: "ACTIVE",
      },
      include: {
        jamatClass: true,
        section: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          error: `${student.fullNameBn}-এর চলতি শিক্ষাবর্ষে কোনো সক্রিয় ভর্তি পাওয়া যায়নি।`,
          code: "NO_ACTIVE_ENROLLMENT",
        },
        { status: 400 }
      );
    }

    const today = normalizeAttendanceDate(new Date());
    const now = new Date();
    const timeFormatted = formatTime12h(now);

    // 3. Find existing attendance record for today
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId: student.id,
          date: today,
        },
      },
    });

    // 4. Determine scan type (CHECK_IN or CHECK_OUT)
    let finalScanType: "CHECK_IN" | "CHECK_OUT" = "CHECK_IN";

    if (requestedScanType === "CHECK_IN" || requestedScanType === "CHECK_OUT") {
      finalScanType = requestedScanType;
    } else {
      // AUTO detection
      if (!existingAttendance || !existingAttendance.checkInTime) {
        finalScanType = "CHECK_IN";
      } else if (!existingAttendance.checkOutTime) {
        // Prevent duplicate check-in within 60 seconds
        const secondsSinceCheckIn =
          (now.getTime() - new Date(existingAttendance.checkInTime).getTime()) / 1000;
        if (secondsSinceCheckIn < 60) {
          return NextResponse.json({
            success: true,
            isDuplicate: true,
            scanType: "CHECK_IN",
            student: {
              id: student.id,
              studentIdNumber: student.studentIdNumber,
              fullNameBn: student.fullNameBn,
              photoUrl: student.photoUrl,
              className: enrollment.jamatClass.nameBn,
              rollNumber: enrollment.rollNumber,
            },
            time: timeFormatted.bnTime,
            message: `${student.fullNameBn}-এর আগমন হাজিরা ইতিমধ্যেই গৃহীত হয়েছে (${Math.round(secondsSinceCheckIn)} সেকেন্ড আগে)।`,
          });
        }
        finalScanType = "CHECK_OUT";
      } else {
        // Already checked out, check if checkout was less than 60 seconds ago
        const secondsSinceCheckOut =
          (now.getTime() - new Date(existingAttendance.checkOutTime).getTime()) / 1000;
        if (secondsSinceCheckOut < 60) {
          return NextResponse.json({
            success: true,
            isDuplicate: true,
            scanType: "CHECK_OUT",
            student: {
              id: student.id,
              studentIdNumber: student.studentIdNumber,
              fullNameBn: student.fullNameBn,
              photoUrl: student.photoUrl,
              className: enrollment.jamatClass.nameBn,
              rollNumber: enrollment.rollNumber,
            },
            time: timeFormatted.bnTime,
            message: `${student.fullNameBn}-এর প্রস্থান হাজিরা ইতিমধ্যে সম্পন্ন হয়েছে।`,
          });
        }
        // Update checkout time on subsequent exit scans
        finalScanType = "CHECK_OUT";
      }
    }

    // 5. Calculate status if check-in (Rules: Arrival <= 08:30 is PRESENT, > 08:30 is LATE)
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const isLate = currentHour > 8 || (currentHour === 8 && currentMin > 30);
    const calculatedStatus = isLate ? "LATE" : "PRESENT";

    // 6. Resolve Guardian Phone for SMS
    const guardianPhone =
      student.guardianLinks[0]?.guardian?.phone ||
      student.fatherPhone ||
      student.motherPhone ||
      null;

    // 7. Send Guardian SMS
    let smsResult: AttendanceSmsResult = {
      sent: false,
      destination: guardianPhone,
      messageText: "",
    };

    if (guardianPhone) {
      smsResult = await sendStudentAttendanceSms({
        studentId: student.id,
        studentName: student.fullNameBn,
        studentRoll: enrollment.rollNumber,
        className: enrollment.jamatClass.nameBn,
        guardianPhone,
        scanType: finalScanType,
        timeStr: timeFormatted.bnTime,
      });
    }

    // 8. Upsert Attendance Record
    let updatedAttendance;
    if (finalScanType === "CHECK_IN") {
      updatedAttendance = await prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: student.id,
            date: today,
          },
        },
        create: {
          studentId: student.id,
          sessionId: currentSession.id,
          classId: enrollment.classId,
          sectionId: enrollment.sectionId,
          date: today,
          status: calculatedStatus,
          checkInTime: now,
          entryMethod: method,
          checkInSmsSent: smsResult.sent,
          deviceUid,
          remarks: isLate ? "বিলম্বিত আগমন (ডিজিটাল স্ক্যান)" : "সময়মতো আগমন (ডিজিটাল স্ক্যান)",
        },
        update: {
          checkInTime: now,
          entryMethod: method,
          checkInSmsSent: smsResult.sent,
          status: calculatedStatus,
          deviceUid,
        },
      });
    } else {
      // CHECK_OUT
      updatedAttendance = await prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: student.id,
            date: today,
          },
        },
        create: {
          studentId: student.id,
          sessionId: currentSession.id,
          classId: enrollment.classId,
          sectionId: enrollment.sectionId,
          date: today,
          status: "PRESENT",
          checkOutTime: now,
          exitMethod: method,
          checkOutSmsSent: smsResult.sent,
          deviceUid,
          remarks: "ডিজিটাল প্রস্থান",
        },
        update: {
          checkOutTime: now,
          exitMethod: method,
          checkOutSmsSent: smsResult.sent,
          deviceUid,
        },
      });
    }

    // 9. Record BiometricScanLog
    const scanLog = await prisma.biometricScanLog.create({
      data: {
        studentId: student.id,
        scanType: finalScanType,
        method,
        deviceUid,
        status: "SUCCESS",
        smsSent: smsResult.sent,
        smsDestination: smsResult.destination,
        smsDeliveryId: smsResult.messageId,
        remarks:
          finalScanType === "CHECK_IN"
            ? `${isLate ? "বিলম্বিত " : ""}আগমন রেকর্ড ও অভিভাবক এসএমএস প্রসেসড`
            : "প্রস্থান রেকর্ড ও অভিভাবক এসএমএস প্রসেসড",
      },
    });

    const actionTextBn = finalScanType === "CHECK_IN" ? "আগমন" : "প্রস্থান";
    const statusTextBn =
      finalScanType === "CHECK_IN"
        ? isLate
          ? "বিলম্বিত (Late)"
          : "উপস্থিত (Present)"
        : "সম্পন্ন";

    const feedbackMessage = `${student.fullNameBn}-এর ${actionTextBn} হাজিরা সফলভাবে নথিভুক্ত হয়েছে (${timeFormatted.bnTime})। ${
      smsResult.sent
        ? `অভিভাবকের (${smsResult.destination}) মোবাইলে নিশ্চিতকরণ এসএমএস পাঠানো হয়েছে।`
        : "অভিভাবকের সক্রিয় মোবাইল নম্বর না থাকায় এসএমএস পাঠানো যায়নি।"
    }`;

    return NextResponse.json({
      success: true,
      scanId: scanLog.id,
      scanType: finalScanType,
      method,
      status: updatedAttendance.status,
      statusTextBn,
      time: timeFormatted.bnTime,
      timeEn: timeFormatted.enTime,
      student: {
        id: student.id,
        studentIdNumber: student.studentIdNumber,
        fullNameBn: student.fullNameBn,
        fullNameEn: student.fullNameEn,
        photoUrl: student.photoUrl,
        className: enrollment.jamatClass.nameBn,
        sectionName: enrollment.section?.nameBn || null,
        rollNumber: enrollment.rollNumber,
        guardianPhone,
      },
      sms: {
        sent: smsResult.sent,
        destination: smsResult.destination,
        messageText: smsResult.messageText,
      },
      message: feedbackMessage,
    });
  } catch (error: any) {
    console.error("POST /api/attendance/scan error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "হাজিরা সংরক্ষণ করতে অভ্যন্তরীণ ত্রুটি হয়েছে।",
      },
      { status: 500 }
    );
  }
}
