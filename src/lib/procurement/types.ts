/**
 * EHRJ MADRASHA ERP — PHASE 40
 * Institutional Procurement, Vendor, Contract & Supplier Relationship Management Engine
 * Types and Domain Definitions
 * 
 * Non-Negotiable Source-Of-Truth Architecture:
 * 1. Phase 40 owns: Vendor master, supplier relationships, vendor onboarding, verification,
 *    contacts, compliance records, RFQ/quotation relations, contract management, contract versions,
 *    vendor performance, supplier risk, and procurement relationship history.
 * 2. Phase 12 owns: Inventory, stock, Purchase Request, Purchase Order operational inventory workflow,
 *    goods receiving, stock movement, asset acquisition.
 * 3. Phase 6 owns: Financial transactions, payments, funds, cashbook, payment receipts.
 * 4. Phase 41 owns: Budgets, budget allocations, budget control, and budget variance.
 * 5. Phase 29 owns: Document repository and OCR intelligence (Phase 40 stores references only).
 * 6. Strictly NO SMS — in-app portal alerts and calendar schedules only.
 * 7. Automate the process, not the authority. AI assists; authorized humans decide.
 */

export type VendorType =
  | "SUPPLIER"
  | "CONTRACTOR"
  | "SERVICE_PROVIDER"
  | "CONSULTANT"
  | "MANUFACTURER"
  | "DISTRIBUTOR"
  | "LOCAL_VENDOR"
  | "OTHER";

export type VendorCategoryCode =
  | "FOOD"
  | "BOOKS"
  | "STATIONERY"
  | "FURNITURE"
  | "IT"
  | "ELECTRONICS"
  | "CONSTRUCTION"
  | "ELECTRICAL"
  | "PLUMBING"
  | "TRANSPORT"
  | "CLEANING"
  | "MAINTENANCE"
  | "PROFESSIONAL_SERVICES"
  | "TRAINING"
  | "OTHER";

export type VendorStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "SUSPENDED"
  | "BLOCKED"
  | "INACTIVE"
  | "ARCHIVED";

export type VendorRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type VerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"
  | "NOT_REQUIRED";

export type RFQStatus =
  | "DRAFT"
  | "OPEN"
  | "CLOSED"
  | "EVALUATION"
  | "CANCELLED"
  | "AWARDED";

export type QuotationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_EVALUATION"
  | "ACCEPTED"
  | "REJECTED"
  | "SUPERSEDED"
  | "WITHDRAWN";

export type ContractType =
  | "SUPPLY"
  | "WORKS_CONSTRUCTION"
  | "SERVICE_MAINTENANCE"
  | "CONSULTANCY"
  | "ANNUAL_MAINTENANCE_AMC"
  | "LEASE"
  | "OTHER";

export type ContractStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "ACTIVE"
  | "EXPIRING"
  | "EXPIRED"
  | "TERMINATED"
  | "CANCELLED"
  | "ARCHIVED";

export type ThreeWayMatchStatus =
  | "MATCHED"
  | "PARTIALLY_MATCHED"
  | "MISMATCH"
  | "PENDING";

// =================================================================
// 1. VENDOR MASTER & CONTACTS
// =================================================================

export interface VendorContact {
  id: string;
  name: string;
  designation: string;
  phone: string;
  email?: string;
  department?: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface VendorVerificationRecord {
  id: string;
  type: "IDENTITY" | "TRADE_LICENSE" | "TIN_TAX" | "BIN_VAT" | "BANK_ACCOUNT" | "CONTRACT_COMPLIANCE";
  titleBn: string;
  status: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  expiryDate?: string;
  evidenceRef?: string;
  notes?: string;
}

export interface VendorDocumentReference {
  id: string;
  phase29DocToken?: string;
  documentType: string;
  title: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt: string;
  expiryDate?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface VendorComplianceRecord {
  id: string;
  titleBn: string;
  status: "COMPLIANT" | "NON_COMPLIANT" | "PENDING_REVIEW";
  checkDate: string;
  notes?: string;
  assessedBy: string;
}

export interface Vendor {
  id: string; // e.g. EHRJ-VEN-2026-0001
  vendorCode: string;
  legalNameBn: string;
  legalNameEn: string;
  displayName: string;
  vendorType: VendorType;
  categoryCode: VendorCategoryCode;
  categoryNameBn: string;
  status: VendorStatus;
  riskLevel: VendorRiskLevel;
  verificationStatus: VerificationStatus;

  // Contact Info
  phone: string;
  altPhone?: string;
  email?: string;
  addressBn: string;
  district: string;
  country: string;

