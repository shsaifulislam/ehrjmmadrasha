import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getGuardianTransportData } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const data = await getGuardianTransportData(user.userId);
    if (!data) {
      return NextResponse.json({ error: "কোনো অভিভাবক প্রোফাইল পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      guardian: {
        id: data.guardian.id,
        fullNameBn: data.guardian.fullNameBn,
        phone: data.guardian.phone,
      },
      students: data.students.map((s) => ({
        id: s.id,
        studentIdNumber: s.studentIdNumber,
        fullNameBn: s.fullNameBn,
        fullNameEn: s.fullNameEn,
        photoUrl: s.photoUrl,
        residentialStatus: s.residentialStatus,
        enrollment: s.enrollments?.[0] ? {
          className: s.enrollments[0]?.jamatClass?.nameBn || "N/A",
          sessionName: s.enrollments[0]?.session?.name || "N/A",
        } : null,
      })),
      activeEnrollments: data.activeEnrollments,
      requests: data.requests,
      availableRoutes: data.availableRoutes,
    });
  } catch (error: any) {
    console.error("Portal get transport error:", error);
    return NextResponse.json(
      { error: error.message || "পরিবহন তথ্য লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
