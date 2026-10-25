import { NextRequest } from "next/server";
import { handleTracking } from "@/lib/admissionTrack";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ trackingId: string }> }) {
  const params = await paramsPromise;
  return await handleTracking(params.trackingId);
}
