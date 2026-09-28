import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getTransportVehicles, createTransportVehicle } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    let vehicles = await getTransportVehicles();
    if (status) {
      vehicles = vehicles.filter((v: any) => v.status === status);
    }
    return NextResponse.json({ success: true, vehicles });
  } catch (error: any) {
    console.error("Get transport vehicles error:", error);
    return NextResponse.json(
      { error: error.message || "যানবাহনের তালিকা লোড করা সম্ভব হয়নি।" },
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
    const { vehicleNumber, vehicleType, model, capacity, driverId, notes } = body;

    if (!vehicleNumber || !capacity) {
      return NextResponse.json(
        { error: "যানবাহন নম্বর ও ধারণক্ষমতা (ক্যাপাসিটি) প্রদান আবশ্যক।" },
        { status: 400 }
      );
    }

    const vehicle = await createTransportVehicle({
      vehicleNumber,
      vehicleType,
      model,
      capacity: Number(capacity),
      driverId,
      notes,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error: any) {
    console.error("Create transport vehicle error:", error);
    return NextResponse.json(
      { error: error.message || "যানবাহন যোগ করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
