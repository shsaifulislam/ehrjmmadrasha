/**
 * EHRJ MADRASHA ERP — PHASE 38
 * Institutional SOP (Standard Operating Procedure) Engine
 * 
 * Invariants:
 * 1. THE SOP EXPLAINS THE INSTITUTIONAL PROCESS. THE WORKFLOW EXECUTES CONFIGURED AUTOMATION.
 * 2. NEITHER SILENTLY REPLACES THE OTHER.
 * 3. EXPLICIT ROLES, DECISION POINTS & EVIDENCE CRITERIA FOR EVERY OPERATIONAL STEP.
 */

import { SOPStep, KnowledgeDocument } from "./types";
import { getDocumentById, saveDocument, recordAuditLog } from "./policyStore";

export function validateSOPSteps(steps: SOPStep[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!steps || steps.length === 0) {
    errors.push("এসওপি-তে নূন্যতম একটি সুনির্দিষ্ট পদক্ষেপ (Step) থাকতে হবে।");
    return { isValid: false, errors };
  }

  const stepNumbers = new Set<number>();
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (!s.titleBn || !s.titleBn.trim()) {
      errors.push(`পদক্ষেপ ${i + 1}-এর শিরোনাম (বাংলা) অনুপস্থিত।`);
    }
    if (!s.responsibleRole || !s.responsibleRole.trim()) {
      errors.push(`পদক্ষেপ ${i + 1}-এর দায়িত্বপ্রাপ্ত পদ/ভূমিকা অনুপস্থিত।`);
    }
    if (stepNumbers.has(s.stepNumber)) {
      errors.push(`পদক্ষেপ নম্বর ${s.stepNumber} পুনরাবৃত্তি হয়েছে।`);
    }
    stepNumbers.add(s.stepNumber);
  }

  return { isValid: errors.length === 0, errors };
}

export function updateDocumentSOPSteps(
  docIdOrCode: string,
  steps: SOPStep[],
  actor: { id: string; name: string; role: string }
): { success: boolean; message: string; document?: KnowledgeDocument } {
  const doc = getDocumentById(docIdOrCode);
  if (!doc) {
    return { success: false, message: `এসওপি নথি পাওয়া যায়নি: ${docIdOrCode}` };
  }

  if (doc.documentType !== "SOP") {
    return { success: false, message: `শুধুমাত্র 'SOP' ধরনের নথিতে কার্যপদ্ধতি যুক্ত করা যায়।` };
  }

  const val = validateSOPSteps(steps);
  if (!val.isValid) {
    return { success: false, message: val.errors.join("; ") };
  }

  // Ensure steps are sorted by stepNumber
  steps.sort((a, b) => a.stepNumber - b.stepNumber);

  doc.sopSteps = steps;
  doc.updatedBy = actor.name;
  doc.updatedAt = new Date().toISOString();

  // Also update current version
  const curVer = doc.versions.find((v) => v.version === doc.currentVersion);
  if (curVer) {
    curVer.sopSteps = steps;
  }

  saveDocument(doc);

  recordAuditLog({
    documentId: doc.id,
    documentCode: doc.documentCode,
    version: doc.currentVersion,
    action: "UPDATE_DRAFT",
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    notes: `Updated SOP steps count: ${steps.length}`,
    details: { totalSteps: steps.length },
  });

  return {
    success: true,
    message: "এসওপি পদক্ষেপসমূহ সফলভাবে সংরক্ষিত হয়েছে।",
    document: doc,
  };
}
