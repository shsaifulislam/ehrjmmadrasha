import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getTransportDrivers, createTransportDriver } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    let drivers = await getTransportDrivers();
    if (status) {
      drivers = drivers.filter((d: any) => d.status === status);
    }
    return NextResponse.json({ success: true, drivers });
  } catch (error: any) {
    console.error("Get transport drivers error:", error);
    return NextResponse.json(
      { error: error.message || "চালকদের তালিকা লোড করা সম্ভব হয়নি।" },
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
    const { fullName, phone, address, licenseNumber, licenseExpiry, emergencyContact, notes } = body;

    if (!fullName || !phone || !licenseNumber || !licenseExpiry) {
      return NextResponse.json(
        { error: "চালকের পূর্ণ নাম, মোবাইল নম্বর, ড্রাইভিং লাইসেন্স নম্বর ও মেয়াদ আবশ্যক।" },
        { status: 400 }
      );
    }

    const driver = await createTransportDriver({
      name: fullName,
      phone,
      address,
      licenseNumber,
      licenseExpiry: new Date(licenseExpiry),
      emergencyContact,
      notes,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, driver });
  } catch (error: any) {
    console.error("Create transport driver error:", error);
    return NextResponse.json(
      { error: error.message || "চালক তৈরি করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
