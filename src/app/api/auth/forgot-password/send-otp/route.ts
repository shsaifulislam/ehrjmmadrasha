import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetOtpEmail } from "@/lib/mail";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে সঠিক ইমেইল ঠিকানা প্রদান করুন।" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists in the database
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "এই ইমেইল ঠিকানার সাথে নিবন্ধিত কোনো অ্যাকাউন্ট পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "আপনার অ্যাকাউন্টটি স্থগিত বা নিষ্ক্রিয়। মাদরাসা প্রশাসনের সাথে যোগাযোগ করুন।" },
        { status: 403 }
      );
    }

    // Rate limiting: Check if an OTP was sent within the last 60 seconds
    const recentOtp = await prisma.passwordResetOtp.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // within last 1 minute
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentOtp) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে ৬০ সেকেন্ড অপেক্ষা করে পুনরায় চেষ্টা করুন।" },
        { status: 429 }
      );
    }

    // Generate a 6-digit numeric OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

    // Invalidate any previous unused OTPs for this email
    await prisma.passwordResetOtp.updateMany({
      where: {
        email: normalizedEmail,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Save the new OTP record
    await prisma.passwordResetOtp.create({
      data: {
        email: normalizedEmail,
        otpHash,
        expiresAt,
        attempts: 0,
        isUsed: false,
      },
    });

    // Send email via Gmail SMTP
    const emailResult = await sendPasswordResetOtpEmail({
      to: normalizedEmail,
      userName: user.name || "সম্মানিত ব্যবহারকারী",
      otpCode: rawOtp,
      validMinutes: 10,
    });

    if (!emailResult.success) {
      console.error("[Forgot-Password] Failed to send email via SMTP:", emailResult.error);
      return NextResponse.json(
        {
          error: "ইমেইল পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "আপনার ইমেইলে একটি ৬-সংখ্যার ওটিপি (OTP) পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।",
      email: normalizedEmail,
    });
  } catch (error: any) {
    console.error("[Forgot-Password] send-otp exception:", error);
    return NextResponse.json(
      { error: "সার্ভারে ত্রুটি হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
