import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateIssueStatus, getAllDataQualityIssues } from "@/lib/dataGovernanceEngine";

export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const issues = getAllDataQualityIssues();
    const issue = issues.find(i => i.id === params.id);
    if (!issue) {
      return NextResponse.json({ error: "ইস্যু পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: issue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন ডেটা কোয়ালিটি ইস্যুর স্ট্যাটাস পরিবর্তন করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { status, notes, assignedTo, proposedCorrection } = body;

    const updated = updateIssueStatus(
      params.id,
      status,
      user.name || user.username,
      notes,
      assignedTo,
      proposedCorrection
    );

    return NextResponse.json({
      success: true,
      messageBn: `ইস্যু ${params.id} এর স্ট্যাটাস '${status}' হিসেবে হালনাগাদ করা হয়েছে।`,
      data: updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}
