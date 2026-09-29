import { NextResponse } from "next/server";
import { getCmsFaqs } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const faqs = getCmsFaqs(true);
    return NextResponse.json({
      success: true,
      faqs,
    });
  } catch (error) {
    console.error("Public FAQs API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load FAQs" },
      { status: 500 }
    );
  }
}
