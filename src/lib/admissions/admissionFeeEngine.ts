/**
 * EHRJ Digital Admissions 2.0 — Admission Fee Breakdown & Assistance Engine
 * Checkpoint: EHRJ-AI-2026-PHASE34
 * Computes transparent fee breakdowns based on authoritative FeeStructures and flags financial assistance candidates.
 */

import prisma from "@/lib/prisma";
import { AdmissionFeeBreakdown } from "./types";

/**
 * Computes the transparent fee breakdown for a chosen class and residential status
 */
export async function calculateAdmissionFeeBreakdown(
  classId: string,
  residentialStatus: string = "NON_RESIDENTIAL",
  isOrphan: boolean = false,
  isFinanciallyWeak: boolean = false
): Promise<AdmissionFeeBreakdown> {
  let classNameBn = "নির্ধারিত জামাত";
  let admissionFee = 2500;
  let sessionCharge = 1500;
  let monthlyTuition = 1200;
  let hostelFee = 0;

  try {
    // Lookup Class
    const jamatClass = await prisma.jamatClass.findUnique({
      where: { id: classId },
      include: {
        feeStructures: {
          where: { isActive: true },
        },
      },
    });

    if (jamatClass) {
      classNameBn = jamatClass.nameBn;

      // If fee structure exists in DB, use authoritative amounts
      const admissionFeeItem = jamatClass.feeStructures.find(
        (f) => f.feeType === "ADMISSION"
      );
      if (admissionFeeItem) admissionFee = admissionFeeItem.amount;

      const sessionChargeItem = jamatClass.feeStructures.find(
        (f) => f.feeType === "SESSION_CHARGE"
      );
      if (sessionChargeItem) sessionCharge = sessionChargeItem.amount;

      const tuitionItem = jamatClass.feeStructures.find(
        (f) => f.feeType === "TUITION"
      );
      if (tuitionItem) monthlyTuition = tuitionItem.amount;

      const hostelItem = jamatClass.feeStructures.find(
        (f) => f.feeType === "HOSTEL" || f.feeType === "RESIDENTIAL"
      );
      if (hostelItem) hostelFee = hostelItem.amount;
    }
  } catch (err) {
    // Fallback to baseline institutional structure
  }

  // Set hostel fee according to residential choice if not found in feeStructures
  if (residentialStatus === "RESIDENTIAL") {
    if (hostelFee === 0) hostelFee = 3500; // baseline residential lodging & boarding
  } else if (residentialStatus === "DAY_CARE") {
    if (hostelFee === 0) hostelFee = 1500; // daycare lunch and accommodation
  } else {
    hostelFee = 0;
  }

  let totalInitialPayable = admissionFee + sessionCharge + monthlyTuition + hostelFee;
  let isWaiverEligible = false;
  let waiverReason: string | undefined = undefined;

  if (isOrphan) {
    isWaiverEligible = true;
    waiverReason = "এতিম শিক্ষার্থী হিসেবে মাদরাসা লিল্লাহ তহবিল থেকে ১০০% ফি মওকুফের যোগ্য (প্রশাসনিক অনুমোদন সাপেক্ষে)";
  } else if (isFinanciallyWeak) {
    isWaiverEligible = true;
    waiverReason = "আর্থিকভাবে অসচ্ছল শিক্ষার্থী হিসেবে আংশিক রিদায়েতের আবেদন বিবেচনাধীন থাকবে";
  }

  return {
    classId,
    classNameBn,
    admissionFee,
    sessionCharge,
    monthlyTuition,
    hostelFee,
    totalInitialPayable,
    isWaiverEligible,
    waiverReason,
  };
}

// Alias for compatibility
export const calculateAdmissionFee = async (params: {
  classId: string;
  sessionId?: string;
  residentialStatus?: string;
  isOrphan?: boolean;
  isFinanciallyWeak?: boolean;
  financialAssistanceRequested?: boolean;
}) => {
  const breakdown = await calculateAdmissionFeeBreakdown(
    params.classId,
    params.residentialStatus || "NON_RESIDENTIAL",
    Boolean(params.isOrphan),
    Boolean(params.isFinanciallyWeak)
  );
  return {
    classId: breakdown.classId,
    admissionFee: breakdown.admissionFee,
    sessionFee: breakdown.sessionCharge,
    monthlyTuition: breakdown.monthlyTuition,
    residentialFee: breakdown.hostelFee,
    totalPayableAtAdmission: breakdown.totalInitialPayable,
    potentialAssistancePercentage: breakdown.isWaiverEligible ? (params.isOrphan ? 100 : 50) : 0,
    netPayableAfterAssistance: breakdown.isWaiverEligible && params.isOrphan ? 0 : breakdown.totalInitialPayable,
    assistanceReason: breakdown.waiverReason || null,
  };
};
