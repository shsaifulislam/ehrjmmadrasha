import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addSupportRequestAttachment } from "@/lib/helpdeskEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.fileName || !body.fileUrl) {
      return NextResponse.json({ error: "ফাইলের নাম ও লিঙ্ক আবশ্যক।" }, { status: 400 });
    }

    const attachment = await addSupportRequestAttachment({
      requestId: params.id,
      uploadedById: user.userId,
      uploadedByRole: user.role,
      fileName: body.fileName,
      fileUrl: body.fileUrl,
      fileSize: body.fileSize || 0,
      mimeType: body.mimeType || "application/octet-stream",
      isInternal: Boolean(body.isInternal),
    });

    return NextResponse.json({ success: true, attachment });
  } catch (error: any) {
    console.error("Admin Helpdesk Attachment POST error:", error);
    return NextResponse.json(
      { error: error.message || "সংযুক্তি আপলোড ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
