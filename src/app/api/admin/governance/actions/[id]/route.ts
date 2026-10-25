import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  FindingsActionEngine,
  ActorContext,
} from "@/lib/riskAssurance";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার।" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    if (!body.completionNotesBn) {
      return NextResponse.json(
        { success: false, error: "সম্পন্ন হওয়ার বিবরণ (completionNotesBn) আবশ্যক।" },
        { status: 400 }
      );
    }

    const updatedAction = FindingsActionEngine.completeAction(
      id,
      {
        completionNotesBn: body.completionNotesBn,
        evidenceRef: body.evidenceRef,
      },
      actor
    );

    return NextResponse.json({
      success: true,
      actionItem: updatedAction,
      message: "সংশোধনমূলক ব্যবস্থা সম্পন্ন হিসেবে চিহ্নিত হয়েছে এবং যাচাইয়ের জন্য অপেক্ষমান।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to complete action." },
      { status: 500 }
    );
  }
}
