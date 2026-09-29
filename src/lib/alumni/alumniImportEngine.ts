/**
 * EHRJ Alumni Legacy Data Batch Import & Deduplication Engine
 * Checkpoint: EHRJ-AI-2026-PHASE36
 * Invariant: Preserves historical records with duplicate detection (Phone, Email, Name+Year).
 */

import { AlumniProfile, AlumniImportBatch } from "./types";
import {
  getAlumniProfiles,
  saveAlumniProfiles,
  getImportBatches,
  saveImportBatches,
  appendAlumniAudit,
} from "./alumniStore";

export interface ImportRowData {
  studentId?: string;
  fullNameBn: string;
  fullNameEn?: string;
  passOutYear?: number | string;
  department?: string;
  phone?: string;
  email?: string;
  currentProfession?: string;
  currentOrganization?: string;
  currentCity?: string;
  legacySourceNote?: string;
}

export interface ImportPreviewDiagnostic {
  batchName: string;
  sourceFormat: string;
  totalRows: number;
  validCount: number;
  duplicatesCount: number;
  errors: Array<{ rowIndex: number; message: string }>;
  duplicates: Array<{
    rowIndex: number;
    matchField: string;
    matchReason: string;
    existingProfileId: string;
  }>;
}

/**
 * Previews and validates batch rows, flagging schema errors and duplicates.
 */
export function previewBatchImport(
  batchName: string,
  rows: ImportRowData[],
  sourceFormat: "CSV" | "JSON" | string = "JSON"
): ImportPreviewDiagnostic {
  const existingProfiles = getAlumniProfiles();
  const errors: Array<{ rowIndex: number; message: string }> = [];
  const duplicates: Array<{
    rowIndex: number;
    matchField: string;
    matchReason: string;
    existingProfileId: string;
  }> = [];

  let validCount = 0;

  rows.forEach((row, idx) => {
    const rowNum = idx + 1;

    // Validation
    if (!row.fullNameBn || !row.fullNameBn.trim()) {
      errors.push({ rowIndex: rowNum, message: "পূর্ণ নাম (বাংলা) আবশ্যক।" });
      return;
    }

    if (!row.studentId || !row.studentId.trim()) {
      errors.push({ rowIndex: rowNum, message: "ছাত্র আইডি আবশ্যক।" });
      return;
    }

    const year = typeof row.passOutYear === "string" ? parseInt(row.passOutYear, 10) : row.passOutYear;
    if (!year || isNaN(year) || year < 1970 || year > 2050) {
      errors.push({ rowIndex: rowNum, message: "সঠিক পাসিং বছর আবশ্যক।" });
      return;
    }

    // Duplicate detection against existing alumni profiles
    let isDuplicate = false;
    for (const existing of existingProfiles) {
      if (row.phone && existing.phone && row.phone.trim() === existing.phone.trim()) {
        duplicates.push({
          rowIndex: rowNum,
          matchField: "phone",
          matchReason: `Phone match with existing profile ${existing.id} (${existing.fullNameBn})`,
          existingProfileId: existing.id,
        });
        isDuplicate = true;
        break;
      }

      if (row.email && existing.email && row.email.toLowerCase().trim() === existing.email.toLowerCase().trim()) {
        duplicates.push({
          rowIndex: rowNum,
          matchField: "email",
          matchReason: `Email match with existing profile ${existing.id}`,
          existingProfileId: existing.id,
        });
        isDuplicate = true;
        break;
      }

      if (
        row.fullNameBn.trim() === existing.fullNameBn.trim() &&
        year === (existing.passOutYear || existing.completionYear)
      ) {
        duplicates.push({
          rowIndex: rowNum,
          matchField: "name_year",
          matchReason: `Same name and pass out year (${year}) with profile ${existing.id}`,
          existingProfileId: existing.id,
        });
        isDuplicate = true;
        break;
      }
    }

    validCount++;
  });

  return {
    batchName,
    sourceFormat,
    totalRows: rows.length,
    validCount,
    duplicatesCount: duplicates.length,
    errors,
    duplicates,
  };
}

/**
 * Commits approved import rows into datastore.
 */
