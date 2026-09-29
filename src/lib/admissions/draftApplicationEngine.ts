/**
 * EHRJ Digital Admissions 2.0 — Save as Draft & Resume Engine
 * Checkpoint: EHRJ-AI-2026-PHASE34
 * Allows applicants to save incomplete applications, compute progress %, and resume later via secure token.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { DraftApplication } from "./types";

const ADMISSIONS_DATA_DIR = path.join(process.cwd(), "data", "admissions");
const DRAFTS_FILE = path.join(ADMISSIONS_DATA_DIR, "draft_applications.json");

function safeReadDrafts(): DraftApplication[] {
  try {
    if (!fs.existsSync(DRAFTS_FILE)) return [];
    const raw = fs.readFileSync(DRAFTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function safeWriteDrafts(drafts: DraftApplication[]): void {
  try {
    if (!fs.existsSync(ADMISSIONS_DATA_DIR)) {
      fs.mkdirSync(ADMISSIONS_DATA_DIR, { recursive: true });
    }
    const temp = `${DRAFTS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(temp, JSON.stringify(drafts, null, 2), "utf-8");
    fs.renameSync(temp, DRAFTS_FILE);
  } catch (err) {
    console.error("[DraftApplicationEngine] Write error:", err);
  }
}

const REQUIRED_KEYS = [
  "studentNameBn",
  "dateOfBirth",
  "desiredClassId",
  "guardianName",
  "guardianPhone",
  "address",
];

export function computeDraftProgress(formData: Record<string, any>): {
  percentage: number;
  missingFields: string[];
} {
  const missing: string[] = [];
  let filledCount = 0;

  for (const k of REQUIRED_KEYS) {
    if (formData[k] && String(formData[k]).trim() !== "") {
      filledCount++;
    } else {
      missing.push(k);
    }
  }

  // Bonus points for optional fields (fatherName, motherName, residential, prevInstitute)
  const optionalKeys = ["fatherNameBn", "motherNameBn", "desiredResidentialStatus", "previousInstitute"];
  let optFilled = 0;
  for (const ok of optionalKeys) {
    if (formData[ok] && String(formData[ok]).trim() !== "") optFilled++;
  }

  const basePercentage = Math.round((filledCount / REQUIRED_KEYS.length) * 80);
  const optBonus = Math.round((optFilled / optionalKeys.length) * 20);
  const total = Math.min(basePercentage + optBonus, 100);

  return { percentage: total, missingFields: missing };
}

/**
 * Saves or updates a draft application
 */
export function saveDraftApplication(input: {
  draftId?: string;
  resumeToken?: string;
  guardianPhone?: string;
  studentNameBn?: string;
  desiredClassId?: string;
  currentStep?: number;
  formData: Record<string, any>;
}): {
  success: boolean;
  draftId: string;
  resumeToken: string;
  progressPercentage: number;
  missingFields: string[];
  missingDocuments?: string[];
  draft: DraftApplication;
} {
  const drafts = safeReadDrafts();
  const phone = (input.guardianPhone || input.formData?.guardianPhone || "").trim();

  let existingIndex = -1;
  if (input.draftId) {
    existingIndex = drafts.findIndex((d) => d.draftId === input.draftId);
  } else if (phone) {
    existingIndex = drafts.findIndex((d) => d.guardianPhone === phone);
  }

  const { percentage, missingFields } = computeDraftProgress(input.formData);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days expiry

  if (existingIndex !== -1) {
    const existing = drafts[existingIndex];
    const updated: DraftApplication = {
      ...existing,
      studentNameBn: input.studentNameBn || input.formData.studentNameBn || existing.studentNameBn,
      desiredClassId: input.desiredClassId || input.formData.desiredClassId || existing.desiredClassId,
      currentStep: input.currentStep || existing.currentStep || 1,
      completionPercentage: percentage,
      formData: { ...existing.formData, ...input.formData },
      missingRequiredFields: missingFields,
      lastSavedAt: now.toISOString(),
      expiresAt,
    };
    drafts[existingIndex] = updated;
    safeWriteDrafts(drafts);
    return {
      success: true,
      draftId: updated.draftId,
      resumeToken: updated.resumeToken,
      progressPercentage: percentage,
      missingFields,
      draft: updated,
    };
  }

  // Create new draft
  const draftId = `DFT-ADM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const resumeToken = crypto.randomBytes(16).toString("hex");

  const newDraft: DraftApplication = {
    draftId,
    resumeToken,
    guardianPhone: phone,
    studentNameBn: input.studentNameBn || input.formData.studentNameBn,
    desiredClassId: input.desiredClassId || input.formData.desiredClassId,
    currentStep: input.currentStep || 1,
    completionPercentage: percentage,
    formData: input.formData,
    missingRequiredFields: missingFields,
    lastSavedAt: now.toISOString(),
    expiresAt,
  };

  drafts.unshift(newDraft);
  safeWriteDrafts(drafts);
  return {
    success: true,
    draftId: newDraft.draftId,
    resumeToken: newDraft.resumeToken,
    progressPercentage: percentage,
    missingFields,
    draft: newDraft,
  };
}

/**
 * Resumes an existing draft via draftId and verification token/phone
 */
export function resumeDraftApplication(
  draftIdOrPhone: string,
  tokenOrPhoneVerify?: string
): { success: boolean; draft?: DraftApplication; error?: string } {
  const drafts = safeReadDrafts();
  const query = draftIdOrPhone.trim();

  const draft = drafts.find(
    (d) => d.draftId === query || d.guardianPhone === query
  );

  if (!draft) {
    return {
      success: false,
      error: "প্রদত্ত খসড়া আইডি বা ফোন নম্বরের কোনো সংরক্ষিত আবেদন পাওয়া যায়নি।",
    };
  }

  // Check expiration
  if (new Date(draft.expiresAt).getTime() < Date.now()) {
    return {
      success: false,
      error: "এই খসড়া আবেদনটির মেয়াদ উত্তীর্ণ হয়ে গেছে। অনুগ্রহ করে নতুন আবেদন শুরু করুন।",
    };
  }

  // Security Verification: If token provided, match token; if phone check provided, match phone
  if (tokenOrPhoneVerify) {
    const v = tokenOrPhoneVerify.trim();
    const tokenMatch = draft.resumeToken === v;
    const phoneMatch = draft.guardianPhone.endsWith(v) || draft.guardianPhone === v;

    if (!tokenMatch && !phoneMatch) {
      return {
        success: false,
        error: "খসড়া আবেদনের ভেরিফিকেশন কোড বা ফোন নম্বর মেলেনি।",
      };
    }
  }

  return { success: true, draft };
}

/**
 * Deletes a draft after successful final submission
 */
export function deleteDraftAfterSubmission(draftIdOrPhone: string): void {
  const drafts = safeReadDrafts();
  const filtered = drafts.filter(
    (d) => d.draftId !== draftIdOrPhone && d.guardianPhone !== draftIdOrPhone
  );
  safeWriteDrafts(filtered);
}
