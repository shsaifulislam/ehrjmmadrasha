import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateAllAvailableDocumentsForStudent } from "@/lib/documentAutomation";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/documents/generate-available
 * Generates all eligible and non-issued documents for a student in one click
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন এই সুবিধা ব্যবহার করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, sessionId } = body;

    if (!studentId) {
      return NextResponse.json({ error: "শিক্ষার্থী আইডি প্রদান আবশ্যক।" }, { status: 400 });
    }

    const result = await generateAllAvailableDocumentsForStudent({
      studentId,
      adminUserId: user.userId,
      sessionId,
    });

    await recordAuditLog({
      userId: user.userId,
      action: "GENERATE_AVAILABLE_DOCUMENTS",
      entityType: "Student",
      entityId: studentId,
      details: {
        generatedCount: result.generated.length,
        skippedCount: result.skipped.length,
        generatedCodes: result.generated.map((g) => g.certificateType),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.generated.length}টি প্রযোজ্য অফিশিয়াল সনদপত্র সফলভাবে তৈরি হয়েছে।`,
      ...result,
    });
  } catch (error: any) {
    console.error("Generate available documents error:", error);
    return NextResponse.json(
      { error: error.message || "প্রযোজ্য সনদসমূহ তৈরি করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
