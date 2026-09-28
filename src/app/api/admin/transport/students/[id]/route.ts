import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getStudentTransportProfile } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { id } = params;
    const profile = await getStudentTransportProfile(id);

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("Get student transport profile error:", error);
    return NextResponse.json(
      { error: error.message || "শিক্ষার্থীর পরিবহন প্রোফাইল লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
