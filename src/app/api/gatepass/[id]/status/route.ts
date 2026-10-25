import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { markGateExit, markGateReturn } from "@/lib/gatepass/gatepassEngine";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || !["ADMIN", "TEACHER", "PRINCIPAL"].includes(user.role)) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, securityNotes } = body; // action: 'EXIT' | 'RETURN'

    let updatedPass;
    if (action === "EXIT") {
      updatedPass = await markGateExit(id, securityNotes);
    } else if (action === "RETURN") {
      updatedPass = await markGateReturn(id, securityNotes);
    } else {
      return NextResponse.json({ error: "অবৈধ অ্যাকশন।" }, { status: 400 });
    }

    await recordAuditLog({
      action: action === "EXIT" ? "GATE_EXIT_VERIFIED" : "GATE_RETURN_VERIFIED",
      entityType: "GatePass",
      entityId: updatedPass.id,
      userId: user.userId,
      details: {
        passNumber: updatedPass.passNumber,
        action,
        status: updatedPass.status,
      },
    });

    const statusLabel = action === "EXIT" ? "বহির্গমন নিশ্চিত করা হয়েছে" : "নিরাপদ প্রত্যাবর্তন নিশ্চিত করা হয়েছে";

    return NextResponse.json({
      success: true,
      message: `গেটপাস #${updatedPass.passNumber} - ${statusLabel}।`,
      data: updatedPass,
    });
  } catch (error: any) {
    console.error("GatePass Status Update Error:", error);
    return NextResponse.json({ error: error.message || "স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
