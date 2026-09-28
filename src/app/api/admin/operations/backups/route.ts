import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listDatabaseBackups, createDatabaseBackup, applyBackupRetention } from "@/lib/operationsEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;

    const backups = await listDatabaseBackups({ type, limit });
    return NextResponse.json({ success: true, backups });
  } catch (error: any) {
    console.error("Backups List Error:", error);
    return NextResponse.json(
      { error: error.message || "ব্যাকআপ তালিকা লোড করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত: শুধুমাত্র অ্যাডমিন ব্যাকআপ তৈরি করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const type = body.type || "MANUAL";

    const backup = await createDatabaseBackup(type, user.userId);

    // Apply retention rule automatically
    try {
      await applyBackupRetention({ keepMinimumCount: 5, maxAgeDays: 30 });
    } catch {}

    return NextResponse.json({ success: true, backup }, { status: 201 });
  } catch (error: any) {
    console.error("Backup Create Error:", error);
    return NextResponse.json(
      { error: error.message || "ব্যাকআপ তৈরি করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
