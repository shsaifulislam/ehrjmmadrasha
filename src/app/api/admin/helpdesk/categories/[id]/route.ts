import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateHelpdeskCategory } from "@/lib/helpdeskEngine";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "শুধুমাত্র অ্যাডমিনের জন্য অনুমোদিত।" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await updateHelpdeskCategory(params.id, {
      nameBn: body.nameBn,
      nameEn: body.nameEn,
      description: body.description,
      slaHours: body.slaHours !== undefined ? Number(body.slaHours) : undefined,
      icon: body.icon,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      adminId: user.userId,
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    console.error("Helpdesk Category PUT error:", error);
    return NextResponse.json(
      { error: error.message || "ক্যাটাগরি হালনাগাদ ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
