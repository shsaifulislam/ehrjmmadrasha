import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { verifyDatabaseBackup } from "@/lib/operationsEngine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত: শুধুমাত্র অ্যাডমিন ব্যাকআপ যাচাই করতে পারেন।" },
        { status: 403 }
      );
    }

    const verified = await verifyDatabaseBackup(params.id, user.userId);
    return NextResponse.json({ success: true, backup: verified });
  } catch (error: any) {
    console.error("Backup Verify Error:", error);
    return NextResponse.json(
      { error: error.message || "ব্যাকআপ যাচাই ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
