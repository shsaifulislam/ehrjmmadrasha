import { NextRequest, NextResponse } from "next/server";
import { verifyEmployeePublicToken } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    if (!token) {
      return NextResponse.json({ error: "ভেরিফিকেশন টোকেন আবশ্যক।" }, { status: 400 });
    }

    const result = await verifyEmployeePublicToken(token);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Public employee verification error:", error);
    return NextResponse.json(
      { error: "যাচাইকরণ প্রক্রিয়া সম্পন্ন করা যায়নি।" },
      { status: 500 }
    );
  }
}
