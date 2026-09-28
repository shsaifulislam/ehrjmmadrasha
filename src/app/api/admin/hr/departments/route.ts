import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDepartments, createDepartment } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const isActiveParam = searchParams.get("isActive");
    const isActive = isActiveParam !== null ? isActiveParam === "true" : undefined;

    const departments = await getDepartments({ isActive });
    return NextResponse.json({ success: true, departments });
  } catch (error: any) {
    console.error("Get HR departments error:", error);
    return NextResponse.json(
      { error: error.message || "বিভাগ তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন দপ্তর তৈরি করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { nameBn, nameEn, description, sortOrder } = body;

    if (!nameBn || !nameEn) {
      return NextResponse.json({ error: "বিভাগের বাংলা ও ইংরেজি নাম আবশ্যক।" }, { status: 400 });
    }

    const department = await createDepartment({
      nameBn,
      nameEn,
      description,
      sortOrder: sortOrder ? Number(sortOrder) : 0,
      recordedByUserId: user.userId,
    });

    return NextResponse.json({ success: true, department }, { status: 201 });
  } catch (error: any) {
    console.error("Create HR department error:", error);
    return NextResponse.json(
      { error: error.message || "দপ্তর তৈরি ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
