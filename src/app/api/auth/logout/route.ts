import { NextResponse } from "next/server";
import { clearAuthCookie, getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await recordAuditLog({
      userId: user.userId,
      action: "LOGOUT",
      entityType: "User",
      entityId: user.userId,
    });
  }

  await clearAuthCookie();
  return NextResponse.json({ success: true, message: "লগআউট সম্পন্ন হয়েছে।" });
}
