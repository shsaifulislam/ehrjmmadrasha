import { NextRequest } from "next/server";
import { POST as applyHandler } from "./apply/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return applyHandler(req);
}
