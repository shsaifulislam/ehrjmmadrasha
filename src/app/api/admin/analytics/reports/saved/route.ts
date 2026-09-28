import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSavedReports, createSavedReport } from "@/lib/analyticsEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const reports = await getSavedReports(user.userId);
    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    console.error("Saved Reports GET Error:", error);
    return NextResponse.json(
      { error: error.message || "সংরক্ষিত রিপোর্ট লোড করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title || !body.module || !body.reportType || !body.filtersJson) {
      return NextResponse.json(
        { error: "রিপোর্টের শিরোনাম, মডিউল, ধরন এবং ফিল্টার কনফিগারেশন আবশ্যক।" },
        { status: 400 }
      );
    }

    const saved = await createSavedReport({
      title: body.title,
      description: body.description,
      module: body.module,
      reportType: body.reportType,
      filtersJson: typeof body.filtersJson === "string" ? body.filtersJson : JSON.stringify(body.filtersJson),
      isPublic: Boolean(body.isPublic),
      createdById: user.userId,
    });

    return NextResponse.json({ success: true, saved }, { status: 201 });
  } catch (error: any) {
    console.error("Saved Reports POST Error:", error);
    return NextResponse.json(
      { error: error.message || "রিপোর্ট সংরক্ষণ করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
