import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllDocuments,
  getAllKnowledgeGaps,
  getAllFeedback,
  getSearchAudits,
} from "@/lib/knowledge/knowledgeStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const docs = getAllDocuments();
    const gaps = getAllKnowledgeGaps();
    const feedback = getAllFeedback();
    const audits = getSearchAudits();

    const totalDocs = docs.length;
    const publishedDocs = docs.filter((d) => d.status === "PUBLISHED").length;
    const draftDocs = docs.filter((d) => d.status === "DRAFT").length;
    const reviewDocs = docs.filter((d) => d.status === "UNDER_REVIEW").length;
    const supersededDocs = docs.filter((d) => d.status === "SUPERSEDED").length;

    // Detect stale docs (no review in > 365 days or expired)
    const now = Date.now();
    const staleDocs = docs.filter((d) => {
      if (d.expiryDate && new Date(d.expiryDate).getTime() < now) return true;
      const ageDays = (now - new Date(d.updatedAt).getTime()) / (1000 * 3600 * 24);
      return ageDays > 365;
    });

    const totalSearches = audits.length;
    const avgLatency =
      totalSearches > 0
        ? Math.round(audits.reduce((acc, a) => acc + a.latencyMs, 0) / totalSearches)
        : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalDocs,
        publishedDocs,
        draftDocs,
        reviewDocs,
        supersededDocs,
        staleDocsCount: staleDocs.length,
        totalSearches,
        avgLatencyMs: avgLatency,
        openGapsCount: gaps.filter((g) => g.status === "OPEN").length,
        totalFeedbackCount: feedback.length,
      },
      gaps,
      recentSearches: audits.slice(-20).reverse(),
      feedback: feedback.slice(-20).reverse(),
      staleDocs: staleDocs.map((d) => ({
        id: d.id,
        title: d.titleBn,
        version: d.version,
        updatedAt: d.updatedAt,
      })),
    });
  } catch (err: any) {
    console.error("Knowledge Analytics Error:", err);
    return NextResponse.json({ error: err.message || "অ্যানালিটিক্স লোড করা যায়নি।" }, { status: 500 });
  }
}
