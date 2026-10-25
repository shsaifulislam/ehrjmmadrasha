import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateTransportVehicle } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { vehicleNumber, vehicleType, model, capacity, driverId, status, notes } = body;

    const vehicle = await updateTransportVehicle(
      id,
      {
        vehicleNumber,
        vehicleType,
        model,
        capacity: capacity !== undefined ? Number(capacity) : undefined,
        driverId,
        status,
        notes,
      },
      user.userId
    );

    return NextResponse.json({ success: true, vehicle });
  } catch (error: any) {
    console.error("Update transport vehicle error:", error);
    return NextResponse.json(
      { error: error.message || "যানবাহন আপডেট করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
