import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, setAuthCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp, recordAuditLog } from "@/lib/security";
import { sendInstitutionalEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Rate limiting: 5 registration attempts per 10 minutes per IP
    const rateLimit = checkRateLimit(`register:${ip}`, 5, 600000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "খুব বেশি চেষ্টার কারণে সাময়িকভাবে স্থগিত। কিছুক্ষণ পর আবার চেষ্টা করুন।" },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, phone, password, role = "GUARDIAN" } = body;

    // 1. Validations
    const trimmedName = String(name || "").trim();
    const rawEmail = String(email || "").trim().toLowerCase();
    const rawPhone = String(phone || "").trim();
    const rawPassword = String(password || "");

    if (!trimmedName) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে আপনার পূর্ণ নাম প্রদান করুন।" },
        { status: 400 }
      );
    }

    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে একটি সঠিক ও সক্রিয় ইমেইল (Gmail) ঠিকানা প্রদান করুন।" },
        { status: 400 }
      );
    }

    const digitsOnly = rawPhone.replace(/\D/g, "");
    const normalizedPhone =
      digitsOnly.length === 11
        ? digitsOnly
        : digitsOnly.startsWith("880") && digitsOnly.length === 13
        ? digitsOnly.slice(2)
        : digitsOnly;

    if (!normalizedPhone || normalizedPhone.length !== 11 || !normalizedPhone.startsWith("01")) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে ১১ ডিজিটের সঠিক বাংলাদেশী মোবাইল নম্বর প্রদান করুন (যেমন: 018XXXXXXXX)।" },
        { status: 400 }
      );
    }

    if (!rawPassword || rawPassword.length < 6) {
      return NextResponse.json(
        { error: "পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।" },
        { status: 400 }
      );
    }

    const assignedRole = role === "STUDENT" ? "GUARDIAN" : "GUARDIAN"; // Guardians/Students operate through the student-guardian portal

    // 2. Check for existing user by email or phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: rawEmail },
          { phone: normalizedPhone },
          { phone: rawPhone },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "এই ইমেইল অথবা মোবাইল নম্বর দিয়ে ইতিপূর্বে একটি অ্যাকাউন্ট খোলা হয়েছে। অনুগ্রহ করে লগইন করুন অথবা পাসওয়ার্ড পুনরুদ্ধার করুন।",
        },
        { status: 409 }
      );
    }

    // 3. Unique Username generation
    const prefix = role === "STUDENT" ? "std" : "guard";
    let baseUsername = `${prefix}_${normalizedPhone.slice(-8)}`;
    let finalUsername = baseUsername;
    let counter = 1;

    while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
      finalUsername = `${baseUsername}_${counter}`;
      counter++;
    }

    // 4. Hash password
    const passwordHash = await hashPassword(rawPassword);

    // 5. Atomic Creation
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: trimmedName,
          username: finalUsername,
          email: rawEmail,
          phone: normalizedPhone,
          passwordHash,
          role: assignedRole,
          status: "ACTIVE",
        },
      });

      // Secure Profile Creation:
      // Create a dedicated Guardian record bound to this new user identity.
      // Pre-existing institutional guardian records without userId are NOT silently hijacked.
      await tx.guardian.create({
        data: {
          userId: user.id,
          fullNameBn: trimmedName,
          phone: normalizedPhone,
          email: rawEmail,
          relation: role === "STUDENT" ? "OTHER" : "FATHER",
        },
      });

      return user;
    });

    // 6. Automatically establish authenticated session
    const token = await createSessionToken(
      {
        userId: newUser.id,
        username: newUser.username,
        role: newUser.role,
        email: newUser.email,
        name: newUser.name,
      },
      { ipAddress: ip, userAgent }
    );

    await setAuthCookie(token);

    // 7. Audit Log & Welcome Email
    await recordAuditLog({
      userId: newUser.id,
      action: "USER_REGISTER",
      entityType: "User",
      entityId: newUser.id,
      ipAddress: ip,
      details: { role: newUser.role, email: newUser.email, phone: newUser.phone },
    });

    // Send Welcome Email non-blocking
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0D5C3A; color: #ffffff; padding: 24px; text-align: center; border-bottom: 4px solid #C59B27;">
          <h2 style="margin: 0; font-size: 20px;">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #fef08a;">অ্যাকাউন্ট নিবন্ধন সফল হয়েছে</p>
        </div>
        <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
          <p style="font-size: 15px; margin-top: 0;">মুহতারাম <strong>${trimmedName}</strong>, আসসালামু আলাইকুম।</p>
          <p>ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার অনলাইন পোর্টালে আপনার অ্যাকাউন্ট সফলভাবে সক্রিয় করা হয়েছে। এখন থেকে আপনি আপনার এই অ্যাকাউন্টে লগইন করে নতুন ভর্তির আবেদন, ফলাফল ও যাবতীয় তথ্য পর্যবেক্ষণ করতে পারবেন।</p>
          
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 6px; font-weight: bold; color: #065f46;">আপনার অ্যাকাউন্ট পরিচিতি:</p>
            <p style="margin: 3px 0; font-size: 13px;">নাম: <strong>${trimmedName}</strong></p>
            <p style="margin: 3px 0; font-size: 13px;">ইউজার আইডি / মোবাইল: <strong>${rawPhone}</strong></p>
            <p style="margin: 3px 0; font-size: 13px;">ইমেইল: <strong>${rawEmail}</strong></p>
            <p style="margin: 3px 0; font-size: 13px;">অ্যাকাউন্টের ধরন: <strong>${role === "STUDENT" ? "শিক্ষার্থী" : "অভিভাবক"}</strong></p>
          </div>

          <p style="font-size: 13px; color: #475569;">
            জরুরি যোগাযোগ: <strong>01845-162664</strong> | ইমেইল: <strong>ehrjmadrasha@gmail.com</strong>
          </p>
        </div>
        <div style="background-color: #f1f5f9; padding: 12px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা
        </div>
      </div>
    `;

    sendInstitutionalEmail({
      to: rawEmail,
      subject: `অ্যাকাউন্ট নিবন্ধন সফল হয়েছে | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা`,
      html: welcomeHtml,
    }).catch((e) => console.error("Welcome email error:", e));

    return NextResponse.json({
      success: true,
      message: "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। স্বয়ংক্রিয়ভাবে প্রবেশ করানো হচ্ছে...",
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: "অ্যাকাউন্ট তৈরিতে সাময়িক সমস্যা হয়েছে। কিছুক্ষণ পর পুনরায় চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
