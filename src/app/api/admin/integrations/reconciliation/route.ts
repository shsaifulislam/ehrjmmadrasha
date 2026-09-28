import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  loadReconciliationRecords,
  runPaymentReconciliation,
} from "@/lib/integration";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const records = loadReconciliationRecords();
    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load reconciliation records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "কেবলমাত্র অ্যাডমিন রিকনসিলিয়েশন রান করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { provider = "BKASH", statementRows } = body;

    if (!statementRows || !Array.isArray(statementRows) || statementRows.length === 0) {
      return NextResponse.json({ error: "স্টেটমেন্ট ডেটা আবশ্যক।" }, { status: 400 });
    }

    const result = await runPaymentReconciliation(provider, statementRows, user.userId);
    return NextResponse.json({
      success: true,
      message: `রিকনসিলিয়েশন সম্পন্ন: ${result.matchedCount} টি মিলেছে, ${result.unmatchedCount} টি অমিল, ${result.conflictCount} টি কনফ্লিক্ট।`,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "রিকনসিলিয়েশন ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
