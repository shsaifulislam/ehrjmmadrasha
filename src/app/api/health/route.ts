import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/operationsEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await getSystemHealth("PUBLIC");
    const statusCode = health.status === "DOWN" ? 503 : 200;
    return NextResponse.json(health, { status: statusCode });
  } catch (error: any) {
    return NextResponse.json(
      { status: "DOWN", error: "সিস্টেম স্বাস্থ্য পরীক্ষা করতে ব্যর্থ।" },
      { status: 503 }
    );
  }
}
