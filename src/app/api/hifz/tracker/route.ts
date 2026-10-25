import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/security";
import {
  getHifzStudentSummaries,
  getHifzDailyLogs,
  getHifzDivisionStats,
  recordHifzDailyEntry,
  getStudentHifzDetail,
} from "@/lib/hifz/hifzEngine";
import { QURAN_PARAS, HIFZ_QUALITY_OPTIONS } from "@/lib/hifz/hifzConstants";

export const dynamic = "force-dynamic";

/**
 * GET /api/hifz/tracker
 * Fetch Hifz students list, daily logs for selected date, and division summary.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const studentIdParam = searchParams.get("studentId");

    // If Guardian, only return their child's Hifz info
    if (user.role === "GUARDIAN") {
      const guardian = await prisma.guardian.findFirst({
        where: { userId: user.userId },
        include: {
          students: {
            include: { student: true },
          },
        },
      });

      if (!guardian || guardian.students.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            isHifzStudent: false,
            message: "আপনার কোনো নিবন্ধিত সন্তান পাওয়া যায়নি।",
          },
        });
      }

      const targetStudentId = studentIdParam || guardian.students[0].studentId;
      const detail = await getStudentHifzDetail(targetStudentId);

      return NextResponse.json({
        success: true,
        data: {
          isHifzStudent: Boolean(detail.summary),
          detail,
          paras: QURAN_PARAS,
          qualityOptions: HIFZ_QUALITY_OPTIONS,
        },
      });
    }

    // Role: TEACHER, PRINCIPAL, ADMIN
    if (!["TEACHER", "PRINCIPAL", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    // If specific student requested
    if (studentIdParam) {
      const detail = await getStudentHifzDetail(studentIdParam);
      return NextResponse.json({
        success: true,
        data: {
          detail,
          paras: QURAN_PARAS,
          qualityOptions: HIFZ_QUALITY_OPTIONS,
        },
      });
    }

    const [summaries, dailyLogs, stats] = await Promise.all([
      getHifzStudentSummaries(),
      getHifzDailyLogs(date),
      getHifzDivisionStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        date,
        students: summaries,
        logs: dailyLogs,
        stats,
        paras: QURAN_PARAS,
        qualityOptions: HIFZ_QUALITY_OPTIONS,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/hifz/tracker:", error);
    return NextResponse.json(
      { error: error.message || "হিফজ তথ্য লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hifz/tracker
 * Record or update a student's daily Sabaq, Sabqi, and Manzil progress.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !["TEACHER", "PRINCIPAL", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "শুধুমাত্র উস্তাদ ও মুহতামিম মহোদয় হিফজ ডায়েরি এন্ট্রি করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      studentId,
      date,
      attendance,
      sabaq,
      sabqi,
      manzil,
      totalParasCompleted,
      currentSabaqPara,
      remarks,
    } = body;

    if (!studentId || !date) {
      return NextResponse.json(
        { error: "শিক্ষার্থী এবং তারিখ নির্বাচন আবশ্যক।" },
        { status: 400 }
      );
    }

    const savedLog = await recordHifzDailyEntry({
      studentId,
      date,
      attendance: attendance || "PRESENT",
      sabaq,
      sabqi,
      manzil,
      totalParasCompleted: totalParasCompleted !== undefined ? Number(totalParasCompleted) : undefined,
      currentSabaqPara: currentSabaqPara !== undefined ? Number(currentSabaqPara) : undefined,
      remarks,
      recordedBy: user.name || "উস্তাদ",
    });

    await recordAuditLog({
      action: "HIFZ_DAILY_ENTRY",
      entityType: "HifzDailyLog",
      entityId: savedLog.id,
      userId: user.userId,
      details: {
        studentId,
        date,
        sabaqQuality: sabaq?.quality,
        totalParasCompleted,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${savedLog.studentNameBn}-এর হিফজ ডায়েরি সফলভাবে সংরক্ষিত হয়েছে।`,
      data: savedLog,
    });
  } catch (error: any) {
    console.error("Error in POST /api/hifz/tracker:", error);
    return NextResponse.json(
      { error: error.message || "হিফজ এন্ট্রি সংরক্ষণ করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
