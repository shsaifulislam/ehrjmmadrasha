import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, setAuthCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp, recordAuditLog } from "@/lib/security";

function normalizeLoginIdentifier(identifier: string): string {
  const normalized = identifier.trim().toLowerCase();
  if (normalized.includes("@")) return normalized;

  const banglaDigits: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };
  const digits = normalized
    .replace(/[০-৯]/g, (digit) => banglaDigits[digit] || digit)
    .replace(/\D/g, "");
  if (digits.length >= 8) {
    return `phone:${digits.startsWith("880") ? `0${digits.slice(3)}` : digits}`;
  }

  return `username:${normalized.replace(/\s+/g, "")}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Brute-force rate limiting: 10 attempts per minute per IP
    const rateLimit = checkRateLimit(`login:${ip}`, 10, 60000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "খুব বেশি চেষ্টা করা হয়েছে। অনুগ্রহ করে ১ মিনিট পর আবার চেষ্টা করুন।" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { identifier, password, role, panel } = body;

    const rawIdentifier = String(identifier || "").trim();
    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { error: "ইমেইল/ইউজারনেম এবং পাসওয়ার্ড পূরণ করা আবশ্যক।" },
        { status: 400 }
      );
    }

    // Optional email format check if an email is provided
    if (rawIdentifier.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawIdentifier)) {
        return NextResponse.json(
          { error: "অনুগ্রহ করে সঠিক ইমেইল ঠিকানা প্রদান করুন।" },
          { status: 400 }
        );
      }
    }

    const accountHash = createHash("sha256")
      .update(normalizeLoginIdentifier(rawIdentifier))
      .digest("hex");
    const accountRateLimit = checkRateLimit(`login:account:${accountHash}`, 20, 15 * 60 * 1000);
    if (!accountRateLimit.allowed) {
      return NextResponse.json(
        { error: "এই অ্যাকাউন্টের জন্য অতিরিক্ত লগইন চেষ্টা হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।" },
        { status: 429 }
      );
    }

    // Account lockout check (brute force protection per identifier + IP)
    const { checkAccountLockout, handleFailedLoginAttempt, clearFailedLoginAttempts, recordSecurityEvent } = await import("@/lib/securityEngine");
    const lockout = checkAccountLockout(rawIdentifier, ip);
    if (lockout.isLocked) {
      return NextResponse.json(
        {
          error: `অতিরিক্ত ভুল চেষ্টার কারণে সাময়িকভাবে লগইন স্থগিত রয়েছে। অনুগ্রহ করে ${lockout.remainingMinutes || 15} মিনিট পর চেষ্টা করুন।`,
        },
        { status: 423 }
      );
    }

    const searchEmail = rawIdentifier.toLowerCase();

    // Comprehensive phone normalization (Bengali digits, symbols, prefixes)
    const banglaDigits: Record<string, string> = {
      "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
      "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9"
    };
    const cleanPhoneDigits = rawIdentifier
      .replace(/[০-৯]/g, (d) => banglaDigits[d] || d)
      .replace(/[\s\-\(\)\.]/g, "");

    const phoneVariants = new Set<string>();
    if (cleanPhoneDigits.length >= 8) {
      phoneVariants.add(cleanPhoneDigits);
      if (cleanPhoneDigits.startsWith("+880")) {
        phoneVariants.add("0" + cleanPhoneDigits.slice(4));
        phoneVariants.add(cleanPhoneDigits.slice(4));
        phoneVariants.add(cleanPhoneDigits.slice(1));
      } else if (cleanPhoneDigits.startsWith("880")) {
        phoneVariants.add("0" + cleanPhoneDigits.slice(3));
        phoneVariants.add(cleanPhoneDigits.slice(3));
        phoneVariants.add("+" + cleanPhoneDigits);
      } else if (cleanPhoneDigits.startsWith("01")) {
        phoneVariants.add("+88" + cleanPhoneDigits);
        phoneVariants.add("88" + cleanPhoneDigits);
        phoneVariants.add(cleanPhoneDigits.slice(1));
      }
    }

    const phoneVariantsList = Array.from(phoneVariants);

    const searchConditions: any[] = [
      { email: searchEmail },
      { username: rawIdentifier },
      { phone: rawIdentifier },
    ];

    for (let i = 0; i < phoneVariantsList.length; i++) {
      const variant = phoneVariantsList[i];
      searchConditions.push({ phone: variant });
      searchConditions.push({ username: variant });
    }

    // Find user by email, username, or phone
    let user = await prisma.user.findFirst({
      where: {
        OR: searchConditions,
      },
    });

    // Fallback: If not found in User table, check if phone/email belongs to a Guardian profile linked to a User
    if (!user && (phoneVariantsList.length > 0 || searchEmail.includes("@"))) {
      const guardianConditions: any[] = [];
      if (searchEmail.includes("@")) {
        guardianConditions.push({ email: searchEmail });
      }
      for (let i = 0; i < phoneVariantsList.length; i++) {
        guardianConditions.push({ phone: phoneVariantsList[i] });
      }

      const guardian = await prisma.guardian.findFirst({
        where: {
          OR: guardianConditions,
        },
        select: { userId: true },
      });

      if (guardian?.userId) {
        user = await prisma.user.findUnique({
          where: { id: guardian.userId },
        });
      }
    }

    if (!user) {
      // Record failed attempt for non-existent users to equalize timing and eliminate account enumeration
      const failedResult = await handleFailedLoginAttempt(rawIdentifier, ip, userAgent);

      await recordSecurityEvent({
        eventType: "LOGIN_FAILURE",
        severity: failedResult.isLocked ? "CRITICAL" : "LOW",
        ipAddress: ip,
        userAgent,
        details: { targetIdentifier: rawIdentifier, reason: "UNKNOWN_USER" },
      });

      if (failedResult.isLocked) {
        return NextResponse.json(
          { error: "অতিরিক্ত ভুল চেষ্টার কারণে সাময়িকভাবে লগইন স্থগিত রয়েছে। অনুগ্রহ করে ১৫ মিনিট পর চেষ্টা করুন।" },
          { status: 423 }
        );
      }

      return NextResponse.json(
        { error: "ভুল ইমেইল/মোবাইল নম্বর অথবা পাসওয়ার্ড! অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।" },
        { status: 401 }
      );
    }

    const userAccountHash = createHash("sha256").update(user.id).digest("hex");
    const userAccountRateLimit = checkRateLimit(
      `login:user:${userAccountHash}`,
      20,
      15 * 60 * 1000
    );
    if (!userAccountRateLimit.allowed) {
      return NextResponse.json(
        { error: "এই অ্যাকাউন্টের জন্য অতিরিক্ত লগইন চেষ্টা হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।" },
        { status: 429 }
      );
    }

    // Enforce ACTIVE status check
    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "আপনার অ্যাকাউন্টটি নিষ্ক্রিয় বা স্থগিত করা হয়েছে। অনুগ্রহ করে মাদরাসা প্রশাসনের সাথে যোগাযোগ করুন।" },
        { status: 403 }
      );
    }

    // Enforce Panel Boundary: Block Guardian & Students from Institutional panel
    if (panel === "INSTITUTIONAL") {
      const allowedRoles = ["ADMIN", "PRINCIPAL", "TEACHER", "STAFF", "SUPER_ADMIN"];
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          {
            error: "অননুমোদিত প্রবেশাধিকার: এই প্যানেলটি শুধুমাত্র মাদরাসা প্রশাসন ও সম্মানিত শিক্ষকদের জন্য সংরক্ষিত। অভিভাবক ও ছাত্রছাত্রীদের আলাদা পোর্টাল ব্যবহার করার জন্য অনুরোধ করা হচ্ছে।",
          },
          { status: 403 }
        );
      }
    }

    // Role check if specific role requested
    if (role && user.role !== role) {
      return NextResponse.json(
        { error: `আপনার অ্যাকাউন্টটি ${role} প্যানেলের জন্য অনুমোদিত নয়।` },
        { status: 403 }
      );
    }

    // Password verification
    let isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress: ip,
          userAgent,
          status: "FAILED",
        },
      });

      const failedResult = await handleFailedLoginAttempt(rawIdentifier, ip, userAgent);

      await recordSecurityEvent({
        eventType: "LOGIN_FAILURE",
        severity: failedResult.isLocked ? "CRITICAL" : "MEDIUM",
        userId: user.id,
        username: user.username,
        ipAddress: ip,
        userAgent,
        details: { attemptsRemaining: failedResult.remainingAttempts },
      });

      if (failedResult.isLocked) {
        return NextResponse.json(
          { error: "অতিরিক্ত ভুল চেষ্টার কারণে সাময়িকভাবে লগইন স্থগিত রয়েছে। অনুগ্রহ করে ১৫ মিনিট পর চেষ্টা করুন।" },
          { status: 423 }
        );
      }

      return NextResponse.json(
        { error: "ভুল ইমেইল/মোবাইল নম্বর অথবা পাসওয়ার্ড! অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।" },
        { status: 401 }
      );
    }

    // Successful login: clear failed attempts
    clearFailedLoginAttempts(rawIdentifier, ip);

    // Create session token and set secure HttpOnly cookie (persisting session in DB)
    const token = await createSessionToken(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      { ipAddress: ip, userAgent }
    );

    await setAuthCookie(token);

    // Record login history, security event, and audit log
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: ip,
        userAgent,
        status: "SUCCESS",
      },
    });

    await recordSecurityEvent({
      eventType: "LOGIN_SUCCESS",
      severity: "INFO",
      userId: user.id,
      username: user.username,
      ipAddress: ip,
      userAgent,
      details: { role: user.role },
    });

    await recordAuditLog({
      userId: user.id,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      ipAddress: ip,
      details: { role: user.role },
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
