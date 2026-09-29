/**
 * EHRJ Alumni Contribution & Finance Linkage Engine
 * Checkpoint: EHRJ-AI-2026-PHASE36
 * Invariant: Financial contributions link to Phase 6 Finance funds.
 * Invariant: NO duplicate payment gateway or payment engine is created.
 */

import { AlumniContribution } from "./types";
import {
  getRawAlumniContributions,
  saveAlumniContributions,
  getAlumniById,
  getAlumniProfiles,
  saveAlumniProfiles,
  appendAlumniAudit,
} from "./alumniStore";

export const ALLOWED_FINANCE_FUNDS = [
  "GENERAL",
  "LILLAH",
  "ZAKAT",
  "CONSTRUCTION",
  "ORPHAN_SUPPORT",
] as const;

/**
 * Returns contributions, optionally filtered by alumniId.
 */
export function getAlumniContributions(alumniId?: string): AlumniContribution[] {
  const all = getRawAlumniContributions();
  if (alumniId) {
    return all.filter((c) => c.alumniId === alumniId);
  }
  return all;
}

/**
 * Returns summary statistics for alumni contributions.
 */
export function getAlumniContributionsSummary(alumniId?: string) {
  const contributions = getAlumniContributions(alumniId);

  let totalFinancialAmount = 0;
  let inKindCount = 0;
  const byFund: Record<string, number> = {};

  for (const c of contributions) {
    if (c.type === "FINANCIAL" && c.amount) {
      totalFinancialAmount += c.amount;
      const f = c.fund || "GENERAL";
      byFund[f] = (byFund[f] || 0) + c.amount;
    } else {
      inKindCount++;
    }
  }

  return {
    totalCount: contributions.length,
    totalFinancialAmount,
    inKindCount,
    byFund,
  };
}

/**
 * Records an alumni contribution (financial or in-kind).
 * Directly references Phase 6 Finance funds without creating any parallel payment engine.
 */
export async function recordAlumniContribution(
  params: {
    alumniId: string;
    type: "FINANCIAL" | "IN_KIND" | "VOLUNTEER_EFFORT";
    fund?: string;
    amount?: number;
    currency?: string;
    inKindDescription?: string;
    purposeBn?: string;
    purposeEn?: string;
    isPubliclyVisible?: boolean;
    paymentReference?: string;
  },
  actorId: string
): Promise<AlumniContribution> {
  const { alumniId, type, fund, amount, currency = "BDT", inKindDescription, purposeBn, purposeEn, isPubliclyVisible = true, paymentReference } = params;

  const alumni = getAlumniById(alumniId);
  if (!alumni) {
    throw new Error(`Alumni profile '${alumniId}' not found`);
  }

  if (type === "FINANCIAL") {
    if (!fund || !ALLOWED_FINANCE_FUNDS.includes(fund as any)) {
      throw new Error(`Invalid fund: ${fund}. Allowed funds: ${ALLOWED_FINANCE_FUNDS.join(", ")}`);
    }
    if (!amount || amount <= 0) {
      throw new Error("Financial contribution amount must be greater than zero.");
    }
  }

  const contributions = getRawAlumniContributions();
  const currentYear = new Date().getFullYear();
  const nextSeq = contributions.length + 1;
  const contribId = `EHRJ-ALM-CTB-${currentYear}-${String(nextSeq).padStart(5, "0")}`;

  const newContrib: AlumniContribution = {
    id: contribId,
    alumniId,
    alumniNameBn: alumni.fullNameBn,
    type,
    fund: type === "FINANCIAL" ? fund : undefined,
    fundType: type === "FINANCIAL" ? (fund as any) : undefined,
    amount: type === "FINANCIAL" ? amount : undefined,
    amountBdt: type === "FINANCIAL" ? amount : undefined,
    currency,
    inKindDescription: type === "IN_KIND" ? inKindDescription : undefined,
    descriptionBn: purposeBn || inKindDescription,
    purposeBn,
    purposeEn,
    isPubliclyVisible,
    paymentReference: paymentReference || `FIN-ALM-REF-${Date.now()}`,
    contributionDate: new Date().toISOString(),
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  };

  contributions.unshift(newContrib);
  saveAlumniContributions(contributions);

  // Update profile accumulated total if financial
  if (type === "FINANCIAL" && amount) {
    const profiles = getAlumniProfiles();
    const pIndex = profiles.findIndex((p) => p.id === alumniId);
    if (pIndex >= 0) {
      profiles[pIndex].contributionsTotalBdt = (profiles[pIndex].contributionsTotalBdt || 0) + amount;
      saveAlumniProfiles(profiles);
    }
  }

  appendAlumniAudit({
    alumniId,
    action: "CONTRIBUTION_RECORDED",
    actorId,
    actorRole: "ADMIN",
    details: `অ্যালামনাই অবদান লিপিবদ্ধ: ${alumni.fullNameBn} - ${type === "FINANCIAL" ? `৳${amount} (${fund})` : inKindDescription}`,
  });

  return newContrib;
}
