import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, setAuthCookie } from "@/lib/auth";
import { checkRateLimit, recordAuditLog } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Brute-force rate limiting: 5 attempts per minute per IP
    const rateLimit = checkRateLimit(`login:${ip}`, 7, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "খুব বেশি চেষ্টা করা হয়েছে। অনুগ্রহ করে ১ মিনিট পর আবার চেষ্টা করুন।" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { identifier, password, role } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "ইমেইল/ইউজারনেম এবং পাসওয়ার্ড পূরণ করা আবশ্যক।" },
        { status: 400 }
      );
    }

    // Find user by email, username, or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
          { phone: identifier },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "প্রদত্ত তথ্যের সাথে কোনো সক্রিয় অ্যাকাউন্ট পাওয়া যায়নি।" },
        { status: 401 }
      );
    }

    // Role check if provided
    if (role && user.role !== role) {
      return NextResponse.json(
        { error: `আপনার অ্যাকাউন্টটি ${role} প্যানেলের জন্য অনুমোদিত নয়।` },
        { status: 403 }
      );
    }

    // Password verification
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress: ip,
          userAgent,
          status: "FAILED",
        },
      });

      return NextResponse.json(
        { error: "ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।" },
        { status: 401 }
      );
    }

    // Create session token and set secure HttpOnly cookie
    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    await setAuthCookie(token);

    // Record login history and audit log
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: ip,
        userAgent,
        status: "SUCCESS",
      },
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
