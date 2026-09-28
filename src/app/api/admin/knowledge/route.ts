import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllDocuments,
  createDocument,
  KnowledgeCategory,
  DocumentType,
  SecurityClassification,
  RoleScope,
} from "@/lib/knowledge/knowledgeStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন অনুমোদিত।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    let docs = getAllDocuments();
    if (category) {
      docs = docs.filter((d) => d.category === category);
    }
    if (status) {
      docs = docs.filter((d) => d.status === status);
    }

    return NextResponse.json({
      success: true,
      totalCount: docs.length,
      documents: docs,
    });
  } catch (err: any) {
    console.error("Admin Knowledge List Error:", err);
    return NextResponse.json({ error: err.message || "জ্ঞানভান্ডার লোড করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন অনুমোদিত।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      documentCode,
      titleBn,
      titleEn,
      category,
      documentType,
      version,
      status,
      effectiveDate,
      expiryDate,
      securityClassification,
      roleScope,
      language,
      contentText,
      contentMarkdown,
      tags,
      changeSummary,
    } = body;

    if (!documentCode || !titleBn || !contentText) {
      return NextResponse.json({ error: "ডকুমেন্ট কোড, শিরোনাম ও বিবরণ আবশ্যক।" }, { status: 400 });
    }

    const newDoc = createDocument({
      documentCode,
      titleBn,
      titleEn: titleEn || titleBn,
      category: (category as KnowledgeCategory) || "GENERAL",
      documentType: (documentType as DocumentType) || "POLICY",
      version: version || "1.0",
      status: status || "DRAFT",
      effectiveDate: effectiveDate || new Date().toISOString(),
      expiryDate,
      author: user.name,
      securityClassification: (securityClassification as SecurityClassification) || "PUBLIC",
      roleScope: (roleScope as RoleScope) || "ALL",
      language: language || "bn",
      contentText,
      contentMarkdown: contentMarkdown || contentText,
      tags: Array.isArray(tags) ? tags : [],
      changeSummary,
    });

    return NextResponse.json({
      success: true,
      document: newDoc,
    });
  } catch (err: any) {
    console.error("Create Knowledge Document Error:", err);
    return NextResponse.json({ error: err.message || "ডকুমেন্ট সংরক্ষণ করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
