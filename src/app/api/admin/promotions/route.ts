import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const history = await prisma.auditLog.findMany({
      where: {
        entityType: "Enrollment",
        action: "PROMOTION",
      },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    return NextResponse.json({ error: "প্রমোশন ইতিহাস আনতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন প্রমোশন কার্যকর করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentIds,
      toSessionId,
      toClassId,
      toSectionId,
      rollAssignments, // array of { studentId: string, rollNumber: number }
    } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "কমপক্ষে একজন ছাত্র নির্বাচন করুন।" }, { status: 400 });
    }

    if (!toSessionId || !toClassId) {
      return NextResponse.json({ error: "লক্ষ্য সেশন এবং শ্রেণি নির্বাচন আবশ্যক।" }, { status: 400 });
    }

    const rollMap = new Map<string, number>();
    if (rollAssignments && Array.isArray(rollAssignments)) {
      for (const item of rollAssignments) {
        if (item.studentId && item.rollNumber) {
          rollMap.set(item.studentId, Number(item.rollNumber));
        }
      }
    }

    const [targetSession, targetClass] = await Promise.all([
      prisma.academicSession.findUnique({ where: { id: toSessionId } }),
      prisma.jamatClass.findUnique({ where: { id: toClassId } }),
    ]);

    if (!targetSession || !targetClass) {
      return NextResponse.json({ error: "লক্ষ্য সেশন বা জামাত পাওয়া যায়নি।" }, { status: 404 });
    }

    const results = await prisma.$transaction(async (tx) => {
      const createdEnrollments = [];

      for (let i = 0; i < studentIds.length; i++) {
        const sId = studentIds[i];

        // 1. Mark previous active enrollment as PROMOTED
        const activeEnrollment = await tx.enrollment.findFirst({
          where: {
            studentId: sId,
            status: "ACTIVE",
          },
        });

        if (activeEnrollment) {
          await tx.enrollment.update({
            where: { id: activeEnrollment.id },
            data: { status: "PROMOTED" },
          });
        }

        // 2. Determine target roll
        let assignedRoll = rollMap.get(sId);
        if (!assignedRoll) {
          // Find max roll in target session/class/section
          const maxRollObj = await tx.enrollment.findFirst({
            where: {
              sessionId: toSessionId,
              classId: toClassId,
              ...(toSectionId ? { sectionId: toSectionId } : {}),
            },
            orderBy: { rollNumber: "desc" },
            select: { rollNumber: true },
          });
          assignedRoll = (maxRollObj?.rollNumber || 0) + 1;
        }

        // 3. Create new enrollment in target session
        const newEnrollment = await tx.enrollment.create({
          data: {
            studentId: sId,
            sessionId: toSessionId,
            classId: toClassId,
            sectionId: toSectionId || null,
            rollNumber: assignedRoll,
            status: "ACTIVE",
          },
        });

        createdEnrollments.push(newEnrollment);
      }

      // 4. Audit Log for the promotion batch
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "PROMOTION",
          entityType: "Enrollment",
          entityId: toClassId,
          detailsJson: JSON.stringify({
            targetSession: targetSession.name,
            targetClass: targetClass.nameBn,
            targetSectionId: toSectionId || "সাধারণ",
            studentsCount: studentIds.length,
            studentIds,
          }),
        },
      });

      return createdEnrollments;
    });

    return NextResponse.json({
      success: true,
      message: `${results.length} জন শিক্ষার্থীকে সফলভাবে '${targetClass.nameBn}' জামাতে প্রমোশন দেওয়া হয়েছে। পূর্ববর্তী ইতিহাস অপরিবর্তিত রয়েছে।`,
      promotedCount: results.length,
    });
  } catch (error: any) {
    console.error("POST Promotions Execute Error:", error);
    return NextResponse.json({ error: error.message || "প্রমোশন কার্যকর করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
