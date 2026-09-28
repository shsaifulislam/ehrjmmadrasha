import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getTransportRoutes, createTransportRoute } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const routes = await getTransportRoutes(includeInactive);
    return NextResponse.json({ success: true, routes });
  } catch (error: any) {
    console.error("Get transport routes error:", error);
    return NextResponse.json(
      { error: error.message || "রুট তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন রুট তৈরি করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { routeName, routeCode, description, direction, startPoint, endPoint, vehicleId, monthlyFee, notes } = body;

    if (!routeName || !routeCode || !startPoint || !endPoint) {
      return NextResponse.json(
        { error: "রুটের নাম, রুট কোড, প্রারম্ভিক স্থান এবং গন্তব্য প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const route = await createTransportRoute({
      routeName,
      routeCode,
      description,
      direction,
      startPoint,
      endPoint,
      vehicleId,
      monthlyFee: monthlyFee ? Number(monthlyFee) : undefined,
      notes,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, route });
  } catch (error: any) {
    console.error("Create transport route error:", error);
    return NextResponse.json(
      { error: error.message || "রুট তৈরি করতে সমস্যা হয়েছে।" },
      { status: 400 }
    );
  }
}
