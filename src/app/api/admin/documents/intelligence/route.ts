import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllArchiveDocuments,
  getArchiveDocumentById,
  ingestDocument,
  addDocumentVersion,
  checkDocumentIntegrity,
  setLegalHold,
  updateDocumentStatus,
  processDocumentOCR,
  verifyExtractedField,
  signDocumentDigitally,
  verifyDigitalSignature,
  revokeSignature,
  searchArchiveDocuments,
  getAllDocumentAccessLogs,
  getAllOcrJobs,
} from "@/lib/document";

/**
 * GET /api/admin/documents/intelligence
 * List archived documents, stats, and search with RBAC
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const docId = searchParams.get("docId");

    // Action: Integrity Check
    if (action === "integrity" && docId) {
      const integrity = checkDocumentIntegrity(docId);
      return NextResponse.json({ success: true, integrity });
    }

    // Action: Access Logs
    if (action === "logs") {
      const logs = getAllDocumentAccessLogs(50);
      return NextResponse.json({ success: true, logs });
    }

    // Action: OCR Jobs
    if (action === "ocr_jobs") {
      const jobs = getAllOcrJobs(docId || undefined);
      return NextResponse.json({ success: true, jobs });
    }

    // Default: Search & List Archive
    const term = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    const results = searchArchiveDocuments(
      { term, documentType: type, status },
      { userId: user.userId, role: user.role as any }
    );

    const allDocs = getAllArchiveDocuments();
    const stats = {
      totalArchived: allDocs.length,
      verifiedCount: allDocs.filter((d) => d.isVerified).length,
      pendingReviewCount: allDocs.filter((d) => d.status === "REVIEW_REQUIRED" || (d.hasOcrText && !d.isOcrReviewed)).length,
      legalHoldCount: allDocs.filter((d) => d.retentionPolicy?.isLegalHoldActive).length,
      signedCount: allDocs.filter((d) => d.signatures && d.signatures.length > 0).length,
    };

    return NextResponse.json({
      success: true,
      documents: results.map((r) => r.document),
      stats,
    });
  } catch (error: any) {
    console.error("GET /api/admin/documents/intelligence error:", error);
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}

/**
 * POST /api/admin/documents/intelligence
 * Ingest, Trigger OCR, Verify Field, Sign, Legal Hold, or Add Version
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    const userContext = {
      userId: user.userId,
      name: user.name || "Admin Officer",
      role: user.role,
    };

    // 1. Ingest Document
    if (action === "INGEST") {
      const {
        title,
        documentType,
        entityType,
        entityId,
        entityName,
        fileContentBase64,
        fileName,
        mimeType,
        retentionYears,
      } = body;

      if (!title || !documentType || !entityId || !fileContentBase64) {
        return NextResponse.json({ error: "আবশ্যকীয় তথ্য অপূর্ণ।" }, { status: 400 });
      }

      const buffer = Buffer.from(fileContentBase64, "base64");
      const { document, duplicates } = await ingestDocument({
        documentType,
        title,
        entityType: entityType || "STUDENT",
        entityId,
        entityName,
        fileBuffer: buffer,
        originalFileName: fileName || "document.pdf",
        mimeType: mimeType || "application/pdf",
        user: userContext,
        retentionYears: Number(retentionYears) || 5,
      });

      return NextResponse.json({ success: true, document, duplicates });
    }

    // 2. Add New Version
    if (action === "ADD_VERSION") {
      const { documentId, fileContentBase64, fileName, mimeType, reason } = body;
      if (!documentId || !fileContentBase64) {
        return NextResponse.json({ error: "ডকুমেন্ট আইডি এবং ফাইল আবশ্যক।" }, { status: 400 });
      }
      const buffer = Buffer.from(fileContentBase64, "base64");
      const updated = await addDocumentVersion({
        documentId,
        fileBuffer: buffer,
        originalFileName: fileName || "updated_doc.pdf",
        mimeType: mimeType || "application/pdf",
        reason: reason || "Manual document update",
        user: userContext,
      });

      return NextResponse.json({ success: true, document: updated });
    }

    // 3. Trigger OCR
    if (action === "PROCESS_OCR") {
      const { documentId, mockSampleText } = body;
      if (!documentId) return NextResponse.json({ error: "ডকুমেন্ট আইডি আবশ্যক।" }, { status: 400 });

      const result = await processDocumentOCR({
        documentId,
        user: userContext,
        mockSampleText,
      });

      return NextResponse.json({ success: true, job: result.job, document: result.document });
    }

    // 4. Verify / Edit Extracted Field
    if (action === "VERIFY_FIELD") {
      const { documentId, fieldId, confirmedValue, fieldAction, notes } = body;
      if (!documentId || !fieldId || !fieldAction) {
        return NextResponse.json({ error: "ফিল্ড ভেরিফিকেশন তথ্য অসম্পূর্ণ।" }, { status: 400 });
      }

      const verified = await verifyExtractedField({
        documentId,
        fieldId,
        confirmedValue,
        action: fieldAction,
        reviewer: userContext,
        notes,
      });

      return NextResponse.json({ success: true, field: verified });
    }

    // 5. Digital Sign
    if (action === "SIGN_DIGITALLY") {
      const { documentId, watermark, signingMethod } = body;
      if (!documentId) return NextResponse.json({ error: "ডকুমেন্ট আইডি আবশ্যক।" }, { status: 400 });

      const signature = await signDocumentDigitally({
        documentId,
        signer: {
          userId: user.userId,
          name: user.name || "Principal/Officer",
          role: user.role as any,
          designation: user.role === "PRINCIPAL" ? "মুহতামিম / অধ্যক্ষ" : "প্রশাসনিক কর্মকর্তা",
        },
        signingMethod,
        watermark,
      });

      return NextResponse.json({ success: true, signature });
    }

    // 6. Verify Signature
    if (action === "VERIFY_SIGNATURE") {
      const { signatureId } = body;
      const res = verifyDigitalSignature(signatureId);
      return NextResponse.json({ success: true, result: res });
    }

    // 7. Revoke Signature
    if (action === "REVOKE_SIGNATURE") {
      const { signatureId, reason } = body;
      const revoked = await revokeSignature({
        signatureId,
        reason: reason || "Administrative revocation",
        revokedBy: userContext,
      });
      return NextResponse.json({ success: true, signature: revoked });
    }

    // 8. Legal Hold
    if (action === "LEGAL_HOLD") {
      const { documentId, holdAction, reason, caseReference } = body;
      const doc = await setLegalHold({
        documentId,
        action: holdAction,
        reason: reason || "Statutory compliance audit hold",
        caseReference,
        user: userContext,
      });
      return NextResponse.json({ success: true, document: doc });
    }

    // 9. Update Status (Archive, Revoke, etc.)
    if (action === "UPDATE_STATUS") {
      const { documentId, newStatus, reason } = body;
      const doc = await updateDocumentStatus(documentId, newStatus, userContext, reason);
      return NextResponse.json({ success: true, document: doc });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন।" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/admin/documents/intelligence error:", error);
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}
