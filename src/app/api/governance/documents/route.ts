import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllDocuments,
  saveDocument,
  recordAuditLog,
  KnowledgeDocument,
  KnowledgeCategory,
  DocumentType,
  DocumentStatus,
  ConfidentialityLevel,
  AudienceType,
} from "@/lib/policies";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category") as KnowledgeCategory | null;
    const documentType = searchParams.get("documentType") as DocumentType | null;
    const status = searchParams.get("status") as DocumentStatus | null;
    const confidentiality = searchParams.get("confidentiality") as ConfidentialityLevel | null;
    const audience = searchParams.get("audience") as AudienceType | null;
    const search = searchParams.get("search")?.toLowerCase().trim();
    const effectiveOnDate = searchParams.get("effectiveOnDate");

    let docs = getAllDocuments();

    // Confidentiality & Role Enforcement
    const role = user?.role || "PUBLIC";

    if (role === "PUBLIC" || !user) {
      // Public users ONLY see EFFECTIVE/PUBLISHED public documents
      docs = docs.filter(
        (d) =>
          d.confidentiality === "PUBLIC" &&
          (d.status === "EFFECTIVE" || d.status === "PUBLISHED") &&
          d.targetAudiences.includes("PUBLIC")
      );
    } else if (role === "GUARDIAN") {
      docs = docs.filter(
        (d) =>
          (d.confidentiality === "PUBLIC" || d.confidentiality === "INTERNAL") &&
          (d.status === "EFFECTIVE" || d.status === "PUBLISHED") &&
          (d.targetAudiences.includes("PUBLIC") || d.targetAudiences.includes("GUARDIAN"))
      );
    } else if (role === "TEACHER" || role === "STAFF") {
      docs = docs.filter(
        (d) =>
          d.confidentiality !== "CONFIDENTIAL" &&
          (d.status === "EFFECTIVE" || d.status === "PUBLISHED" || d.createdBy === user.userId)
      );
    }
    // Admin and Principal have access to all documents (including DRAFT, ARCHIVED, CONFIDENTIAL)

    // Apply Filters
    if (category) {
      docs = docs.filter((d) => d.category === category);
    }
    if (documentType) {
      docs = docs.filter((d) => d.documentType === documentType);
    }
    if (status) {
      docs = docs.filter((d) => d.status === status);
    }
    if (confidentiality) {
      docs = docs.filter((d) => d.confidentiality === confidentiality);
    }
    if (audience) {
      docs = docs.filter((d) => d.targetAudiences.includes(audience));
    }
    if (search) {
      docs = docs.filter(
        (d) =>
          d.titleBn.toLowerCase().includes(search) ||
          d.titleEn.toLowerCase().includes(search) ||
          d.documentCode.toLowerCase().includes(search) ||
          d.description.toLowerCase().includes(search) ||
          d.tags.some((t) => t.toLowerCase().includes(search))
      );
    }
    if (effectiveOnDate) {
      docs = docs.filter((d) => {
        const from = d.effectiveFrom;
        const until = d.effectiveUntil || "9999-12-31";
        return from <= effectiveOnDate && until >= effectiveOnDate;
      });
    }

    return NextResponse.json({
      success: true,
      totalCount: docs.length,
      documents: docs,
    });
  } catch (err: any) {
    console.error("GET /api/governance/documents error:", err);
    return NextResponse.json({ error: err.message || "Failed to load documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র এডমিন ও প্রিন্সিপাল নতুন নীতিমালা তৈরি করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      titleBn,
      titleEn,
      titleAr,
      documentType,
      category,
      ownerDepartment,
      description,
      contentText,
      contentMarkdown,
      tags = [],
      confidentiality = "INTERNAL",
      targetAudiences = ["ADMIN"],
      requiresApproval = true,
      requiresAcknowledgement = false,
      mandatoryAckRoles,
      sopSteps,
      handbookSections,
      relatedSystemModules = [],
      linkedWorkflowId,
    } = body;

    if (!titleBn || !category || !documentType) {
      return NextResponse.json(
        { error: "শিরোনাম (বাংলা), ক্যাটাগরি এবং ডকুমেন্ট টাইপ প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const prefix = documentType === "SOP" ? "SOP" : documentType === "HANDBOOK" ? "HBK" : "POL";
    const documentCode = body.documentCode || `EHRJ-${prefix}-${year}-${randCode}`;

    const text = contentText || contentMarkdown || titleBn;
    const markdown = contentMarkdown || contentText || `# ${titleBn}`;
    const today = new Date().toISOString().split("T")[0];

    const newDoc: KnowledgeDocument = {
      id: documentCode,
      documentCode,
      titleBn,
      titleEn: titleEn || titleBn,
      titleAr,
      documentType,
      category,
      ownerDepartment: ownerDepartment || "ADMINISTRATION",
      description: description || titleBn,
      tags,
      status: "DRAFT",
      currentVersion: "v1.0",
      effectiveFrom: today,
      reviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      confidentiality,
      targetAudiences,
      requiresApproval,
      requiresAcknowledgement,
      mandatoryAckRoles,
      contentText: text,
      contentMarkdown: markdown,
      sopSteps,
      handbookSections,
      relationships: [],
      relatedSystemModules,
      linkedWorkflowId,
      checksum: "",
      isLegalHoldActive: false,
      createdBy: user.name || "Admin",
      createdAt: new Date().toISOString(),
      updatedBy: user.name || "Admin",
      updatedAt: new Date().toISOString(),
      versions: [
        {
          version: "v1.0",
          versionNotes: "প্রাথমিক খসড়া তৈরি।",
          isMajor: true,
          status: "DRAFT",
          contentText: text,
          contentMarkdown: markdown,
          sopSteps,
          handbookSections,
          checksum: "",
          createdBy: user.name || "Admin",
          createdAt: new Date().toISOString(),
          effectiveFrom: today,
        },
      ],
    };

    saveDocument(newDoc);

    recordAuditLog({
      documentId: newDoc.id,
      documentCode: newDoc.documentCode,
      version: "v1.0",
      action: "CREATE_DRAFT",
      actorId: user.userId,
      actorName: user.name || "Admin",
      actorRole: user.role,
      notes: `Created draft policy ${newDoc.documentCode}`,
      details: { category, documentType, titleBn },
    });

    return NextResponse.json({
      success: true,
      message: `খসড়া ডকুমেন্ট সফলভাবে তৈরি হয়েছে (${documentCode})।`,
      document: newDoc,
    });
  } catch (err: any) {
    console.error("POST /api/governance/documents error:", err);
    return NextResponse.json({ error: err.message || "Failed to create draft" }, { status: 500 });
  }
}
