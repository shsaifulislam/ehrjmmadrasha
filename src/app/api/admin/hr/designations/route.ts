import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDesignations, createDesignation } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId") || undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive = isActiveParam !== null ? isActiveParam === "true" : undefined;

    const designations = await getDesignations({ departmentId, isActive });
    return NextResponse.json({ success: true, designations });
  } catch (error: any) {
    console.error("Get HR designations error:", error);
    return NextResponse.json(
      { error: error.message || "পদবি তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন পদবি তৈরি করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { nameBn, nameEn, departmentId, description, sortOrder } = body;

    if (!nameBn || !nameEn) {
      return NextResponse.json({ error: "পদবির বাংলা ও ইংরেজি নাম আবশ্যক।" }, { status: 400 });
    }

    const designation = await createDesignation({
      nameBn,
      nameEn,
      departmentId,
      description,
      sortOrder: sortOrder ? Number(sortOrder) : 0,
      recordedByUserId: user.userId,
    });

    return NextResponse.json({ success: true, designation }, { status: 201 });
  } catch (error: any) {
    console.error("Create HR designation error:", error);
    return NextResponse.json(
      { error: error.message || "পদবি তৈরি ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