  // Registrations & Compliance
  tradeLicenseNo?: string;
  tinNumber?: string;
  binVatNumber?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountTitle?: string;
  bankAccountNumberMasked?: string; // e.g. "•••• •••• 4589"

  contacts: VendorContact[];
  verifications: VendorVerificationRecord[];
  documents: VendorDocumentReference[];
  complianceRecords: VendorComplianceRecord[];

  // Factual performance aggregations
  ratingSummary: {
    totalOrdersFulfilled: number;
    onTimeDeliveryRate: number; // percentage e.g. 95%
    qualityComplianceRate: number; // percentage e.g. 98%
    disputeCount: number;
    averageResponseDays: number;
  };

  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

// =================================================================
// 2. RFQ (REQUEST FOR QUOTATION)
// =================================================================

export interface RFQItem {
  id: string;
  inventoryItemId?: string; // Phase 12 reference
  itemCode?: string;
  nameBn: string;
  nameEn?: string;
  specification: string;
  quantity: number;
  unit: string;
  targetUnitBudget?: number;
}

export interface EvaluationCriterion {
  id: string;
  nameBn: string;
  weightPercent: number; // e.g. 40% price, 30% quality, 20% delivery, 10% warranty
  description: string;
}

export interface RFQ {
  id: string; // e.g. EHRJ-RFQ-2026-0001
  rfqCode: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  purchaseRequestId?: string; // Phase 12 reference
  budgetId?: string; // Phase 41 reference
  fundCode?: string; // GENERAL, LILLAH, ZAKAT, CONSTRUCTION, etc.
  categoryCode: VendorCategoryCode;
  
  status: RFQStatus;
  submissionDeadline: string; // ISO date
  items: RFQItem[];
  evaluationCriteria: EvaluationCriterion[];
  invitedVendorIds: string[];

  awardedQuotationId?: string;
  awardedVendorId?: string;
  awardNotes?: string;

  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  updatedAt: string;
}

// =================================================================
// 3. QUOTATION MANAGEMENT & VERSIONING
// =================================================================

export interface QuotationItem {
  rfqItemId?: string;
  itemDescriptionBn: string;
  quantity: number;
  unit: string;
  unitPrice: number; // BDT
  taxAmount: number;
  discountAmount: number;
  lineTotal: number;
  brandOrOrigin?: string;
  warrantyPeriod?: string;
}

export interface Quotation {
  id: string; // e.g. EHRJ-QUO-2026-0001
  quotationCode: string;
  rfqId: string;
  rfqTitleBn: string;
  vendorId: string;
  vendorNameBn: string;
  
  versionNumber: number; // 1, 2, 3...
  previousVersionId?: string; // Reference to superseded version
  status: QuotationStatus;
  quotationDate: string;
  validUntilDate: string;
  
  items: QuotationItem[];
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  deliveryCharge: number;
  netTotalAmount: number; // BDT ৳
  
  deliveryTimeDays: number;
  warrantyPeriodMonths: number;
  paymentTermsBn: string;
  
  supportingDocToken?: string; // Phase 29 document token
  revisionReason?: string;
  
