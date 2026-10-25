import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, revokeAllUserSessions } from "@/lib/auth";
import { sendPasswordResetSuccessEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, resetToken, newPassword, confirmPassword } = body;

    if (!email || !resetToken || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "সকল তথ্য সঠিকভাবে পূরণ করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "নতুন পাসওয়ার্ড ও পাসওয়ার্ড নিশ্চিতকরণ হুবহু মেলেনি।" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।" },
        { status: 400 }
      );
    }

    // Verify resetToken in PasswordResetOtp table
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        email: normalizedEmail,
        resetToken,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          error:
            "অনুরোধটি অবৈধ বা এর মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে প্রথম থেকে আবার শুরু করুন।",
        },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ব্যবহারকারী অ্যাকাউন্ট পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // Hash the new password using bcrypt
    const newPasswordHash = await hashPassword(newPassword);

    // Update user's password and mark OTP as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
        },
      }),
      prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: {
          isUsed: true,
        },
      }),
      // Invalidate all active sessions for this user for security
      prisma.session.deleteMany({
        where: {
          userId: user.id,
        },
      }),
    ]);

    // Authoritative session revocation across all devices
    await revokeAllUserSessions(user.id, "PASSWORD_RESET");

    // Send confirmation email
    try {
      await sendPasswordResetSuccessEmail({
        to: user.email,
        userName: user.name || "সম্মানিত ব্যবহারকারী",
      });
    } catch (mailErr) {
      console.error("[Forgot-Password] Failed to send success notification email:", mailErr);
    }

    return NextResponse.json({
      success: true,
      message: "আলহামদুলিল্লাহ, আপনার নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে! এখন লগইন করুন।",
    });
  } catch (error: any) {
    console.error("[Forgot-Password] reset-password exception:", error);
    return NextResponse.json(
      { error: "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
