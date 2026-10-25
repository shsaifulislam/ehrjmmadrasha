import { NextRequest } from "next/server";
import { PATCH as handleRefundApproval } from "../route";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/finance/payments/refund/approval
 * Principal Dual-Authorization Review Endpoint
 */
export async function POST(req: NextRequest) {
  return handleRefundApproval(req);
}

export async function PATCH(req: NextRequest) {
  return handleRefundApproval(req);
}
