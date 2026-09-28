import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDocumentById, updateDocument } from "@/lib/knowledge/knowledgeStore";
import { chunkDocument } from "@/lib/knowledge/knowledgeEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const doc = getDocumentById(params.id);
    if (!doc) {
      return NextResponse.json({ error: "ডকুমেন্ট পাওয়া যায়নি।" }, { status: 404 });
    }

    const chunks = chunkDocument(doc);

    return NextResponse.json({
      success: true,
      document: doc,
      chunks,
    });
  } catch (err: any) {
    console.error("Get Document Error:", err);
    return NextResponse.json({ error: err.message || "ডকুমেন্ট লোড করা যায়নি।" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const updated = updateDocument(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: "ডকুমেন্ট আপডেট করা যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      document: updated,
    });
  } catch (err: any) {
    console.error("Update Document Error:", err);
    return NextResponse.json({ error: err.message || "ডকুমেন্ট আপডেট ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
