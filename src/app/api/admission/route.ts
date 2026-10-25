import { NextRequest, NextResponse } from "next/server";
import { checkAdmissionRateLimit, getClientIp } from "@/lib/security";
import { POST as handleAdmissionApply } from "../admissions/apply/route";

export const dynamic = "force-dynamic";

/**
 * POST /api/admission
 * Public admission application intake with SEC-03 rate limiting.
 * Rate Limit: Maximum 5 applications per IP per hour. 6th -> 429.
 */
export async function POST(req: NextRequest) {
  // Delegate to admission apply intake handler which enforces SEC-03 rate limiting at its entry
  return handleAdmissionApply(req);
}
