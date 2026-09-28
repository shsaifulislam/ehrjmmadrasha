import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { commitStudentImportBatch } from "@/lib/importValidator";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন ব্যাচ ইমপোর্ট কমিট করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const rows = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "কমিট করার জন্য ডেটা প্রদান আবশ্যক।" }, { status: 400 });
    }

    const result = await commitStudentImportBatch(rows, user.userId);

    return NextResponse.json({
      success: true,
      messageBn: result.messageBn,
      insertedCount: result.insertedCount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ইমপোর্ট কমিট করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
