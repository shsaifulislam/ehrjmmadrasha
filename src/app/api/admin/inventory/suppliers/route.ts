import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSuppliers, createSupplier } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const onlyActive = searchParams.get("onlyActive") === "true";
    const search = searchParams.get("search") || undefined;

    const suppliers = await getSuppliers({ onlyActive, search });
    return NextResponse.json({ success: true, suppliers });
  } catch (error: any) {
    console.error("Get suppliers error:", error);
    return NextResponse.json(
      { error: error.message || "সরবরাহকারী তালিকা লোড করা সম্ভব হয়নি।" },
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
    const { name, contactPerson, phone, altPhone, email, address, taxNumber, notes } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "সরবরাহকারী প্রতিষ্ঠানের নাম ও ফোন নম্বর আবশ্যক।" },
        { status: 400 }
      );
    }

    const supplier = await createSupplier(
      { name, contactPerson, phone, altPhone, email, address, taxNumber, notes },
      user.userId
    );

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    console.error("Create supplier error:", error);
    return NextResponse.json(
      { error: error.message || "সরবরাহকারী যুক্ত করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
