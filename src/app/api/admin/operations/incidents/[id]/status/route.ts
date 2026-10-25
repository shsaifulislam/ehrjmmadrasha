import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateIncidentStatus } from "@/lib/operationsEngine";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত: শুধুমাত্র অ্যাডমিন ইনসিডেন্ট স্ট্যাটাস পরিবর্তন করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.status) {
      return NextResponse.json(
        { error: "নতুন স্ট্যাটাস প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const updated = await updateIncidentStatus({
      incidentId: params.id,
      status: body.status,
      note: body.note,
      performedByName: user.name,
      performedById: user.userId,
      resolution: body.resolution,
      rootCause: body.rootCause,
    });

    return NextResponse.json({ success: true, incident: updated });
  } catch (error: any) {
    console.error("Incident Update Error:", error);
    return NextResponse.json(
      { error: error.message || "ইনসিডেন্ট আপডেট করতে ব্যর্থ।" },
      { status: 400 }
    );
  }
}
