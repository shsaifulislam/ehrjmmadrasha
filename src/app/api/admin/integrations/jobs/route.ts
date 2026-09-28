import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  loadImportExportJobs,
  executeInstitutionalExport,
  executeInstitutionalImport,
} from "@/lib/integration";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const jobs = loadImportExportJobs();
    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load jobs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "কেবলমাত্র অ্যাডমিন ইমপোর্ট/এক্সপোর্ট পরিচালনা করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, entityType, format, rows, previewOnly } = body;

    if (action === "EXPORT") {
      if (!entityType) {
        return NextResponse.json({ error: "এক্সপোর্ট এনটিটি টাইপ আবশ্যক।" }, { status: 400 });
      }

      const result = await executeInstitutionalExport({
        entityType,
        format: format || "JSON",
        actorRole: user.role,
        actorId: user.userId,
      });

      return NextResponse.json({
        success: true,
        message: `${entityType} এক্সপোর্ট সম্পন্ন হয়েছে। সর্বমোট রেকর্ড: ${result.job.totalCount}`,
        data: result,
      });
    } else if (action === "IMPORT") {
      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ error: "ইমপোর্টের জন্য ডেটা সারি আবশ্যক।" }, { status: 400 });
      }

      const result = await executeInstitutionalImport({
        entityType: "STUDENT",
        rows,
        previewOnly: Boolean(previewOnly),
        actorId: user.userId,
      });

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন (EXPORT বা IMPORT দিন)।" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ইমপোর্ট/এক্সপোর্ট অপারেশন ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
