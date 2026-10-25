/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 42
 * Institutional Internal Control Register & Testing Engine
 * Checkpoint: EHRJ-AI-2026-PHASE42
 */

import { RiskAssuranceStore } from "./riskAssuranceStore";
import {
  InstitutionalControl,
  ControlTestRecord,
  ControlException,
  RiskCategory,
  RiskSourceModule,
  ControlType,
  ExecutionType,
  ControlFrequency,
  ControlEffectiveness,
  ActorContext,
} from "./types";

export class ControlRegisterEngine {
  /**
   * Generates next institutional Control ID: EHRJ-CTRL-YYYY-XXXX
   */
  static generateNextControlId(year = new Date().getFullYear()): string {
    const controls = RiskAssuranceStore.getControls();
    const prefix = `EHRJ-CTRL-${year}-`;
    const yearControls = controls.filter((c) => c.id.startsWith(prefix));
    let maxSeq = 0;

    for (const c of yearControls) {
      const parts = c.id.split("-");
      const seq = parseInt(parts[3], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(4, "0");
    return `${prefix}${nextSeq}`;
  }

  /**
   * Generates next Control Test ID: EHRJ-CTEST-YYYY-XXXX
   */
  static generateNextTestId(year = new Date().getFullYear()): string {
    const tests = RiskAssuranceStore.getControlTests();
    const prefix = `EHRJ-CTEST-${year}-`;
    const yearTests = tests.filter((t) => t.id.startsWith(prefix));
    let maxSeq = 0;

    for (const t of yearTests) {
      const parts = t.id.split("-");
      const seq = parseInt(parts[3], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(4, "0");
    return `${prefix}${nextSeq}`;
  }

  /**
   * Generates next Control Exception ID: EHRJ-EXC-YYYY-XXXX
   */
  static generateNextExceptionId(year = new Date().getFullYear()): string {
    const exceptions = RiskAssuranceStore.getExceptions();
    const prefix = `EHRJ-EXC-${year}-`;
    const yearExceptions = exceptions.filter((e) => e.id.startsWith(prefix));
    let maxSeq = 0;

    for (const e of yearExceptions) {
      const parts = e.id.split("-");
      const seq = parseInt(parts[3], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(4, "0");
    return `${prefix}${nextSeq}`;
  }

  /**
   * Creates a new Institutional Internal Control
   */
  static createControl(
    data: {
      nameBn: string;
      nameEn?: string;
      descriptionBn: string;
      controlObjectiveBn: string;
      category: RiskCategory;
      controlType: ControlType;
      executionType: ExecutionType;
      frequency: ControlFrequency;
      ownerName: string;
      ownerRole: string;
      relatedRiskIds?: string[];
      sourceModule: RiskSourceModule;
      evidenceRequirementBn: string;
      testingMethodBn: string;
      nextTestDueDate?: string;
    },
    actor: ActorContext
  ): InstitutionalControl {
    const id = this.generateNextControlId();
    const controlCode = id.replace("EHRJ-", "");
    const now = new Date().toISOString();
    const defaultNextTest = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

    const control: InstitutionalControl = {
      id,
      controlCode,
      nameBn: data.nameBn.trim(),
      nameEn: data.nameEn?.trim() || data.nameBn.trim(),
      descriptionBn: data.descriptionBn.trim(),
      controlObjectiveBn: data.controlObjectiveBn.trim(),
      category: data.category,
      controlType: data.controlType,
      executionType: data.executionType,
      frequency: data.frequency,
      ownerName: data.ownerName,
      ownerRole: data.ownerRole,
      relatedRiskIds: data.relatedRiskIds || [],
      sourceModule: data.sourceModule,
      evidenceRequirementBn: data.evidenceRequirementBn.trim(),
      testingMethodBn: data.testingMethodBn.trim(),
      status: "ACTIVE",
      nextTestDueDate: data.nextTestDueDate || defaultNextTest,
      exceptionCount: 0,
      createdBy: actor.actorId,
      createdAt: now,
      updatedBy: actor.actorId,
      updatedAt: now,
    };

    RiskAssuranceStore.saveControl(control, actor);

    // If related risks provided, link this control to those risks
    if (data.relatedRiskIds && data.relatedRiskIds.length > 0) {
      for (const rId of data.relatedRiskIds) {
        const risk = RiskAssuranceStore.getRiskById(rId);
        if (risk && !risk.existingControlIds.includes(control.id)) {
          risk.existingControlIds.push(control.id);
          risk.updatedAt = now;
          RiskAssuranceStore.saveRisk(risk);
        }
      }
    }

    return control;
  }

  /**
   * Executes and records a formal Internal Control Test
   * NEVER claims a control is effective without verifiable evidence.
   */
  static recordControlTest(
    data: {
      controlId: string;
      testMethod: string;
      populationDescription: string;
      sampleSize: number;
      expectedResultBn: string;
      actualResultBn: string;
      result: ControlEffectiveness;
      exceptionCount: number;
      evidenceRef: string;
      phase29DocToken?: string;
      notes?: string;
    },
    tester: ActorContext
  ): ControlTestRecord {
    const control = RiskAssuranceStore.getControlById(data.controlId);
    if (!control) throw new Error(`Control not found: ${data.controlId}`);

    const id = this.generateNextTestId();
    const now = new Date().toISOString();
    const testDate = now.split("T")[0];

    const testRecord: ControlTestRecord = {
      id,
      controlId: control.id,
      testDate,
      testerName: tester.actorName,
      testerRole: tester.actorRole,
      testMethod: data.testMethod.trim(),
      populationDescription: data.populationDescription.trim(),
      sampleSize: data.sampleSize,
      expectedResultBn: data.expectedResultBn.trim(),
      actualResultBn: data.actualResultBn.trim(),
      result: data.result,
      exceptionCount: data.exceptionCount,
      evidenceRef: data.evidenceRef.trim(),
      phase29DocToken: data.phase29DocToken,
      notes: data.notes || "",
      createdAt: now,
    };

    RiskAssuranceStore.saveControlTest(testRecord, tester);

    // Update control's test outcome and next test due date (e.g., 30 days ahead)
    control.lastTestResult = data.result;
    control.lastTestedDate = testDate;
    control.nextTestDueDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    control.exceptionCount += data.exceptionCount;
    control.updatedBy = tester.actorId;
    control.updatedAt = now;
    RiskAssuranceStore.saveControl(control);

    return testRecord;
  }

  /**
   * Records a formal, time-bounded Control Exception with a Compensating Control
   */
  static recordException(
    data: {
      controlId: string;
      exceptionReasonBn: string;
      scopeBn: string;
      startDate: string;
      endDate: string;
      compensatingControlBn: string;
      evidenceRef?: string;
      reviewDate?: string;
    },
    approver: ActorContext
  ): ControlException {
    const control = RiskAssuranceStore.getControlById(data.controlId);
    if (!control) throw new Error(`Control not found: ${data.controlId}`);

    if (approver.actorRole !== "PRINCIPAL" && approver.actorRole !== "ADMIN") {
      throw new Error("শুধুমাত্র অধ্যক্ষ অথবা প্রশাসনিক প্রধান নিয়ন্ত্রণ ব্যতিক্রম (Control Exception) অনুমোদন করতে পারবেন।");
    }

    const id = this.generateNextExceptionId();
    const now = new Date().toISOString();

    const exception: ControlException = {
      id,
      controlId: control.id,
      exceptionReasonBn: data.exceptionReasonBn.trim(),
      scopeBn: data.scopeBn.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      compensatingControlBn: data.compensatingControlBn.trim(),
      approvedBy: approver.actorName,
      approvedAt: now,
      status: "ACTIVE",
      evidenceRef: data.evidenceRef,
      reviewDate: data.reviewDate || data.endDate,
      createdAt: now,
      updatedAt: now,
    };

    RiskAssuranceStore.saveException(exception, approver);
    return exception;
  }

  /**
   * Scans and marks expired exceptions (Never silently continues expired exceptions)
   */
  static scanExpiredExceptions(): { expiredCount: number; expiredIds: string[] } {
    const exceptions = RiskAssuranceStore.getExceptions();
    const today = new Date().toISOString().split("T")[0];
    const expiredIds: string[] = [];

    for (const exc of exceptions) {
      if (exc.status === "ACTIVE" && exc.endDate < today) {
        exc.status = "EXPIRED";
        exc.updatedAt = new Date().toISOString();
        RiskAssuranceStore.saveException(exc);
        expiredIds.push(exc.id);
      }
    }

    return { expiredCount: expiredIds.length, expiredIds };
  }

  /**
   * Control Gap Analysis:
   * Returns uncontrolled risks, weakly controlled risks, and ineffective controls
   */
  static performControlGapAnalysis(): {
    uncontrolledRisks: string[];
    ineffectiveControls: string[];
    criticalRisksWithWeakControls: string[];
  } {
    const risks = RiskAssuranceStore.getRisks();
    const controls = RiskAssuranceStore.getControls();

    const uncontrolledRisks = risks
      .filter((r) => r.existingControlIds.length === 0 && r.status !== "CLOSED")
      .map((r) => r.id);

    const ineffectiveControls = controls
      .filter((c) => c.lastTestResult === "INEFFECTIVE" && c.status === "ACTIVE")
      .map((c) => c.id);

    const criticalRisksWithWeakControls = risks
      .filter((r) => {
        if (r.inherentLevel !== "CRITICAL" && r.residualLevel !== "CRITICAL") return false;
        if (r.existingControlIds.length === 0) return true;
        // Check if any mapped control is ineffective
        return r.existingControlIds.some((cid) => {
          const ctrl = controls.find((c) => c.id === cid);
          return !ctrl || ctrl.lastTestResult === "INEFFECTIVE" || ctrl.lastTestResult === "NOT_TESTED";
        });
      })
      .map((r) => r.id);

    return {
      uncontrolledRisks,
      ineffectiveControls,
      criticalRisksWithWeakControls,
    };
  }
}
