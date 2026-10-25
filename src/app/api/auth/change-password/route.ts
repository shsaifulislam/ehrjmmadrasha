import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword, verifyPassword, revokeAllUserSessions, createSessionToken, setAuthCookie, SESSION_COOKIE_NAME } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/change-password
 * Self-service password change for currently authenticated user (Admin, Teacher, Staff, Guardian, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত অনুরোধ। অনুগ্রহ করে প্রথমে লগইন করুন।" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "বর্তমান পাসওয়ার্ড, নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড পূরণ করা আবশ্যক।" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।" },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: "নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ড থেকে ভিন্ন হতে হবে।" },
        { status: 400 }
      );
    }

    // Retrieve user record from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "ব্যবহারকারী অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: "বর্তমান পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।" },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in database
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke old sessions except current one, or rotate token
    try {
      await revokeAllUserSessions(session.userId, "USER_SELF_PASSWORD_CHANGE");
    } catch {
      // Non-blocking session cleanup
    }

    // Record audit log
    await recordAuditLog({
      userId: session.userId,
      action: "USER_PASSWORD_CHANGE",
      entityType: "User",
      entityId: session.userId,
      details: { email: user.email, role: user.role },
    });

    // Create fresh session token for user so they remain smoothly logged in
    const newToken = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Update session cookie on response
    await setAuthCookie(newToken);
    response.cookies.set(SESSION_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error("Change Password API Error:", error);
    return NextResponse.json(
      { success: false, error: "পাসওয়ার্ড পরিবর্তনে সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
