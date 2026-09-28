import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getInventoryLocations, createInventoryLocation } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const onlyActive = searchParams.get("onlyActive") === "true";

    const locations = await getInventoryLocations({ onlyActive });
    return NextResponse.json({ success: true, locations });
  } catch (error: any) {
    console.error("Get locations error:", error);
    return NextResponse.json(
      { error: error.message || "লোকেশন তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { code, nameBn, nameEn, description } = body;

    if (!code || !nameBn) {
      return NextResponse.json(
        { error: "লোকেশন কোড ও বাংলা নাম প্রদান আবশ্যক।" },
        { status: 400 }
      );
    }

    const location = await createInventoryLocation(
      { code, nameBn, nameEn, description },
      user.userId
    );

    return NextResponse.json({ success: true, location });
  } catch (error: any) {
    console.error("Create location error:", error);
    return NextResponse.json(
      { error: error.message || "লোকেশন তৈরি করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
