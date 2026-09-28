import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: "ইমেইল এবং ৬-সংখ্যার ওটিপি কোড প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    if (cleanOtp.length !== 6 || !/^\d+$/.test(cleanOtp)) {
      return NextResponse.json(
        { error: "ওটিপি অবশ্যই ৬-সংখ্যার সংখ্যাসূচক কোড হতে হবে।" },
        { status: 400 }
      );
    }

    // Find the latest active OTP record for this email
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        email: normalizedEmail,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          error:
            "ওটিপি কোডটির মেয়াদ শেষ হয়েছে অথবা কোডটি সঠিক নয়। অনুগ্রহ করে নতুন ওটিপি পাঠান।",
        },
        { status: 400 }
      );
    }

    // Check maximum attempts (brute-force defense: max 5 attempts)
    if (otpRecord.attempts >= 5) {
      await prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });

      return NextResponse.json(
        {
          error:
            "সর্বোচ্চ চেষ্টার সীমা (৫ বার) অতিক্রম হয়েছে। নিরাপত্তার কারণে এই ওটিপি বাতিল করা হয়েছে। নতুন ওটিপি অনুরোধ করুন।",
        },
        { status: 429 }
      );
    }

    // Verify OTP using bcrypt
    const isMatch = await bcrypt.compare(cleanOtp, otpRecord.otpHash);

    if (!isMatch) {
      // Increment attempt counter
      await prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      const remainingAttempts = 4 - otpRecord.attempts;
      return NextResponse.json(
        {
          error: `ভুল ওটিপি কোড! ${
            remainingAttempts > 0
              ? `আর মাত্র ${remainingAttempts} বার চেষ্টা করতে পারবেন।`
              : "আর কোনো সুযোগ বাকি নেই।"
          }`,
        },
        { status: 400 }
      );
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save reset token to the OTP record
    await prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: {
        resetToken,
      },
    });

    return NextResponse.json({
      success: true,
      resetToken,
      message: "ওটিপি সফলভাবে যাচাই করা হয়েছে। এবার আপনার নতুন পাসওয়ার্ড সেট করুন।",
    });
  } catch (error: any) {
    console.error("[Forgot-Password] verify-otp exception:", error);
    return NextResponse.json(
      { error: "ওটিপি যাচাই করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
