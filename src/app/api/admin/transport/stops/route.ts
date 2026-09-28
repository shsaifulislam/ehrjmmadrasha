import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createTransportStop } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { routeId, stopName, address, sequenceOrder, pickupTime, dropTime, notes } = body;

    if (!routeId || !stopName || sequenceOrder === undefined) {
      return NextResponse.json(
        { error: "রুট আইডি, স্টপের নাম এবং ক্রমিক নম্বর দেওয়া আবশ্যক।" },
        { status: 400 }
      );
    }

    const stop = await createTransportStop({
      routeId,
      stopName,
      address,
      sequenceOrder: Number(sequenceOrder),
      pickupTime,
      dropTime,
      notes,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, stop });
  } catch (error: any) {
    console.error("Create stop error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
