import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPurchaseRequests, createPurchaseRequest } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;

    const requests = await getPurchaseRequests({ status, priority });
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("Get purchase requests error:", error);
    return NextResponse.json(
      { error: error.message || "ক্রয় আবেদন তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { title, purpose, priority, requiredDate, items, adminNotes } = body;

    if (!title || !purpose || !items || items.length === 0) {
      return NextResponse.json(
        { error: "আবেদনের শিরোনাম, উদ্দেশ্য ও আইটেম তালিকা প্রদান আবশ্যক।" },
        { status: 400 }
      );
    }

    const request = await createPurchaseRequest(
      {
        title,
        purpose,
        priority,
        requiredDate: requiredDate ? new Date(requiredDate) : undefined,
        items,
        adminNotes,
      },
      user.userId
    );

    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    console.error("Create purchase request error:", error);
    return NextResponse.json(
      { error: error.message || "ক্রয় আবেদন দাখিল করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
