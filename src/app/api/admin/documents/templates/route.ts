import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { ensureDefaultTemplates, DEFAULT_TEMPLATES } from "@/lib/documentFactory";

/**
 * GET /api/admin/documents/templates
 * List all document templates
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    await ensureDefaultTemplates();

    const templates = await prisma.documentTemplate.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { certificates: true } },
      },
    });

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error("Templates GET error:", error);
    return NextResponse.json({ error: "টেমপ্লেট তালিকা লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/documents/templates
 * Create or update a document template with version incrementing
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন টেমপ্লেট পরিবর্তন করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      code,
      nameBn,
      nameEn,
      documentType,
      titleBn,
      titleEn,
      bodyBn,
      bodyEn,
      signatoryTitleBn,
      feeAmount = 0,
      requiresFee = false,
      isActive = true,
    } = body;

    if (!nameBn || !titleBn || !bodyBn) {
      return NextResponse.json({ error: "নাম, শিরোনাম এবং মূল বক্তব্য আবশ্যক।" }, { status: 400 });
    }

    let template: any;

    if (id) {
      // Update existing template - increment version so future documents use new version while historical snapshots remain unchanged!
      const current = await prisma.documentTemplate.findUnique({ where: { id } });
      if (!current) {
        return NextResponse.json({ error: "টেমপ্লেট পাওয়া যায়নি।" }, { status: 404 });
      }

      template = await prisma.documentTemplate.update({
        where: { id },
        data: {
          nameBn,
          nameEn,
          titleBn,
          titleEn,
          bodyBn,
          bodyEn,
          signatoryTitleBn: signatoryTitleBn || current.signatoryTitleBn,
          feeAmount: Number(feeAmount),
          requiresFee: Boolean(requiresFee),
          isActive: Boolean(isActive),
          version: current.version + 1, // Version incrementing!
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: "UPDATE_DOCUMENT_TEMPLATE",
        entityType: "DocumentTemplate",
        entityId: template.id,
        details: { oldVersion: current.version, newVersion: template.version },
      });
    } else {
      // Create new template
      if (!code || !documentType) {
        return NextResponse.json({ error: "কোড এবং প্রত্যয়নপত্রের ধরন আবশ্যক।" }, { status: 400 });
      }

      template = await prisma.documentTemplate.create({
        data: {
          code: code.trim().toUpperCase(),
          nameBn,
          nameEn,
          documentType,
          titleBn,
          titleEn,
          bodyBn,
          bodyEn,
          signatoryTitleBn: signatoryTitleBn || "মুহতামিম ও অধ্যক্ষ",
          feeAmount: Number(feeAmount),
          requiresFee: Boolean(requiresFee),
          isActive: Boolean(isActive),
          version: 1,
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: "CREATE_DOCUMENT_TEMPLATE",
        entityType: "DocumentTemplate",
        entityId: template.id,
        details: { code: template.code },
      });
    }

    return NextResponse.json({
      success: true,
      message: "টেমপ্লেট সফলভাবে সংরক্ষিত হয়েছে।",
      template,
    });
  } catch (error: any) {
    console.error("Templates POST error:", error);
    return NextResponse.json({ error: error.message || "টেমপ্লেট সংরক্ষণ করা সম্ভব হয়নি।" }, { status: 500 });
  }
}
