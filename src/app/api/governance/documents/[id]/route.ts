import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getDocumentById,
  saveDocument,
  getEffectivePolicyOnDate,
  recordAuditLog,
} from "@/lib/policies";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    const doc = getDocumentById(id);

    if (!doc) {
      return NextResponse.json({ error: "ডকুমেন্ট খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    // Role & Confidentiality Guard
    const role = user?.role || "PUBLIC";
    if (role === "PUBLIC" || !user) {
      if (doc.confidentiality !== "PUBLIC" || (doc.status !== "EFFECTIVE" && doc.status !== "PUBLISHED")) {
        return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
      }
    } else if (role === "GUARDIAN") {
      if (doc.confidentiality === "CONFIDENTIAL" || doc.confidentiality === "RESTRICTED") {
        return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const effectiveDate = searchParams.get("effectiveDate");

    if (effectiveDate) {
      const historicalRes = getEffectivePolicyOnDate(doc.id, effectiveDate);
      return NextResponse.json({
        success: true,
        document: doc,
        historicalResolution: historicalRes,
      });
    }

    return NextResponse.json({
      success: true,
      document: doc,
    });
  } catch (err: any) {
    console.error("GET /api/governance/documents/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to retrieve document" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const doc = getDocumentById(id);
    if (!doc) {
      return NextResponse.json({ error: "ডকুমেন্ট পাওয়া যায়নি।" }, { status: 404 });
    }

    if (doc.isLegalHoldActive) {
      return NextResponse.json(
        { error: "লিগ্যাল হোল্ড কার্যকর থাকায় এই ডকুমেন্টে কোনো সম্পাদনা করা যাবে না।" },
        { status: 400 }
      );
    }

    // If already published/effective, substantive text changes MUST be done via create new version
    const body = await req.json();

    if (doc.status === "EFFECTIVE" || doc.status === "PUBLISHED") {
      // Allow updating metadata like reviewDate, tags, relatedSystemModules, linkedWorkflowId
      if (body.reviewDate) doc.reviewDate = body.reviewDate;
      if (body.tags) doc.tags = body.tags;
      if (body.relatedSystemModules) doc.relatedSystemModules = body.relatedSystemModules;
      if (body.linkedWorkflowId) doc.linkedWorkflowId = body.linkedWorkflowId;
      if (body.requiresAcknowledgement !== undefined) doc.requiresAcknowledgement = body.requiresAcknowledgement;
      if (body.mandatoryAckRoles) doc.mandatoryAckRoles = body.mandatoryAckRoles;
      if (body.targetAudiences) doc.targetAudiences = body.targetAudiences;
    } else {
      // In DRAFT or UNDER_REVIEW state, content can be edited
      if (body.titleBn) doc.titleBn = body.titleBn;
      if (body.titleEn) doc.titleEn = body.titleEn;
      if (body.titleAr) doc.titleAr = body.titleAr;
      if (body.description) doc.description = body.description;
      if (body.category) doc.category = body.category;
      if (body.ownerDepartment) doc.ownerDepartment = body.ownerDepartment;
      if (body.confidentiality) doc.confidentiality = body.confidentiality;
      if (body.contentText) doc.contentText = body.contentText;
      if (body.contentMarkdown) doc.contentMarkdown = body.contentMarkdown;
      if (body.sopSteps) doc.sopSteps = body.sopSteps;
      if (body.handbookSections) doc.handbookSections = body.handbookSections;
      if (body.tags) doc.tags = body.tags;
      if (body.effectiveFrom) doc.effectiveFrom = body.effectiveFrom;
      if (body.effectiveUntil) doc.effectiveUntil = body.effectiveUntil;
      if (body.reviewDate) doc.reviewDate = body.reviewDate;
      if (body.requiresAcknowledgement !== undefined) doc.requiresAcknowledgement = body.requiresAcknowledgement;
      if (body.mandatoryAckRoles) doc.mandatoryAckRoles = body.mandatoryAckRoles;
      if (body.targetAudiences) doc.targetAudiences = body.targetAudiences;

      // Sync into current version record
      const curVer = doc.versions.find((v) => v.version === doc.currentVersion);
      if (curVer) {
        if (body.contentText) curVer.contentText = body.contentText;
        if (body.contentMarkdown) curVer.contentMarkdown = body.contentMarkdown;
        if (body.sopSteps) curVer.sopSteps = body.sopSteps;
        if (body.handbookSections) curVer.handbookSections = body.handbookSections;
      }
    }

    doc.updatedBy = user.name || "Admin";
    doc.updatedAt = new Date().toISOString();

    saveDocument(doc);

    recordAuditLog({
      documentId: doc.id,
      documentCode: doc.documentCode,
      version: doc.currentVersion,
      action: "UPDATE_DRAFT",
      actorId: user.userId,
      actorName: user.name || "Admin",
      actorRole: user.role,
      notes: "Updated document metadata/content",
    });

    return NextResponse.json({
      success: true,
      message: "ডকুমেন্ট সফলভাবে হালনাগাদ করা হয়েছে।",
      document: doc,
    });
  } catch (err: any) {
    console.error("PATCH /api/governance/documents/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to update document" }, { status: 500 });
  }
}
