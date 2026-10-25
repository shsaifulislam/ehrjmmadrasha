import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addQualification, deleteQualification } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { degreeTitle, institution, boardOrUniversity, majorOrSubject, passingYear, resultOrGrade, certificateUrl, notes } = body;

    if (!degreeTitle || !institution) {
      return NextResponse.json({ error: "ডিগ্রি/সনদের নাম ও শিক্ষাপ্রতিষ্ঠান আবশ্যক।" }, { status: 400 });
    }

    const qualification = await addQualification({
      employeeId: params.id,
      degreeTitle,
      institution,
      boardOrUniversity,
      majorOrSubject,
      passingYear,
      resultOrGrade,
      certificateUrl,
      notes,
      recordedByUserId: user.userId,
    });

    return NextResponse.json({ success: true, qualification }, { status: 201 });
  } catch (error: any) {
    console.error("Add qualification error:", error);
    return NextResponse.json(
      { error: error.message || "শিক্ষাগত যোগ্যতা সংযোজন ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const qualificationId = searchParams.get("qualificationId");
    if (!qualificationId) {
      return NextResponse.json({ error: "যোগ্যতা আইডি উল্লেখ করুন।" }, { status: 400 });
    }

    await deleteQualification(qualificationId, user.userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete qualification error:", error);
    return NextResponse.json(
      { error: error.message || "শিক্ষাগত যোগ্যতা অপসারণ ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
