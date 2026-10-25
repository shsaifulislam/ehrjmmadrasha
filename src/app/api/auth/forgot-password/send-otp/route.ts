import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetOtpEmail } from "@/lib/mail";
import { checkRateLimit, getClientIp } from "@/lib/security";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // IP-level abuse protection: Max 5 OTP requests per 5 minutes per IP
    const ipRateLimit = checkRateLimit(`forgot-otp:${ip}`, 5, 300000);
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "খুব বেশি চেষ্টার কারণে ওটিপি প্রেরণ সাময়িকভাবে স্থগিত। ৫ মিনিট পর আবার চেষ্টা করুন।" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawInput = String(body.identifier || body.email || "").trim();

    if (!rawInput) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে আপনার নিবন্ধিত ইমেইল অথবা মোবাইল নম্বর প্রদান করুন।" },
        { status: 400 }
      );
    }

    let targetEmail = "";
    let user: any = null;

    if (rawInput.includes("@")) {
      targetEmail = rawInput.toLowerCase();
      user = await prisma.user.findFirst({
        where: { email: targetEmail },
      });
    } else {
      // Input is mobile number or username - normalize phone
      const banglaDigits: Record<string, string> = {
        "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
        "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9"
      };
      const cleanPhoneDigits = rawInput
        .replace(/[০-৯]/g, (d) => banglaDigits[d] || d)
        .replace(/[\s\-\(\)\.]/g, "");

      const phoneVariants = [cleanPhoneDigits];
      if (cleanPhoneDigits.startsWith("01")) {
        phoneVariants.push("+88" + cleanPhoneDigits, "88" + cleanPhoneDigits);
      } else if (cleanPhoneDigits.startsWith("+880")) {
        phoneVariants.push("0" + cleanPhoneDigits.slice(4));
      }

      user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: rawInput },
            { phone: rawInput },
            ...phoneVariants.map(p => ({ phone: p })),
          ],
        },
      });

      if (!user) {
        // Fallback: Check Guardian profile
        const guardian = await prisma.guardian.findFirst({
          where: {
            OR: phoneVariants.map(p => ({ phone: p })),
          },
          select: { userId: true, email: true },
        });

        if (guardian?.userId) {
          user = await prisma.user.findUnique({
            where: { id: guardian.userId },
          });
        }
      }

      if (user?.email) {
        targetEmail = user.email.toLowerCase();
      }
    }

    if (!user || !targetEmail) {
      // Account enumeration protection: Return generic success without revealing non-existence
      return NextResponse.json({
        success: true,
        message: "যদি এই তথ্যের সাথে কোনো সক্রিয় অ্যাকাউন্ট পাওয়া যায়, তবে ইমেইলে ভেরিফিকেশন কোড পাঠানো হয়েছে।",
      });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({
        success: true,
        message: "যদি এই তথ্যের সাথে কোনো সক্রিয় অ্যাকাউন্ট পাওয়া যায়, তবে ইমেইলে ভেরিফিকেশন কোড পাঠানো হয়েছে।",
      });
    }

    const normalizedEmail = targetEmail;

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

    const [localPart, domainPart] = normalizedEmail.split("@");
    const maskedLocal = localPart.length > 2
      ? localPart[0] + "***" + localPart[localPart.length - 1]
      : localPart[0] + "***";
    const maskedEmail = `${maskedLocal}@${domainPart}`;

    return NextResponse.json({
      success: true,
      message: `আপনার নিবন্ধিত ইমেইল (${maskedEmail})-এ ৬-সংখ্যার ভেরিফিকেশন ওটিপি পাঠানো হয়েছে। অনুগ্রহ করে ইনবক্স চেক করুন।`,
      email: normalizedEmail,
      maskedEmail,
    });
  } catch (error: any) {
    console.error("[Forgot-Password] send-otp exception:", error);
    return NextResponse.json(
      { error: "সার্ভারে ত্রুটি হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
