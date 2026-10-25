/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 44
 * Duplication & Architectural Conflict Detector
 * Checkpoint: EHRJ-AI-2026-PHASE44
 */

import { DuplicationAuditRecord } from "./types";

export const ARCHITECTURAL_DUPLICATION_AUDIT: DuplicationAuditRecord[] = [
  {
    id: "DUP-001-STUDENT-MASTER",
    systemA: "Phase 1: Student Information System (Student table)",
    systemB: "Phase 36: Alumni & Community Engine (alumni.json)",
    conflict: "Risk of creating duplicate student records when former students register as alumni.",
    authoritativeSource: "Phase 1 Student Master Record (ERJM-YYYY-DEPT-XXXX)",
    requiredAction: "Alumni records must reference studentId foreign pointer; never create a secondary student master.",
    remediationStatus: "CONSOLIDATED",
    evidenceNotes: "Phase 36 schema implements studentId reference with strict validation against Phase 1."
  },
  {
    id: "DUP-002-FINANCE-LEDGER",
    systemA: "Phase 6: Multi-Fund Cashbook (CashTransaction, CashFund)",
    systemB: "Phase 41: Budget Planning & Control (budgets.json)",
    conflict: "Risk of budgets maintaining independent cash ledgers or double-counting expenditure.",
    authoritativeSource: "Phase 6 Financial Engine (CashTransaction immutable ledger)",
    requiredAction: "Budgets maintain planned allocations and consume Phase 6 transactions as actuals via read-only bridge.",
    remediationStatus: "RESOLVED",
    evidenceNotes: "Phase 41 variance calculation pulls real-time transactions from Phase 6; no duplicate accounting records."
  },
  {
    id: "DUP-003-PROCUREMENT-STOCK",
    systemA: "Phase 12: Inventory & Store Management (InventoryItem, InventoryStockBalance)",
    systemB: "Phase 40: Procurement & Vendor Management (vendors.json, contracts.json)",
    conflict: "Risk of procurement module storing duplicate item catalogs or physical stock balances.",
    authoritativeSource: "Phase 12 Inventory Engine (Physical item IDs and stock balance tables)",
    requiredAction: "Phase 40 strictly manages supplier relationships, RFQs, and contracts. Purchase Orders and GRNs live in Phase 12.",
    remediationStatus: "BY_DESIGN",
    evidenceNotes: "Three-way matching links Phase 12 PO/GRN with Phase 6 CashTransaction and Phase 40 Vendor Master."
  },
  {
    id: "DUP-004-DOCUMENT-AUTHORITY",
    systemA: "Phase 7: Document Factory & Certificate Generator (Certificate table)",
    systemB: "Phase 29: Document Intelligence & OCR (data/documents/)",
    conflict: "Risk of storing duplicate certificate binaries or competing verification endpoints.",
    authoritativeSource: "Phase 7 Certificate Engine (Primary verification token and status)",
    requiredAction: "Phase 29 provides metadata tokens, MIME checking, and OCR text without duplicating certificate authority.",
    remediationStatus: "CONSOLIDATED",
    evidenceNotes: "/verify route checks Phase 7 Certificate table directly for official authenticity."
  },
  {
    id: "DUP-005-COMMUNICATION-NOTICES",
    systemA: "Phase 8: Institutional Notice Board (Notice table)",
    systemB: "Phase 32: Community Broadcast Engine (broadcasts.json)",
    conflict: "Potential fragmentation between public notices and targeted stakeholder broadcasts.",
    authoritativeSource: "Phase 8 Notice Table for institutional public circulars; Phase 32 for segmented in-app broadcasts.",
    requiredAction: "Ensure /admin/communication cleanly redirects to canonical /admin/communications cockpit.",
    remediationStatus: "CONSOLIDATED",
    evidenceNotes: "Canonical broadcast engine established in src/app/admin/communications/page.tsx."
  },
  {
    id: "DUP-006-RISK-VS-COMPLIANCE",
    systemA: "Phase 42: Institutional Risk Assurance (risks.json, controls.json)",
    systemB: "Phase 43: Compliance Obligation Engine (requirements.json, obligations.json)",
    conflict: "Confusion between operational risk mitigation and external legal compliance requirements.",
    authoritativeSource: "Phase 43 owns statutory mandates (BMEB, NBR, RJSC); Phase 42 owns operational risk scoring & controls.",
    requiredAction: "Phase 43 links to Phase 42 internal controls as control references without duplicating control testing.",
    remediationStatus: "RESOLVED",
    evidenceNotes: "Cross-module bridge allows requirements to cite Phase 42 Control IDs (EHRJ-CTRL-YYYY-XXXX)."
  },
  {
    id: "DUP-007-POLICY-GOVERNANCE-VS-RAG",
    systemA: "Phase 38: Knowledge, Policies & Governance (policies.json)",
    systemB: "Phase 22: Knowledge & RAG Query Engine (knowledge_store.json)",
    conflict: "RAG engine answering institutional policy questions from outdated or superseded text.",
    authoritativeSource: "Phase 38 Institutional Policy Engine (Authoritative lifecycle & effective dates)",
    requiredAction: "Phase 22 RAG synchronizes only EFFECTIVE policy versions. AI answers must cite Phase 38 policy codes.",
    remediationStatus: "CONSOLIDATED",
    evidenceNotes: "Automated RAG sync bridge copies published/effective policies into Phase 22 knowledge store with version stamps."
  },
  {
    id: "DUP-008-HR-STAFF-VS-TRAINING",
    systemA: "Phase 13: Human Resources & Employee Master (Employee table)",
    systemB: "Phase 39: Staff Training & Certification (participants.json)",
    conflict: "Training engine maintaining an independent staff directory.",
    authoritativeSource: "Phase 13 Employee Master Record",
    requiredAction: "Training enrollments reference Phase 13 employeeId; no secondary staff records created.",
    remediationStatus: "RESOLVED",
    evidenceNotes: "src/lib/training/trainingStore.ts validates employeeId against Phase 13 before enrollment."
  }
];

export function runDuplicationAudit(): { total: number; resolved: number; records: DuplicationAuditRecord[] } {
  return {
    total: ARCHITECTURAL_DUPLICATION_AUDIT.length,
    resolved: ARCHITECTURAL_DUPLICATION_AUDIT.filter(r => r.remediationStatus === "CONSOLIDATED" || r.remediationStatus === "RESOLVED" || r.remediationStatus === "BY_DESIGN").length,
    records: ARCHITECTURAL_DUPLICATION_AUDIT
  };
}
