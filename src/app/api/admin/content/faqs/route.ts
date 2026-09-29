import { NextRequest, NextResponse } from "next/server";
import { getCmsFaqs, saveCmsFaq } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const faqs = getCmsFaqs(false);
    return NextResponse.json({ success: true, faqs });
  } catch (error) {
    console.error("Admin FAQs GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch FAQs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const faq = saveCmsFaq(body, "ADMIN");
    return NextResponse.json({
      success: true,
      messageBn: "প্রশ্নোত্তর সফলভাবে সংরক্ষিত হয়েছে।",
      faq,
    });
  } catch (error: any) {
    console.error("Admin FAQs POST Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to save FAQ" }, { status: 500 });
  }
}
