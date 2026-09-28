import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateTransportStop, archiveTransportStop } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন স্টপ পরিবর্তন করতে পারেন।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { stopName, address, sequenceOrder, pickupTime, dropTime, isActive, notes } = body;

    const updatedStop = await updateTransportStop(
      id,
      {
        stopName,
        address,
        sequenceOrder: sequenceOrder !== undefined ? Number(sequenceOrder) : undefined,
        pickupTime,
        dropTime,
        status: isActive !== undefined ? (isActive ? "ACTIVE" : "INACTIVE") : undefined,
        notes,
      },
      user.userId
    );

    return NextResponse.json({ success: true, stop: updatedStop });
  } catch (error: any) {
    console.error("Update transport stop error:", error);
    return NextResponse.json(
      { error: error.message || "স্টপ আপডেট করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { id } = params;
    const archivedStop = await archiveTransportStop(id, user.userId);

    return NextResponse.json({ success: true, stop: archivedStop });
  } catch (error: any) {
    console.error("Archive transport stop error:", error);
    return NextResponse.json(
      { error: error.message || "স্টপ আর্কাইভ করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
