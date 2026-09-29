import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { approveBudgetRevision } from "@/lib/budget";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Only Admin can approve budget revisions." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const actor = {
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
    };

    const result = approveBudgetRevision(id, actor, body.approvalReference);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `বাজেট রিভিশন অনুমোদিত হয়েছে এবং সংস্করণ v${result.budget?.currentVersion} এ উন্নীত হয়েছে।`,
      budget: result.budget,
      revision: result.revision,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to approve revision" },
      { status: 500 }
    );
  }
}
