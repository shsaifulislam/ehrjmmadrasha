import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getHelpdeskCategories, createHelpdeskCategory } from "@/lib/helpdeskEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const categories = await getHelpdeskCategories(includeInactive);
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error("Helpdesk Categories GET error:", error);
    return NextResponse.json(
      { error: error.message || "ক্যাটাগরি লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "শুধুমাত্র অ্যাডমিনের জন্য অনুমোদিত।" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.code || !body.nameBn) {
      return NextResponse.json({ error: "ক্যাটাগরি কোড ও বাংলা নাম আবশ্যক।" }, { status: 400 });
    }

    const category = await createHelpdeskCategory({
      code: body.code,
      nameBn: body.nameBn,
      nameEn: body.nameEn,
      description: body.description,
      slaHours: body.slaHours ? Number(body.slaHours) : undefined,
      icon: body.icon,
      sortOrder: body.sortOrder ? Number(body.sortOrder) : undefined,
      adminId: user.userId,
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error("Helpdesk Categories POST error:", error);
    return NextResponse.json(
      { error: error.message || "ক্যাটাগরি তৈরি ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
