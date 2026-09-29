/**
 * EHRJ MADRASHA ERP — PHASE 38
 * Institutional Policy Conflict Detection Engine
 * 
 * Invariants:
 * 1. AI & HEURISTIC CONFLICT DETECTION IS ADVISORY — HUMAN REVIEWERS DECIDE.
 * 2. DETECT DUPLICATE ACTIVE POLICIES IN THE SAME CATEGORY & DEPARTMENT.
 * 3. DETECT SUPERSEDED POLICIES CONCURRENTLY MARKED EFFECTIVE.
 */

import {
  KnowledgeDocument,
  PolicyConflict,
} from "./types";
import {
  getAllDocuments,
  getAllConflicts,
  saveConflicts,
  recordAuditLog,
} from "./policyStore";

/**
 * Scan all stored documents and analyze for structural and temporal conflicts
 */
export function detectPolicyConflicts(): PolicyConflict[] {
  const docs = getAllDocuments();
  const existingConflicts = getAllConflicts();
  const detectedConflicts: PolicyConflict[] = [];

  const effectiveDocs = docs.filter((d) => d.status === "EFFECTIVE" || d.status === "PUBLISHED");

  // Rule 1: Duplicate active policies in same Category & OwnerDepartment
  for (let i = 0; i < effectiveDocs.length; i++) {
    for (let j = i + 1; j < effectiveDocs.length; j++) {
      const a = effectiveDocs[i];
      const b = effectiveDocs[j];

      if (a.category === b.category && a.ownerDepartment === b.ownerDepartment && a.documentType === b.documentType) {
        // Exclude if one explicitly supersedes the other
        const aSupersedesB = a.relationships?.some((r) => r.targetDocId === b.id && r.relationshipType === "SUPERSEDES");
        const bSupersedesA = b.relationships?.some((r) => r.targetDocId === a.id && r.relationshipType === "SUPERSEDES");

        if (!aSupersedesB && !bSupersedesA) {
          const conflictId = `CONF-DUP-${a.documentCode}-${b.documentCode}`;
          detectedConflicts.push({
            id: conflictId,
            documentIdA: a.id,
            documentCodeA: a.documentCode,
            titleA: a.titleBn,
            documentIdB: b.id,
            documentCodeB: b.documentCode,
            titleB: b.titleBn,
            conflictType: "DUPLICATE_ACTIVE_CATEGORY",
            description: `উভয় নথি '${a.category}' ক্যাটাগরি ও '${a.ownerDepartment}' বিভাগে একই সাথে কার্যকর (EFFECTIVE) রয়েছে, যা নীতিমালা দ্বৈততা সৃষ্টি করতে পারে।`,
            severity: "HIGH",
            detectedAt: new Date().toISOString(),
            status: "OPEN",
          });
        }
      }
    }
  }

  // Rule 2: Superseded relationship collision (Policy A says it supersedes B, but B is still EFFECTIVE)
  for (const doc of docs) {
    if (doc.relationships) {
      for (const rel of doc.relationships) {
        if (rel.relationshipType === "SUPERSEDES") {
          const target = docs.find((d) => d.id === rel.targetDocId || d.documentCode === rel.targetDocCode);
          if (target && target.status === "EFFECTIVE" && doc.status === "EFFECTIVE") {
            const conflictId = `CONF-SUP-${doc.documentCode}-${target.documentCode}`;
            detectedConflicts.push({
              id: conflictId,
              documentIdA: doc.id,
              documentCodeA: doc.documentCode,
              titleA: doc.titleBn,
              documentIdB: target.id,
              documentCodeB: target.documentCode,
              titleB: target.titleBn,
              conflictType: "SUPERSEDED_ACTIVE_COLLISION",
              description: `'${doc.documentCode}' নথিটি '${target.documentCode}' কে স্থলাভিষিক্ত ঘোষণা করলেও পূর্ববর্তী নথিটি এখনও কার্যকর (EFFECTIVE) হিসেবে সক্রিয় আছে।`,
              severity: "HIGH",
              detectedAt: new Date().toISOString(),
              status: "OPEN",
            });
          }
        }
      }
    }
  }

  // Rule 3: Date Overlap with same category policies
  for (let i = 0; i < effectiveDocs.length; i++) {
    for (let j = i + 1; j < effectiveDocs.length; j++) {
      const a = effectiveDocs[i];
      const b = effectiveDocs[j];

      if (a.category === b.category && a.id !== b.id) {
        if (a.effectiveFrom && b.effectiveFrom) {
          const aUntil = a.effectiveUntil || "9999-12-31";
          const bUntil = b.effectiveUntil || "9999-12-31";

          const hasOverlap = a.effectiveFrom <= bUntil && b.effectiveFrom <= aUntil;
          if (hasOverlap && a.titleBn === b.titleBn) {
            const conflictId = `CONF-DATE-${a.documentCode}-${b.documentCode}`;
            detectedConflicts.push({
              id: conflictId,
              documentIdA: a.id,
              documentCodeA: a.documentCode,
              titleA: a.titleBn,
              documentIdB: b.id,
              documentCodeB: b.documentCode,
              titleB: b.titleBn,
              conflictType: "OVERLAPPING_EFFECTIVE_DATES",
              description: `একই শিরোনাম ও ক্যাটাগরির দুটি নীতিমালার কার্যকর তারিখের মেয়াদ পরস্পর সাংঘর্ষিক (${a.effectiveFrom}-${aUntil} বনাম ${b.effectiveFrom}-${bUntil})।`,
              severity: "MEDIUM",
              detectedAt: new Date().toISOString(),
              status: "OPEN",
            });
          }
        }
      }
    }
  }

  // Merge with existing conflicts without losing human reviews
  const finalConflicts: PolicyConflict[] = [];
  for (const c of detectedConflicts) {
    const existing = existingConflicts.find((e) => e.id === c.id);
    if (existing) {
      finalConflicts.push({ ...c, status: existing.status });
    } else {
      finalConflicts.push(c);
    }
  }

  saveConflicts(finalConflicts);
  return finalConflicts;
}

/**
 * Human resolution of a policy conflict
 */
export function resolvePolicyConflict(
  conflictId: string,
  resolution: "REVIEWED" | "RESOLVED",
  actor: { id: string; name: string; role: string },
  notes?: string
): { success: boolean; message: string; conflict?: PolicyConflict } {
  const conflicts = getAllConflicts();
  const item = conflicts.find((c) => c.id === conflictId);

  if (!item) {
    return { success: false, message: `দ্বন্দ্ব রেকর্ড খুঁজে পাওয়া যায়নি: ${conflictId}` };
  }

  item.status = resolution;
  saveConflicts(conflicts);

  recordAuditLog({
    documentId: item.documentIdA,
    documentCode: item.documentCodeA,
    version: "N/A",
    action: "UPDATE_DRAFT",
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    notes: `Conflict ${conflictId} marked as ${resolution}. Reason: ${notes || "No notes"}`,
    details: { conflictId, resolution, notes },
  });

  return {
    success: true,
    message: `নীতিমালা অসঙ্গতি সফলভাবে '${resolution}' হিসেবে চিহ্নিত করা হয়েছে।`,
    conflict: item,
  };
}
