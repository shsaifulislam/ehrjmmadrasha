/**
 * EHRJ MADRASHA ERP — PHASE 40
 * Contract Management & Versioning Engine
 * 
 * Governs Institutional Contracts, Immutable Version Snapshots,
 * Renewal Reminders (90, 60, 30, 7 Days), Deliverables & Obligations,
 * and Three-Way Match Integration.
 */

import { ProcurementStore } from "./procurementStore";
import {
  Contract,
  ContractStatus,
  ContractType,
  ContractDeliverable,
  ContractObligation,
  ContractVersionSnapshot,
  ContractRenewalReminder,
  ThreeWayMatchStatus,
  ActorContext,
} from "./types";

export class ContractEngine {
  /**
   * Generates next institutional Contract ID: EHRJ-CON-YYYY-XXXX
   */
  static generateNextContractId(year = new Date().getFullYear()): string {
    const contracts = ProcurementStore.getContracts();
    const prefix = `EHRJ-CON-${year}-`;
    const yearContracts = contracts.filter((c) => c.id.startsWith(prefix));
    let maxSeq = 0;

    for (const c of yearContracts) {
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
   * Generates default renewal reminders (90, 60, 30, 7 days before end date)
   */
  static generateRenewalReminders(endDateStr: string): ContractRenewalReminder[] {
    const end = new Date(endDateStr);
    const intervals = [90, 60, 30, 7];

    return intervals.map((days) => {
      const target = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
      return {
        reminderDays: days,
        targetDate: target.toISOString().split("T")[0],
        isTriggered: false,
      };
    });
  }

  /**
   * Creates a new Institutional Contract
   */
  static createContract(
    data: {
      vendorId: string;
      titleBn: string;
      titleEn?: string;
      contractType: ContractType;
      startDate: string;
      endDate: string;
      renewalDate?: string;
      totalContractValue: number;
      paymentTermsBn: string;
      rfqId?: string;
      quotationId?: string;
      purchaseOrderId?: string;
      budgetId?: string;
      deliverables?: Omit<ContractDeliverable, "id" | "isCompleted">[];
      obligations?: Omit<ContractObligation, "id" | "status">[];
      documentToken?: string;
      ownerName?: string;
      notes?: string;
    },
    actor: ActorContext
  ): Contract {
    const vendor = ProcurementStore.getVendorById(data.vendorId);
    if (!vendor) throw new Error(`Vendor not found: ${data.vendorId}`);

    const contractId = this.generateNextContractId();
    const contractCode = contractId.replace("EHRJ-", "");
    const now = new Date().toISOString();

    const deliverables: ContractDeliverable[] = (data.deliverables || []).map((d, i) => ({
      ...d,
      id: `dlv-${Date.now()}-${i + 1}`,
      isCompleted: false,
    }));

    const obligations: ContractObligation[] = (data.obligations || []).map((o, i) => ({
      ...o,
      id: `obg-${Date.now()}-${i + 1}`,
      status: "PENDING",
    }));

    const renewalReminders = this.generateRenewalReminders(data.endDate);

    const initialSnapshot: ContractVersionSnapshot = {
      versionNumber: 1,
      effectiveDate: data.startDate,
      changeReason: "প্রাথমিক অনুমোদিত চুক্তি সম্পাদন",
      totalContractValue: data.totalContractValue,
      paymentTerms: data.paymentTermsBn,
      approvedBy: actor.actorName,
      approvedAt: now,
      createdAt: now,
    };

    const contract: Contract = {
      id: contractId,
      contractCode,
      vendorId: vendor.id,
      vendorNameBn: vendor.legalNameBn,
      rfqId: data.rfqId,
      quotationId: data.quotationId,
      purchaseOrderId: data.purchaseOrderId,
      budgetId: data.budgetId,
      titleBn: data.titleBn.trim(),
      titleEn: data.titleEn?.trim() || data.titleBn.trim(),
      contractType: data.contractType,
      status: "DRAFT",
      currentVersion: 1,
      startDate: data.startDate,
      endDate: data.endDate,
      renewalDate: data.renewalDate || data.endDate,
      totalContractValue: data.totalContractValue,
      currency: "BDT",
      paymentTermsBn: data.paymentTermsBn,
      deliverables,
      obligations,
      versions: [initialSnapshot],
      renewalReminders,
      documentToken: data.documentToken,
      threeWayMatchStatus: "PENDING",
      ownerName: data.ownerName || actor.actorName,
      notes: data.notes,
      createdBy: actor.actorId,
      createdAt: now,
      updatedBy: actor.actorId,
      updatedAt: now,
    };

    ProcurementStore.saveContract(contract, actor);
    return contract;
  }

  /**
   * Transitions contract status
   */
  static transitionContractStatus(
    contractId: string,
    targetStatus: ContractStatus,
    reasonBn: string,
    actor: ActorContext
  ): Contract {
    const contract = ProcurementStore.getContractById(contractId);
    if (!contract) throw new Error(`Contract not found: ${contractId}`);

    const previousStatus = contract.status;
    contract.status = targetStatus;
    contract.updatedBy = actor.actorId;
    contract.updatedAt = new Date().toISOString();

    if (targetStatus === "ACTIVE" && !contract.approvedBy) {
      contract.approvedBy = actor.actorName;
      contract.approvedAt = new Date().toISOString();
    }

    ProcurementStore.saveContract(contract, actor);

    ProcurementStore.recordAudit({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      entityType: "CONTRACT",
      entityId: contract.id,
      action: "CONTRACT_STATUS_CHANGE",
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      notes: `চুক্তিপত্র স্ট্যাটাস পরিবর্তন: ${previousStatus} -> ${targetStatus}. কারণ: ${reasonBn}`,
      details: { previousStatus, targetStatus, reasonBn },
    });

    return contract;
  }

  /**
   * Creates a new contract version revision (Immutable history preservation)
   */
  static reviseContract(
    contractId: string,
    updates: {
      changeReason?: string;
      changeReasonBn?: string;
      newContractValue?: number;
      newEndDate?: string;
      newPaymentTermsBn?: string;
      newNotes?: string;
    },
    actor: ActorContext
  ): Contract {
    const contract = ProcurementStore.getContractById(contractId);
    if (!contract) throw new Error(`Contract not found: ${contractId}`);

    const newVersionNumber = contract.currentVersion + 1;
    const now = new Date().toISOString();

    if (updates.newContractValue !== undefined) {
      contract.totalContractValue = updates.newContractValue;
    }
    if (updates.newEndDate) {
      contract.endDate = updates.newEndDate;
      contract.renewalReminders = this.generateRenewalReminders(updates.newEndDate);
    }
    if (updates.newPaymentTermsBn) {
      contract.paymentTermsBn = updates.newPaymentTermsBn;
    }
    if (updates.newNotes) {
      contract.notes = `${contract.notes ? contract.notes + " | " : ""}${updates.newNotes}`;
    }

    contract.currentVersion = newVersionNumber;
    contract.updatedBy = actor.actorId;
    contract.updatedAt = now;

    const reason = (updates.changeReason || updates.changeReasonBn || "চুক্তিপত্র সংশোধন").trim();

    // Record snapshot
    const snapshot: ContractVersionSnapshot = {
      versionNumber: newVersionNumber,
      effectiveDate: now.split("T")[0],
      changeReason: reason,
      totalContractValue: contract.totalContractValue,
      paymentTerms: contract.paymentTermsBn,
      approvedBy: actor.actorName,
      approvedAt: now,
      createdAt: now,
    };

    contract.versions.push(snapshot);
    ProcurementStore.saveContract(contract, actor);

    ProcurementStore.recordAudit({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      entityType: "CONTRACT",
      entityId: contract.id,
      action: "REVISE_CONTRACT_VERSION",
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      notes: `চুক্তিপত্র সংশোধিত সংস্করণ (v${newVersionNumber}) অনুমোদিত: ${reason}`,
      details: { newVersionNumber, changeReason: reason, totalContractValue: contract.totalContractValue },
    });

    return contract;
  }

  /**
   * Scans and updates expiring contracts and marks reminders
   */
  static checkContractExpiries(): {
    expiringContracts: Contract[];
    triggeredReminders: { contractId: string; reminderDays: number; targetDate: string }[];
  } {
    const contracts = ProcurementStore.getContracts();
    const today = new Date().toISOString().split("T")[0];
    const expiringContracts: Contract[] = [];
    const triggeredReminders: { contractId: string; reminderDays: number; targetDate: string }[] = [];

    for (const c of contracts) {
      if (c.status !== "ACTIVE" && c.status !== "EXPIRING") continue;

      // Check if end date passed
      if (c.endDate < today) {
        c.status = "EXPIRED";
        c.updatedAt = new Date().toISOString();
        ProcurementStore.saveContract(c);
        continue;
      }

      // Check if within 60 days
      const daysRemaining = (new Date(c.endDate).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24);
      if (daysRemaining <= 60 && c.status === "ACTIVE") {
        c.status = "EXPIRING";
        c.updatedAt = new Date().toISOString();
        ProcurementStore.saveContract(c);
        expiringContracts.push(c);
      }

      // Check reminder thresholds
      for (const r of c.renewalReminders) {
        if (!r.isTriggered && r.targetDate <= today) {
          r.isTriggered = true;
          r.triggeredAt = new Date().toISOString();
          triggeredReminders.push({
            contractId: c.id,
            reminderDays: r.reminderDays,
            targetDate: r.targetDate,
          });
          ProcurementStore.saveContract(c);
        }
      }
    }

    return { expiringContracts, triggeredReminders };
  }

  /**
   * Completes a deliverable milestone
   */
  static markDeliverableComplete(
    contractId: string,
    deliverableId: string,
    actor: ActorContext
  ): Contract {
    const contract = ProcurementStore.getContractById(contractId);
    if (!contract) throw new Error(`Contract not found: ${contractId}`);

    const dlv = contract.deliverables.find((d) => d.id === deliverableId);
    if (!dlv) throw new Error(`Deliverable not found: ${deliverableId}`);

    dlv.isCompleted = true;
    dlv.completedAt = new Date().toISOString();
    contract.updatedAt = new Date().toISOString();

    ProcurementStore.saveContract(contract, actor);
    return contract;
  }

  static markDeliverableCompleted(
    contractId: string,
    deliverableId: string,
    actor: ActorContext
  ): Contract {
    return this.markDeliverableComplete(contractId, deliverableId, actor);
  }

  static checkExpiringContracts(_daysAhead?: number): Contract[] {
    return this.checkContractExpiries().expiringContracts;
  }
}
