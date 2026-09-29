import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllCertificates,
  issueTrainingCertificate,
  checkCertificateEligibility,
} from "@/lib/training";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);

    const programId = searchParams.get("programId");
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    let certs = getAllCertificates();
    const isAdmin = user?.role === "ADMIN" || user?.role === "PRINCIPAL";

    // Non-admin can only see their own certificates
    if (!isAdmin && user) {
      certs = certs.filter((c) => c.employeeId === user.userId || c.employeeName === user.username);
    }

    if (programId) {
      certs = certs.filter((c) => c.trainingProgramId === programId);
    }
    if (employeeId && isAdmin) {
      certs = certs.filter((c) => c.employeeId === employeeId);
    }
    if (status) {
      certs = certs.filter((c) => c.status === status);
    }

    return NextResponse.json({
      success: true,
      total: certs.length,
      certificates: certs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch certificates" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { programId, employeeId } = body;

    if (!programId || !employeeId) {
      return NextResponse.json(
        { success: false, error: "প্রোগ্রাম আইডি এবং কর্মী আইডি আবশ্যক।" },
        { status: 400 }
      );
    }

    const isAdmin = user.role === "ADMIN" || user.role === "PRINCIPAL";
    // If not admin, participant can only request certificate for self
    if (!isAdmin && employeeId !== user.userId) {
      return NextResponse.json(
        { success: false, error: "অন্য কারো সনদপত্র ইস্যুর অনুমতি নেই।" },
        { status: 403 }
      );
    }

    const actor = {
      actorId: user.userId,
      actorName: user.username || "System",
      actorRole: user.role,
    };

    const result = issueTrainingCertificate(programId, employeeId, actor);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "আলহামদুলিল্লাহ! প্রাতিষ্ঠানিক প্রশিক্ষণ সনদপত্র সফলভাবে ইস্যু করা হয়েছে।",
      certificate: result.certificate,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to issue certificate" },
      { status: 500 }
    );
  }
}
