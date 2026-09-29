import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllTrainingPrograms,
  createTrainingProgram,
  getAllEnrollments,
} from "@/lib/training";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const mandatory = searchParams.get("mandatory");
    const department = searchParams.get("department");
    const search = searchParams.get("search")?.toLowerCase().trim();

    let programs = getAllTrainingPrograms();
    const role = user?.role || "PUBLIC";

    // Public / Non-admin visibility filter
    if (role !== "ADMIN" && role !== "PRINCIPAL") {
      const enrollments = getAllEnrollments();
      const userEnrollmentProgIds = new Set(
        enrollments
          .filter((e) => e.employeeId === user?.userId || e.employeeName === user?.username)
          .map((e) => e.trainingProgramId)
      );

      programs = programs.filter(
        (p) =>
          p.status === "PUBLISHED" ||
          p.status === "REGISTRATION_OPEN" ||
          p.status === "SCHEDULED" ||
          p.status === "IN_PROGRESS" ||
          p.status === "COMPLETED" ||
          userEnrollmentProgIds.has(p.id)
      );
    }

    if (type) {
      programs = programs.filter((p) => p.trainingType === type);
    }
    if (status) {
      programs = programs.filter((p) => p.status === status);
    }
    if (mandatory) {
      programs = programs.filter((p) => p.mandatoryStatus === mandatory);
    }
    if (department) {
      programs = programs.filter(
        (p) => p.ownerDepartment === department || p.targetDepartments.includes(department)
      );
    }
    if (search) {
      programs = programs.filter(
        (p) =>
          p.titleBn.toLowerCase().includes(search) ||
          p.titleEn.toLowerCase().includes(search) ||
          p.trainingCode.toLowerCase().includes(search) ||
          p.instructorName.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      total: programs.length,
      programs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch training programs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.titleBn || !body.titleEn || !body.instructorName || !body.totalHours) {
      return NextResponse.json(
        { success: false, error: "শিরোনাম (বাংলা ও ইংরেজি), প্রশিক্ষক এবং মোট ঘন্টা আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor = {
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
    };

    const newProgram = createTrainingProgram(body, actor);

    return NextResponse.json(
      {
        success: true,
        message: "প্রশিক্ষণ কার্যক্রমটি খসড়া হিসেবে সংরক্ষণ করা হয়েছে।",
        program: newProgram,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create training program" },
      { status: 500 }
    );
  }
}
