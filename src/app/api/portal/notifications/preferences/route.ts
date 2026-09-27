import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NOTIFICATION_CATEGORIES = [
  { code: "OFFICIAL_NOTICE", nameBn: "মাদরাসা নোটিশ ও ঘোষণা", configurable: true },
  { code: "ACADEMIC", nameBn: "একাডেমিক ও রুটিন বার্তা", configurable: true },
  { code: "ATTENDANCE", nameBn: "উপস্থিতি ও অনুপস্থিতি বার্তা", configurable: true },
  { code: "EXAM", nameBn: "পরীক্ষা ও ফলাফল বিজ্ঞপ্তি", configurable: true },
  { code: "FINANCE", nameBn: "ফি ও পেমেন্ট রসিদ", configurable: false }, // Mandatory
  { code: "DOCUMENT", nameBn: "সনদপত্র ও ডকুমেন্টস", configurable: true },
  { code: "SYSTEM", nameBn: "নিরাপত্তা ও পাসওয়ার্ড সতর্কবার্তা", configurable: false }, // Mandatory
];

/**
 * Get and update User Notification Preferences
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const saved = await prisma.notificationPreference.findMany({
      where: { userId: user.userId },
    });

    const savedMap = new Map(saved.map((s) => [s.category, s]));

    const preferences = NOTIFICATION_CATEGORIES.map((cat) => {
      const pref = savedMap.get(cat.code);
      return {
        category: cat.code,
        nameBn: cat.nameBn,
        configurable: cat.configurable,
        portalEnabled: pref ? pref.portalEnabled : true,
        emailEnabled: pref ? pref.emailEnabled : true,
      };
    });

    return NextResponse.json({ success: true, preferences, data: preferences });
  } catch (error: any) {
    console.error("Preferences GET Error:", error);
    return NextResponse.json({ error: "পছন্দসমূহ লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const body = await req.json();
    const { category, portalEnabled, emailEnabled } = body;

    const catDef = NOTIFICATION_CATEGORIES.find((c) => c.code === category);
    if (!catDef) {
      return NextResponse.json({ error: "অবৈধ নোটিফিকেশন ক্যাটাগরি।" }, { status: 400 });
    }

    if (!catDef.configurable) {
      return NextResponse.json(
        { error: "এই ক্যাটাগরির নোটিফিকেশন প্রাতিষ্ঠানিক নীতি অনুযায়ী বাধ্যতামূলক এবং পরিবর্তনযোগ্য নয়।" },
        { status: 400 }
      );
    }

    const updated = await prisma.notificationPreference.upsert({
      where: {
        userId_category: {
          userId: user.userId,
          category,
        },
      },
      update: {
        portalEnabled: Boolean(portalEnabled),
        emailEnabled: Boolean(emailEnabled),
      },
      create: {
        userId: user.userId,
        category,
        portalEnabled: Boolean(portalEnabled),
        emailEnabled: Boolean(emailEnabled),
      },
    });

    return NextResponse.json({
      success: true,
      message: "নোটিফিকেশন পছন্দ সফলভাবে সংরক্ষিত হয়েছে।",
      preference: updated,
      data: updated,
    });
  } catch (error: any) {
    console.error("Preferences POST Error:", error);
    return NextResponse.json({ error: "পছন্দ সংরক্ষণে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export const PUT = POST;
