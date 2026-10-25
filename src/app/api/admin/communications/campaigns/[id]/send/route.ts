import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { executeCampaign, sendTestMessage } from "@/lib/communications";

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const body = await req.json().catch(() => ({}));
    const { dryRun, testSend, adminEmail, adminName, actorId } = body;

    // Handle test send
    if (testSend) {
      if (!adminEmail) {
        return NextResponse.json(
          { success: false, error: "Admin email is required for test send." },
          { status: 400 }
        );
      }
      const testResult = await sendTestMessage(params.id, {
        id: actorId || "ADMIN",
        name: adminName || "অ্যাডমিনিস্ট্রেটর",
        email: adminEmail,
      });
      return NextResponse.json(testResult);
    }

    // Handle execution (live or dry-run)
    const result = await executeCampaign(params.id, {
      dryRun: !!dryRun,
      actorId: actorId || "ADMIN",
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}
