import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureEmployeeForTeacherUser,
  submitLeaveRequest,
  getEmployeeLeaveBalances,
} from "@/lib/hrEngine";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/leave
 * List authenticated teacher's own leave requests, active leave types, and current balances.
 * Strictly scoped to session teacher to prevent IDOR.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র শিক্ষক প্রবেশ করতে পারেন।" },
        { status: 403 }
      );
    }

    const employee = await ensureEmployeeForTeacherUser(user.userId);
    if (!employee) {
      return NextResponse.json(
        { error: "শিক্ষক প্রোফাইল পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const currentYear = new Date().getFullYear();

    const [requests, leaveTypes, balances] = await Promise.all([
      prisma.employeeLeaveRequest.findMany({
        where: { employeeId: employee.id },
        include: {
          leaveType: true,
          reviewedByUser: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.employeeLeaveType.findMany({
        where: { isActive: true },
        orderBy: { defaultDaysPerYear: "asc" },
      }),
      getEmployeeLeaveBalances(employee.id, currentYear),
    ]);

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        nameBn: employee.nameBn,
        status: employee.status,
      },
      requests,
      leaveTypes,
      balances,
    });
  } catch (error: any) {
    console.error("GET /api/teacher/leave error:", error);
    return NextResponse.json(
      { error: error.message || "ছুটির তথ্য লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/leave
 * Submit a leave request for the authenticated teacher.
 * Teacher ownership is derived strictly from server session (Zero IDOR).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র শিক্ষক আবেদন দাখিল করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { leaveTypeId, startDate, endDate, reason, emergencyContact, attachmentUrl } = body;

    // 1. Mandatory field validation
    if (!leaveTypeId || !startDate || !endDate || !reason?.trim()) {
      return NextResponse.json(
        { error: "ছুটির ধরন, শুরুর তারিখ, শেষের তারিখ ও ছুটির কারণ আবশ্যক।" },
        { status: 400 }
      );
    }

    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return NextResponse.json(
        { error: "শুরুর বা শেষের তারিখের ফরম্যাট সঠিক নয়।" },
        { status: 400 }
      );
    }

    if (parsedEnd < parsedStart) {
      return NextResponse.json(
        { error: "ছুটির শেষের তারিখ শুরুর তারিখের পূর্বের হতে পারে না।" },
        { status: 400 }
      );
    }

    // 2. Strict Session-bound Employee Resolution (Ignore any client-supplied teacherId/employeeId)
    const employee = await ensureEmployeeForTeacherUser(user.userId);
    if (!employee) {
      return NextResponse.json(
        { error: "শিক্ষক প্রোফাইল পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    if (employee.status !== "ACTIVE" && employee.status !== "ON_LEAVE") {
      return NextResponse.json(
        { error: `বর্তমান স্ট্যাটাসে (${employee.status}) ছুটির আবেদন গ্রহণযোগ্য নয়।` },
        { status: 400 }
      );
    }

    // 3. Submit Leave Request using transactional HR engine
    const request = await submitLeaveRequest({
      employeeId: employee.id,
      leaveTypeId,
      startDate: parsedStart,
      endDate: parsedEnd,
      reason: reason.trim(),
      emergencyContact: emergencyContact?.trim() || employee.mobile,
      attachmentUrl: attachmentUrl || undefined,
      recordedByUserId: user.userId,
    });

    // 4. Audit Log
    await recordAuditLog({
      userId: user.userId,
      action: "TEACHER_LEAVE_REQUEST_SUBMITTED",
      entityType: "EmployeeLeaveRequest",
      entityId: request.id,
      details: {
        userRole: user.role,
        requestCode: request.requestCode,
        employeeId: employee.id,
        leaveTypeId,
        totalDays: request.totalDays,
        startDate: parsedStart.toISOString(),
        endDate: parsedEnd.toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "ছুটির আবেদন সফলভাবে দাখিল করা হয়েছে।",
        request,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/teacher/leave error:", error);
    return NextResponse.json(
      { error: error.message || "ছুটির আবেদন দাখিল ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
