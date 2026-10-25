/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 43
 * Institutional Compliance Evidence Management & Verification Engine
 * Checkpoint: EHRJ-AI-2026-PHASE43
 */

import crypto from "crypto";
import { ComplianceStore } from "./complianceStore";
import {
  ComplianceEvidence,
  EvidenceType,
  EvidenceVerificationStatus,
  ActorContext,
} from "./types";

export class EvidenceVerificationEngine {
  /**
   * Generates formatted Evidence ID: EHRJ-EVD-CMP-YYYY-XXXX
   */
  static generateEvidenceId(year: number = new Date().getFullYear()): string {
    const evidenceList = ComplianceStore.getEvidence();
    const prefix = `EHRJ-EVD-CMP-${year}-`;
    const matching = evidenceList
      .map((e) => e.id)
      .filter((id) => id.startsWith(prefix));

    let maxNum = 0;
    for (const id of matching) {
      const parts = id.split("-");
      const numStr = parts[parts.length - 1];
      const parsed = parseInt(numStr, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
    const nextNum = (maxNum + 1).toString().padStart(4, "0");
    return `${prefix}${nextNum}`;
  }

  /**
   * Records a new compliance evidence reference (linking to Phase 29 without duplicating files)
   */
  static recordEvidence(
    params: {
      obligationId: string;
      title: string;
      source: string;
      evidenceType: EvidenceType;
      fileToken?: string;
      hash?: string;
      dateCollected?: string;
      expiryDate?: string;
    },
    actor: ActorContext
  ): ComplianceEvidence {
    if (!params.obligationId?.trim()) {
      throw new Error("দায়িত্ব আইডি (Obligation ID) প্রদান বাধ্যতামূলক।");
    }
    if (!params.title?.trim()) {
      throw new Error("প্রমাণের শিরোনাম (Title) বাধ্যতামূলক।");
    }
    if (!params.source?.trim()) {
      throw new Error("প্রমাণের উৎস (Source) প্রদান আবশ্যক।");
    }

    const id = this.generateEvidenceId();
    const now = new Date().toISOString();
    const evidenceHash =
      params.hash ||
      crypto
        .createHash("sha256")
        .update(`${id}-${params.title}-${params.source}-${now}`)
        .digest("hex");

    const newEvidence: ComplianceEvidence = {
      id,
      obligationId: params.obligationId.trim(),
      title: params.title.trim(),
      source: params.source.trim(),
      evidenceType: params.evidenceType,
      fileToken: params.fileToken?.trim(),
      hash: evidenceHash,
      dateCollected: params.dateCollected || now.slice(0, 10),
      expiryDate: params.expiryDate,
      collectorId: actor.userId,
      collectorName: actor.userName,
      verificationStatus: "PENDING",
      createdAt: now,
    };

    const evidenceList = ComplianceStore.getEvidence();
    evidenceList.unshift(newEvidence);
    ComplianceStore.saveEvidence(evidenceList);

    // Link evidence ID to obligation
    const obligations = ComplianceStore.getObligations();
    const oblIndex = obligations.findIndex((o) => o.id === params.obligationId);
    if (oblIndex !== -1) {
      if (!obligations[oblIndex].evidenceIds.includes(id)) {
        obligations[oblIndex].evidenceIds.push(id);
        obligations[oblIndex].updatedAt = now;
        ComplianceStore.saveObligations(obligations);
      }
    }

    ComplianceStore.logAudit(
      "EVIDENCE",
      newEvidence.id,
      "EVIDENCE_RECORDED",
      actor,
      { newEvidence }
    );

    return newEvidence;
  }

  /**
   * Formal verification of evidence by authorized reviewer (Section 15)
   * Principle: Evidence cannot automatically prove compliance simply because a file exists.
   */
  static verifyEvidence(
    evidenceId: string,
    verificationStatus: EvidenceVerificationStatus,
    notes: string,
    actor: ActorContext
  ): ComplianceEvidence {
    if (actor.userRole !== "PRINCIPAL" && actor.userRole !== "ADMIN") {
      throw new Error("শুধুমাত্র অধ্যক্ষ অথবা দায়িত্বপ্রাপ্ত প্রশাসনিক কর্মকর্তা প্রমাণপত্র যাচাই করতে পারেন।");
    }
    if (verificationStatus === "REJECTED" && !notes?.trim()) {
      throw new Error("প্রমাণপত্র প্রত্যাখ্যানের ক্ষেত্রে সুস্পষ্ট কারণ উল্লেখ আবশ্যক।");
    }

    const evidenceList = ComplianceStore.getEvidence();
    const index = evidenceList.findIndex((e) => e.id === evidenceId);
    if (index === -1) {
      throw new Error(`প্রমাণপত্র পাওয়া যায়নি: ${evidenceId}`);
    }

    const existing = evidenceList[index];
    const now = new Date().toISOString();

    const updated: ComplianceEvidence = {
      ...existing,
      verificationStatus,
      verifiedBy: `${actor.userName} (${actor.userId})`,
      verifiedAt: now,
      verificationNotes: notes.trim(),
    };

    evidenceList[index] = updated;
    ComplianceStore.saveEvidence(evidenceList);

    ComplianceStore.logAudit(
      "EVIDENCE",
      evidenceId,
      `EVIDENCE_${verificationStatus}`,
      actor,
      { status: verificationStatus, notes }
    );

    return updated;
  }

  /**
   * Scans for expired evidence
   */
  static scanExpiredEvidence(): number {
    const evidenceList = ComplianceStore.getEvidence();
    const nowStr = new Date().toISOString().slice(0, 10);
    let expiredCount = 0;

    for (let i = 0; i < evidenceList.length; i++) {
      if (
        evidenceList[i].verificationStatus === "VERIFIED" &&
        evidenceList[i].expiryDate &&
        evidenceList[i].expiryDate! < nowStr
      ) {
        evidenceList[i].verificationStatus = "EXPIRED";
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      ComplianceStore.saveEvidence(evidenceList);
    }
    return expiredCount;
  }
}
