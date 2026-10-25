import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  getCommunicationTemplates,
  saveCommunicationTemplate,
} from "@/lib/communications";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const templates = getCommunicationTemplates();
    return NextResponse.json({ success: true, count: templates.length, templates });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const body = await req.json();

    if (!body.code || !body.nameBn || !body.category) {
      return NextResponse.json(
        { success: false, error: "Template Code, Name, and Category are required." },
        { status: 400 }
      );
    }

    const template = saveCommunicationTemplate(body, body.actorId || "ADMIN");

    return NextResponse.json({ success: true, template });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
