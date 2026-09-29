import { NextRequest, NextResponse } from "next/server";
import { getCmsGallery, saveCmsGalleryItem } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const gallery = getCmsGallery(false);
    return NextResponse.json({ success: true, gallery });
  } catch (error) {
    console.error("Admin Gallery GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch gallery" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Security & Privacy Guard: Public gallery items must have consent verification
    if (body.isPublic && !body.consentVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "শিক্ষার্থী ও ক্যাম্পাসের ছবি প্রকাশ্যে প্রচারের জন্য অভিভাবক/কর্তৃপক্ষের সম্মতি যাচাই (Consent Verification) বাধ্যতামূলক।",
        },
        { status: 400 }
      );
    }

    const item = saveCmsGalleryItem(body, "ADMIN");
    return NextResponse.json({
      success: true,
      messageBn: "গ্যালারি ছবি সফলভাবে সংরক্ষিত হয়েছে।",
      item,
    });
  } catch (error: any) {
    console.error("Admin Gallery POST Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to save gallery item" }, { status: 500 });
  }
}
