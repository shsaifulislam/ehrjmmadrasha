import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  previewBatchImport,
  executeBatchImport,
  getAlumniImportBatches,
} from "@/lib/alumni";

export const dynamic = "force-dynamic";

/**
 * GET /api/alumni/import
 * List historical import batches.
 */
export async function GET() {
  try {
    const session = await getSessionUser();
    if (
      !session ||
      (session.role !== "ADMIN" &&
        session.role !== "PRINCIPAL" &&
        session.role !== "STAFF")
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin privileges required." },
        { status: 403 }
      );
    }

    const batches = getAlumniImportBatches();
    return NextResponse.json({
      success: true,
      batches,
    });
  } catch (error: any) {
    console.error("[API /api/alumni/import] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load import batches" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alumni/import
 * Legacy alumni data import endpoint.
 * Actions:
 *  - "PREVIEW": Validate rows, detect duplicates (by phone, email, name+year), return diagnostic preview.
 *  - "EXECUTE": Commit import rows, creating alumni profiles and audit entries.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (
      !session ||
      (session.role !== "ADMIN" &&
        session.role !== "PRINCIPAL" &&
        session.role !== "STAFF")
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const action = body.action || "PREVIEW";
    const { batchName, sourceFormat, rows, autoVerifyLegacy } = body;

    if (!batchName || !rows || !Array.isArray(rows)) {
      return NextResponse.json(
        {
          success: false,
          error: "batchName and rows array are mandatory.",
        },
        { status: 400 }
      );
    }

    if (action === "PREVIEW") {
      const preview = previewBatchImport(batchName, rows, sourceFormat || "JSON");
      return NextResponse.json({
        success: true,
        preview,
      });
    }

    if (action === "EXECUTE") {
      const result = await executeBatchImport(
        batchName,
        rows,
        sourceFormat || "JSON",
        session.userId,
        autoVerifyLegacy || false
      );

      return NextResponse.json({
        success: true,
        result,
        message: `Import batch executed: ${result.importedCount} imported, ${result.skippedCount} skipped, ${result.errorCount} errors.`,
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API /api/alumni/import] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process import operation" },
      { status: 400 }
    );
  }
}
