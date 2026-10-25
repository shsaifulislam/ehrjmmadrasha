import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { restoreDatabase } from "@/lib/operationsEngine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত: শুধুমাত্র অ্যাডমিন ডেটাবেস পুনরুদ্ধার করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.confirmation || body.confirmation !== "RESTORE PRODUCTION DATABASE") {
      return NextResponse.json(
        {
          error:
            "নিরাপত্তা যাচাই ব্যর্থ: নিশ্চিতকরণ বক্সে হুবহু 'RESTORE PRODUCTION DATABASE' লিখতে হবে।",
        },
        { status: 400 }
      );
    }

    if (!body.reason || body.reason.trim().length < 5) {
      return NextResponse.json(
        { error: "ডেটাবেস পুনরুদ্ধারের জন্য উপযুক্ত কারণ প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await restoreDatabase({
      backupId: params.id,
      confirmation: body.confirmation,
      reason: body.reason,
      initiatedById: user.userId,
    });

    return NextResponse.json({ success: true, restore: result });
  } catch (error: any) {
    console.error("Database Restore Error:", error);
    return NextResponse.json(
      { error: error.message || "ডেটাবেস পুনরুদ্ধার করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
