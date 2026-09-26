import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        teacherAssignments: {
          include: {
            subject: true,
            section: { include: { jamatClass: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, teachers });
  } catch (error: any) {
    console.error("Admin Teachers GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { name, email, phone, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "নাম, ইমেইল ও পাসওয়ার্ড প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: email }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "এই ইমেইল ঠিকানায় ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে।" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const teacher = await prisma.user.create({
      data: {
        name,
        username: email.split("@")[0] + "_" + Math.floor(1000 + Math.random() * 9000),
        email,
        phone: phone || null,
        passwordHash,
        role: "TEACHER",
        status: "ACTIVE",
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "CREATE_TEACHER",
      entityType: "User",
      entityId: teacher.id,
      details: { name, email },
    });

    return NextResponse.json({
      success: true,
      message: "উস্তাদ/শিক্ষকের নতুন অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।",
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        role: teacher.role,
      },
    });
  } catch (error: any) {
    console.error("Admin Teachers POST Error:", error);
    return NextResponse.json({ error: "শিক্ষক অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
