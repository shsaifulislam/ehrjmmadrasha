import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { approveAdmissionTransaction } from "@/lib/admissionApproval";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন এই কার্যক্রম করতে পারেন।" },
        { status: 403 }
      );
    }

    const { applicationId, assignedSectionId, linkExistingStudentId, approvalNotes, customAdmissionFee } = await req.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: "আবেদন আইডি প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await approveAdmissionTransaction({
      applicationId,
      adminUserId: user.userId,
      assignedSectionId,
      linkExistingStudentId,
      approvalNotes,
      customAdmissionFee,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Approve Admission Error:", error);
    const status = error.statusCode || (error.message.includes("ইতিমধ্যে অনুমোদিত") ? 409 : 500);
    return NextResponse.json(
      { error: error.message || "আবেদন অনুমোদন প্রক্রিয়াকরণে সমস্যা হয়েছে।" },
      { status }
    );
  }
}
