import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getCmsFaqs, saveCmsFaq } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const faqs = getCmsFaqs(false);
    return NextResponse.json({ success: true, faqs });
  } catch (error) {
    console.error("Admin FAQs GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch FAQs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

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

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "FAQ ID is required" }, { status: 400 });
    }

    const { toggleFaqApproval } = await import("@/lib/cms");
    const updated = toggleFaqApproval(id, "ADMIN");
    if (!updated) {
      return NextResponse.json({ success: false, error: "FAQ পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      messageBn: `FAQ স্ট্যাটাস পরিবর্তন করা হয়েছে (${updated.isApproved ? "অনুমোদিত" : "খসড়া"})।`,
      faq: updated,
    });
  } catch (error: any) {
    console.error("Admin FAQs PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to toggle FAQ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "FAQ ID is required" }, { status: 400 });
    }

    const { deleteCmsFaq } = await import("@/lib/cms");
    const deleted = deleteCmsFaq(id, "ADMIN");
    return NextResponse.json({
      success: deleted,
      messageBn: deleted ? "FAQ সফলভাবে মুছে ফেলা হয়েছে।" : "FAQ খুঁজে পাওয়া যায়নি।",
    });
  } catch (error: any) {
    console.error("Admin FAQs DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete FAQ" }, { status: 500 });
  }
}

