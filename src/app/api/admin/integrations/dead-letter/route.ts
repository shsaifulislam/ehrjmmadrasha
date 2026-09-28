import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  loadDeadLetterQueue,
  replayDeadLetterItem,
  discardDeadLetterItem,
} from "@/lib/integration";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const items = loadDeadLetterQueue();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load DLQ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "কেবলমাত্র অ্যাডমিন ডেড-লেটার কিউ আইটেম রিট্রাই করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, action = "REPLAY", reason } = body;

    if (!id) {
      return NextResponse.json({ error: "DLQ আইটেম আইডি আবশ্যক।" }, { status: 400 });
    }

    if (action === "REPLAY") {
      const result = await replayDeadLetterItem(id, user.userId);
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.dlqItem,
      });
    } else if (action === "DISCARD") {
      const result = await discardDeadLetterItem(id, user.userId, reason || "Admin discarded");
      return NextResponse.json({
        success: true,
        message: "আইটেমটি সফলভাবে ডিসকার্ড করা হয়েছে।",
        data: result,
      });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন।" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "DLQ অপারেশন ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
