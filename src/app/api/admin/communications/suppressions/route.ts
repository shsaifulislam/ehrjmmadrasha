import { NextRequest, NextResponse } from "next/server";
import {
  getSuppressions,
  addSuppression,
  removeSuppression,
} from "@/lib/communications";

export async function GET() {
  try {
    const list = getSuppressions();
    return NextResponse.json({ success: true, count: list.length, suppressions: list });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const record = addSuppression(
      body.email,
      body.reason || "ADMIN_BLOCK",
      body.notes,
      body.sourceCampaignId,
      body.actorId || "ADMIN"
    );

    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email query param is required." },
        { status: 400 }
      );
    }

    const removed = removeSuppression(email);
    return NextResponse.json({ success: true, removed });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
