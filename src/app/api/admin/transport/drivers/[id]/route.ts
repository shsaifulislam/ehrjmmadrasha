import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateTransportDriver } from "@/lib/transportEngine";

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
    const { fullName, phone, address, licenseNumber, licenseExpiry, emergencyContact, status, notes } = body;

    const driver = await updateTransportDriver(
      id,
      {
        name: fullName,
        phone,
        address,
        licenseNumber,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
        emergencyContact,
        status,
        notes,
      },
      user.userId
    );

    return NextResponse.json({ success: true, driver });
  } catch (error: any) {
    console.error("Update transport driver error:", error);
    return NextResponse.json(
      { error: error.message || "চালকের তথ্য আপডেট করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