export async function executeBatchImport(
  batchName: string,
  rows: ImportRowData[],
  sourceFormat: "CSV" | "JSON" | string = "JSON",
  actorId: string,
  autoVerifyLegacy: boolean = false
): Promise<{ batchId: string; importedCount: number; skippedCount: number; errorCount: number }> {
  const preview = previewBatchImport(batchName, rows, sourceFormat);
  const existingProfiles = getAlumniProfiles();
  const currentYear = new Date().getFullYear();

  let importedCount = 0;
  let skippedCount = 0;
  const duplicateRowIndexes = new Set(preview.duplicates.map((d) => d.rowIndex));
  const errorRowIndexes = new Set(preview.errors.map((e) => e.rowIndex));

  const batches = getImportBatches();
  const batchId = `BAT-ALM-${Date.now()}`;

  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    if (errorRowIndexes.has(rowNum)) {
      return;
    }
    if (duplicateRowIndexes.has(rowNum)) {
      skippedCount++;
      return;
    }

    const year = typeof row.passOutYear === "string" ? parseInt(row.passOutYear, 10) : row.passOutYear || currentYear;
    const nextSeq = existingProfiles.length + 1;
    const alumniId = `EHRJ-ALM-${currentYear}-${String(nextSeq).padStart(6, "0")}`;

    const newProfile: AlumniProfile = {
      id: alumniId,
      relationshipType: "LEGACY_ALUMNI",
      status: autoVerifyLegacy ? "VERIFIED" : "PENDING_VERIFICATION",
      isVerified: autoVerifyLegacy,
      studentId: row.studentId || `LEGACY-${year}-${nextSeq}`,
      studentIdNumber: row.studentId,
      isLegacy: true,
      legacySourceNote: row.legacySourceNote || `ঐতিহাসিক ইমপোর্ট ব্যাচ: ${batchName}`,
      completionYear: year,
      passOutYear: year,
      department: row.department || "General",
      fullNameBn: row.fullNameBn.trim(),
      fullNameEn: row.fullNameEn?.trim(),
      phone: row.phone?.trim(),
      email: row.email?.trim(),
      currentProfession: row.currentProfession?.trim(),
      profession: row.currentProfession?.trim(),
      currentOrganization: row.currentOrganization?.trim(),
      organization: row.currentOrganization?.trim(),
      currentCity: row.currentCity?.trim(),
      currentCountry: "বাংলাদেশ",
      privacy: {
        isProfilePublic: true,
        showEmail: false,
        showPhone: false,
        showLocation: true,
        showProfession: true,
        showInDirectory: true,
        allowMentorshipContact: true,
        allowEventInvites: true,
        allowNewsletter: true,
        showInPublicDirectory: true,
        allowDirectContact: false,
        sharePhoneWithApprovedAlumni: false,
        shareEmailWithApprovedAlumni: false,
        allowMentorshipRequests: true,
      },
      privacyPreferences: {
        showInPublicDirectory: true,
        allowDirectContact: false,
        sharePhoneWithApprovedAlumni: false,
        shareEmailWithApprovedAlumni: false,
        allowMentorshipRequests: true,
      },
      volunteerHoursTotal: 0,
      mentorshipSessionsCount: 0,
      eventsAttendedCount: 0,
      contributionsTotalBdt: 0,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    existingProfiles.push(newProfile);
    importedCount++;
  });

  saveAlumniProfiles(existingProfiles);

  const importBatchRecord: AlumniImportBatch = {
    id: batchId,
    batchName,
    sourceFormat: sourceFormat as any,
    totalRows: rows.length,
    importedCount,
    duplicatesCount: preview.duplicatesCount,
    errorsCount: preview.errors.length,
    uploadedByUserId: actorId,
    createdAt: new Date().toISOString(),
  };

  batches.unshift(importBatchRecord);
  saveImportBatches(batches);

  appendAlumniAudit({
    action: "BATCH_IMPORT",
    actorId,
    actorRole: "ADMIN",
    details: `ঐতিহাসিক অ্যালামনাই ডেটা ইমপোর্ট: ব্যাচ ${batchName} (${importedCount} টি যুক্ত, ${skippedCount} টি বাদ)`,
  });

  return {
    batchId,
    importedCount,
    skippedCount,
    errorCount: preview.errors.length,
  };
}
