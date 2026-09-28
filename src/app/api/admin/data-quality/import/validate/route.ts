import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { validateStudentImportBatch } from "@/lib/importValidator";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const rows = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "কমপক্ষে একটি সারি (row) ডেটা প্রদান আবশ্যক।" }, { status: 400 });
    }

    const validation = await validateStudentImportBatch(rows);

    return NextResponse.json({
      success: true,
      data: validation
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ভ্যালিডেশনে ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}
