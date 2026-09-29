import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createNewDocumentVersion } from "@/lib/policies";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র এডমিন বা প্রিন্সিপাল নতুন সংস্করণ তৈরি করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { isMajor = false, versionNotes, newContentText, newContentMarkdown } = body;

    if (!versionNotes || !versionNotes.trim()) {
      return NextResponse.json({ error: "নতুন সংস্করণের কারণ বা বিবরণ প্রদান আবশ্যক।" }, { status: 400 });
    }

    const res = createNewDocumentVersion(id, {
      isMajor: Boolean(isMajor),
      versionNotes,
      newContentText,
      newContentMarkdown,
      actor: {
        id: user.userId,
        name: user.name || "Admin",
        role: user.role as any,
      },
    });

    if (!res.success) {
      return NextResponse.json({ error: res.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      newVersion: res.newVersion,
      document: res.document,
    });
  } catch (err: any) {
    console.error("POST /api/governance/documents/[id]/version error:", err);
    return NextResponse.json({ error: err.message || "Failed to create new version" }, { status: 500 });
  }
}
