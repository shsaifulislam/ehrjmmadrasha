import { NextRequest, NextResponse } from "next/server";
import { getDonationByReceipt } from "@/lib/donations";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ receiptNumber: string }> }
) {
  try {
    const { receiptNumber } = await params;
    if (!receiptNumber) {
      return NextResponse.json({ success: false, error: "রশিদ নম্বর আবশ্যক।" }, { status: 400 });
    }

    const donation = getDonationByReceipt(receiptNumber);
    if (!donation) {
      return NextResponse.json({ success: false, error: "উক্ত রশিদ নম্বরে কোনো অনুদান পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, donation });
  } catch (error) {
    console.error("Donation receipt error:", error);
    return NextResponse.json({ success: false, error: "রশিদ অনুসন্ধানে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