  submittedBy: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationComparisonEntry {
  vendorId: string;
  vendorName: string;
  quotationId: string;
  version: number;
  netTotalAmount: number;
  deliveryDays: number;
  warrantyMonths: number;
  paymentTerms: string;
  verificationStatus: VerificationStatus;
  pastOnTimeRate: number;
  itemLevelPrices: {
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export interface QuotationComparisonMatrix {
  rfqId: string;
  rfqTitleBn: string;
  comparisonDate: string;
  lowestPrice: number;
  fastestDeliveryDays: number;
  longestWarrantyMonths: number;
  entries: QuotationComparisonEntry[];
}

// =================================================================
// 4. PROCUREMENT EVALUATION & DECISION
// =================================================================

export interface VendorEvaluationScore {
  vendorId: string;
  vendorName: string;
  quotationId: string;
  criterionScores: {
    criterionId: string;
    criterionName: string;
    weight: number;
    rawScore: number; // 0-100
    weightedScore: number;
    notes?: string;
  }[];
  totalWeightedScore: number;
  factualObservationsBn: string;
}

export interface ProcurementEvaluation {
  id: string; // e.g. EHRJ-EVAL-2026-0001
  rfqId: string;
  rfqTitleBn: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: string; // ADMIN, PRINCIPAL
  
  evaluationDate: string;
  vendorScores: VendorEvaluationScore[];
  
  recommendedVendorId: string;
  recommendedVendorName: string;
  recommendedQuotationId: string;
  recommendationJustificationBn: string;
  
  decisionStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  approvedAt?: string;
  decisionNotes?: string;
  
  createdAt: string;
  updatedAt: string;
}

// =================================================================
// 5. CONTRACT MANAGEMENT & VERSIONING
// =================================================================

export interface ContractDeliverable {
  id: string;
  titleBn: string;
  milestoneDescription: string;
  targetDate: string;
  allocatedValueBdt: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ContractObligation {
  id: string;
  obligationType: "PAYMENT" | "DELIVERY" | "WARRANTY" | "MAINTENANCE" | "COMPLIANCE";
  titleBn: string;
  dueDate: string;
  status: "PENDING" | "FULFILLED" | "OVERDUE" | "WAIVED";
  notes?: string;
}

export interface ContractVersionSnapshot {
  versionNumber: number;
  effectiveDate: string;
  changeReason: string;
  totalContractValue: number;
  paymentTerms: string;
  approvedBy: string;
  approvedAt: string;
  createdAt: string;
}

export interface ContractRenewalReminder {
  reminderDays: number; // 90, 60, 30, 7
  targetDate: string;
  isTriggered: boolean;
  triggeredAt?: string;
}

export interface Contract {
  id: string; // e.g. EHRJ-CON-2026-0001
  contractCode: string;
  vendorId: string;
  vendorNameBn: string;
  rfqId?: string;
  quotationId?: string;
  purchaseOrderId?: string; // Phase 12 reference
  budgetId?: string; // Phase 41 reference
  
  titleBn: string;
  titleEn: string;
  contractType: ContractType;
  status: ContractStatus;
  currentVersion: number;
  
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  renewalDate?: string;
  
  totalContractValue: number; // BDT ৳
  currency: string; // "BDT"
  paymentTermsBn: string;
  
  deliverables: ContractDeliverable[];
  obligations: ContractObligation[];
  versions: ContractVersionSnapshot[];
  renewalReminders: ContractRenewalReminder[];
  
  documentToken?: string; // Phase 29 Document Reference
  threeWayMatchStatus: ThreeWayMatchStatus;
  
  ownerName: string;
  notes?: string;
  
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  updatedBy: string;
  updatedAt: string;
}

// =================================================================
// 6. VENDOR PERFORMANCE, RISK & CONFLICT DECLARATIONS
// =================================================================

export interface VendorPerformanceReview {
  id: string;
  vendorId: string;
  vendorName: string;
  reviewPeriod: string; // e.g. "2026-Q1", "2026-Annual"
  
  totalOrders: number;
  onTimeDeliveries: number;
  delayedDeliveries: number;
  onTimeRatePercent: number;
  
  qualityPassedOrders: number;
  qualityIssueOrders: number;
  qualityComplianceRatePercent: number;
  
  disputeCount: number;
  averageResponseDays: number;
  
  factualSummaryBn: string;
  recommendedAction: "CONTINUE" | "REVIEW_REQUIRED" | "SUSPEND_REVIEW";
  
  reviewerName: string;
  reviewedAt: string;
  createdAt: string;
}

export interface VendorRiskRecord {
  id: string;
  vendorId: string;
  vendorName: string;
  riskCategory: "SINGLE_SOURCE" | "FINANCIAL_DEPENDENCY" | "COMPLIANCE_EXPIRY" | "DELIVERY_INSTABILITY" | "QUALITY_ISSUE";
  severity: VendorRiskLevel;
  descriptionBn: string;
  mitigationPlanBn: string;
  isMitigated: boolean;
  reviewedAt: string;
}

export interface ConflictDeclaration {
  id: string;
  procurementId: string; // RFQ ID or Contract ID
  declarantId: string;
  declarantName: string;
  declarantRole: string;
  hasConflict: boolean;
  natureOfConflictBn?: string;
  declarationDate: string;
  status: "DECLARED" | "CLEARED" | "RECUSED";
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
}

// =================================================================
// 7. AUDIT & DASHBOARD
// =================================================================

export interface ProcurementAuditEntry {
  id: string;
  timestamp: string;
  entityType: "VENDOR" | "RFQ" | "QUOTATION" | "CONTRACT" | "EVALUATION" | "PERFORMANCE" | "CONFLICT";
  entityId: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  notes: string;
  details?: Record<string, any>;
}

export interface ProcurementDashboardStats {
  activeVendorsCount: number;
  pendingVerificationsCount: number;
  activeRfqsCount: number;
  pendingQuotationsCount: number;
  activeContractsCount: number;
  expiringContractsCount: number;
  totalContractValueBdt: number;
  averageOnTimeDeliveryRate: number;
  pendingEvaluationsCount: number;
  totalAuditEntriesCount: number;
}

export interface ActorContext {
  actorId: string;
  actorName: string;
  actorRole: string;
}
