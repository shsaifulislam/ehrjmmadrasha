import { NextRequest } from "next/server";
import { handleTracking } from "@/lib/admissionTrack";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  return await handleTracking(params.trackingId);
}
