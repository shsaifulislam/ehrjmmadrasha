import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addEmployeeDocument } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { documentType, title, fileUrl, issueDate, expiryDate, notes } = body;

    if (!documentType || !title || !fileUrl) {
      return NextResponse.json({ error: "নথির ধরন, শিরোনাম ও ফাইল লিঙ্ক আবশ্যক।" }, { status: 400 });
    }

    const doc = await addEmployeeDocument({
      employeeId: params.id,
      documentType,
      title,
      fileUrl,
      issueDate,
      expiryDate,
      notes,
      uploadedByUserId: user.userId,
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error: any) {
    console.error("Add employee document error:", error);
    return NextResponse.json(
      { error: error.message || "নথি সংযোজন ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
