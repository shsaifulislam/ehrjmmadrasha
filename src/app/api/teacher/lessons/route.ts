import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getLessonPlans,
  saveLessonPlan,
  deleteLessonPlan,
} from "@/lib/lessonPlanStore";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/lessons
 * Returns lesson plans for the logged-in teacher and assigned classes list.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র শিক্ষক এই তথ্য দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const teacherUserId = user.userId;

    // Fetch classes for dropdown selection
    const classes = await prisma.jamatClass.findMany({
      where: { isActive: true },
      include: { sections: true },
      orderBy: { sortOrder: "asc" },
    });

    const lessonPlans = getLessonPlans(user.role === "ADMIN" ? undefined : teacherUserId);

    return NextResponse.json({
      success: true,
      plans: lessonPlans,
      classes: classes.map((c) => ({
        id: c.id,
        nameBn: c.nameBn,
        sections: c.sections.map((s) => ({ id: s.id, nameBn: s.nameBn })),
      })),
    });
  } catch (error: any) {
    console.error("Teacher Lessons API Error:", error);
    return NextResponse.json(
      { error: "পাঠ পরিকল্পনা লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/lessons
 * Create or update a lesson plan and homework assignment.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র শিক্ষক পাঠ পরিকল্পনা তৈরি করতে পারেন।" },
        { status: 403 }
      );
    }

    const teacherUserId = user.userId;
    const body = await req.json();

    const {
      id,
      classId,
      classNameBn,
      sectionNameBn,
      subjectNameBn,
      lessonDate,
      topicTitleBn,
      homeworkBn,
      status,
      notes,
    } = body;

    if (!classNameBn || !subjectNameBn || !topicTitleBn) {
      return NextResponse.json(
        { error: "জামাত, বিষয় এবং পঠিত পাঠের শিরোনাম দেওয়া আবশ্যক।" },
        { status: 400 }
      );
    }

    const saved = saveLessonPlan({
      id: id || undefined,
      teacherId: teacherUserId,
      teacherName: user.name || "মাওলানা আহমাদ উল্লাহ",
      classId: classId || "general",
      classNameBn,
      sectionNameBn: sectionNameBn || "সাধারণ শাখা",
      subjectNameBn,
      lessonDate: lessonDate || new Date().toISOString().split("T")[0],
      topicTitleBn,
      homeworkBn: homeworkBn || "আজকের পাঠ রিভিশন ও তামরীন",
      status: status || "COMPLETED",
      notes: notes || "",
    });

    return NextResponse.json({
      success: true,
      plan: saved,
      message: "পাঠ পরিকল্পনা সফলভাবে সংরক্ষণ করা হয়েছে।",
    });
  } catch (error: any) {
    console.error("Save Lesson Plan Error:", error);
    return NextResponse.json(
      { error: "পাঠ পরিকল্পনা সংরক্ষণে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/lessons
 * Delete a lesson plan.
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "আইডি দেওয়া হয়নি।" }, { status: 400 });
    }

    const deleted = deleteLessonPlan(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { error: "পাঠ পরিকল্পনা মুছে ফেলতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
