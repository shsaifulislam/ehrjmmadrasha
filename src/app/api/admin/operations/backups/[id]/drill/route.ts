import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { runRecoveryDrill } from "@/lib/operationsEngine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত: শুধুমাত্র অ্যাডমিন রিকভারি ড্রিল চালাতে পারেন।" },
        { status: 403 }
      );
    }

    const drill = await runRecoveryDrill(params.id, user.userId);
    return NextResponse.json({ success: true, drill });
  } catch (error: any) {
    console.error("Recovery Drill Error:", error);
    return NextResponse.json(
      { error: error.message || "রিকভারি ড্রিল পরিচালনা ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
