import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

// Standard API response helper
function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

/**
 * GET /api/admin/users
 * Lists users for administrative management (passwords strictly excluded)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "ADMIN") {
      return errorResponse("অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন প্রবেশের অনুমতি রয়েছে।", 403);
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");
    const statusFilter = searchParams.get("status");
    const searchQuery = searchParams.get("q");

    const whereClause: any = {};

    if (roleFilter && roleFilter !== "ALL") {
      whereClause.role = roleFilter;
    }

    if (statusFilter && statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery } },
        { email: { contains: searchQuery } },
        { phone: { contains: searchQuery } },
        { username: { contains: searchQuery } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        teacherAssignments: {
          select: {
            id: true,
            subject: { select: { nameBn: true } },
            section: {
              select: {
                nameBn: true,
                jamatClass: { select: { nameBn: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        users,
        total: users.length,
      },
    });
  } catch (error: any) {
    console.error("Admin Users GET Error:", error);
    return errorResponse("ইউজার তালিকা লোড করতে সমস্যা হয়েছে।", 500);
  }
}

/**
 * POST /api/admin/users
 * Creates a new staff user (TEACHER only; Super Admin is strictly forbidden)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "ADMIN") {
      return errorResponse("অননুমোদিত অ্যাক্সেস।", 403);
    }

    const body = await req.json();
    const { name, email, phone, password, role = "TEACHER" } = body;

    // Reject attempt to create Super Admin or unsupported roles
    if (role !== "TEACHER" && role !== "ADMIN") {
      return errorResponse("অবৈধ ভূমিকা। শুধুমাত্র শিক্ষক বা অনুমোদিত কর্মকর্তা তৈরি করা সম্ভব।", 400);
    }

    if (!name || !email || !password) {
      return errorResponse("পূর্ণ নাম, ইমেইল এবং পাসওয়ার্ড আবশ্যক।", 400);
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse("অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন।", 400);
    }

    // Password strength check (min 6 chars)
    if (password.length < 6) {
      return errorResponse("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।", 400);
    }

    // Check uniqueness of email and username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: email.split("@")[0] }],
      },
    });

    if (existingUser) {
      return errorResponse("এই ইমেইল ঠিকানায় ইতিমধ্যে একটি অ্যাকাউন্ট বিদ্যমান।", 409);
    }

    if (phone) {
      const existingPhone = await prisma.user.findFirst({ where: { phone } });
      if (existingPhone) {
        return errorResponse("এই মোবাইল নম্বরে ইতিমধ্যে একটি অ্যাকাউন্ট বিদ্যমান।", 409);
      }
    }

    const passwordHash = await hashPassword(password);
    const username = email.split("@")[0] + "_" + Math.floor(1000 + Math.random() * 9000);

    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        phone: phone || null,
        passwordHash,
        role,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Record permanent audit log
    await recordAuditLog({
      userId: session.userId,
      action: "CREATE_USER",
      entityType: "User",
      entityId: newUser.id,
      details: { role, email, name },
    });

    return NextResponse.json({
      success: true,
      message: `${role === "TEACHER" ? "উস্তাদ/শিক্ষক" : "ব্যবহারকারী"} অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।`,
      data: { user: newUser },
    });
  } catch (error: any) {
    console.error("Admin Users POST Error:", error);
    return errorResponse("ইউজার অ্যাকাউন্ট তৈরিতে ব্যর্থ হয়েছে।", 500);
  }
}

/**
 * PATCH /api/admin/users
 * Updates status (ACTIVE, INACTIVE, SUSPENDED) or resets password
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "ADMIN") {
      return errorResponse("অননুমোদিত অ্যাক্সেস।", 403);
    }

    const body = await req.json();
    const { userId, action, status, newPassword } = body;

    if (!userId) {
      return errorResponse("ইউজার আইডি প্রদান করা আবশ্যক।", 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return errorResponse("ব্যবহারকারী পাওয়া যায়নি।", 404);
    }

    // Prevent Admin from suspending/deactivating themselves
    if (targetUser.id === session.userId && status && status !== "ACTIVE") {
      return errorResponse("আপনি নিজের অ্যাডমিন অ্যাকাউন্ট নিষ্ক্রিয় বা স্থগিত করতে পারবেন না।", 400);
    }

    if (action === "UPDATE_STATUS") {
      if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
        return errorResponse("অবৈধ স্ট্যাটাস মান।", 400);
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { status },
        select: { id: true, name: true, email: true, status: true, role: true },
      });

      await recordAuditLog({
        userId: session.userId,
        action: "UPDATE_USER_STATUS",
        entityType: "User",
        entityId: userId,
        details: { oldStatus: targetUser.status, newStatus: status },
      });

      return NextResponse.json({
        success: true,
        message: `স্ট্যাটাস সফলভাবে '${status}' করা হয়েছে।`,
        data: { user: updated },
      });
    }

    if (action === "RESET_PASSWORD") {
      if (!newPassword || newPassword.length < 6) {
        return errorResponse("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।", 400);
      }

      const passwordHash = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      await recordAuditLog({
        userId: session.userId,
        action: "RESET_USER_PASSWORD",
        entityType: "User",
        entityId: userId,
        details: { targetEmail: targetUser.email },
      });

      return NextResponse.json({
        success: true,
        message: "পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে।",
      });
    }

    return errorResponse("অবৈধ অ্যাকশন নির্দেশিত হয়েছে।", 400);
  } catch (error: any) {
    console.error("Admin Users PATCH Error:", error);
    return errorResponse("ইউজার আপডেট করতে সমস্যা হয়েছে।", 500);
  }
}
