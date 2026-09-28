import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { testIntegrationConnection } from "@/lib/integration";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "কেবলমাত্র অ্যাডমিন কানেকশন টেস্ট চালাতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { codeOrId } = body;

    if (!codeOrId) {
      return NextResponse.json(
        { error: "ইন্টিগ্রেশন কোড বা আইডি প্রদান করুন।" },
        { status: 400 }
      );
    }

    const result = await testIntegrationConnection(codeOrId, user.userId);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "কানেকশন টেস্ট ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
