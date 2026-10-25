/**
 * EHRJ MADRASHA ERP — PHASE 41
 * Institutional Budget Planning, Financial Planning & Budget Control Engine
 * 
 * Checkpoint: EHRJ-AI-2026-PHASE41
 * 
 * Non-Negotiable Source-Of-Truth Invariants:
 * 1. PLAN THE MONEY, CONTROL THE MONEY, BUT NEVER DUPLICATE THE ACCOUNTING SOURCE OF TRUTH.
 * 2. Phase 6 Finance owns actual transactions, income, expense, cashbook, fund balances.
 * 3. Phase 12 Procurement owns purchase requests, purchase orders, goods receipts.
 * 4. Phase 13 HR owns employee salary structure and payroll calculations.
 * 5. Phase 40 Vendor/Contract owns vendor contracts and external obligations.
 * 6. Phase 41 ONLY owns: budgets, budget lines, planning assumptions, allocations, revisions,
 *    variance calculations, commitments tracking, and spending controls.
 * 7. AI ASSISTS. AUTHORIZED HUMANS DECIDE.
 * 8. STRICTLY NO SMS — In-app portal alerts, email, and calendar events only.
 */

export type BudgetPeriodStatus = "PLANNED" | "ACTIVE" | "CLOSED" | "ARCHIVED";

export type BudgetPeriodType = "ANNUAL" | "ACADEMIC_SESSION" | "FINANCIAL_YEAR" | "CUSTOM";

export type BudgetLifecycleStatus =
  | "DRAFT"
  | "PREPARATION"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "ACTIVE"
  | "REVISED"
  | "CLOSED"
  | "ARCHIVED";

export type BudgetRevisionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type BudgetProjectStatus =
  | "PLANNED"
  | "APPROVED"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type BudgetFundCode =
  | "GENERAL"
  | "LILLAH"
  | "ZAKAT"
  | "CONSTRUCTION"
  | "ORPHAN_SUPPORT"
  | "OTHER";

export type BudgetCategoryType = "INCOME" | "EXPENSE";

export type BudgetControlAlertLevel = "INFO" | "WARNING" | "CRITICAL" | "OVERRUN";

export interface MonthlyAllocation {
  monthIndex: number; // 1 to 12
  monthNameBn: string; // e.g. "জুলাই", "আগস্ট"
  plannedAmount: number;
  actualAmount: number;
  committedAmount: number;
  forecastAmount: number;
  remainingAmount: number;
  variance: number;
}

export interface BudgetLine {
  id: string; // e.g. EHRJ-BLN-2026-001
  budgetId: string;
  fundCode: BudgetFundCode;
  fundNameBn: string;
  categoryType: BudgetCategoryType;
  categoryCode: string; // e.g. "TEACHER_SALARY", "FOOD_GROCERY"
  categoryNameBn: string;
  subcategoryNameBn?: string;
  departmentNameBn: string;
  descriptionBn?: string;
  
  // Financial Figures (BDT ৳)
  plannedAmount: number;
  revisedAmount: number;
  actualAmount: number;       // Sourced from Phase 6 Finance
  committedAmount: number;    // Sourced from Phase 12 POs & Phase 40 Contracts
  remainingAmount: number;    // Revised - (Actual + Committed)
  forecastAmount: number;     // Sourced from Phase 26 Forecasting
  variance: number;           // Expense: Planned - (Actual + Committed); Income: Actual - Planned
  utilizationRate: number;    // % ((Actual + Committed) / Revised) * 100
  
  monthlyAllocations: MonthlyAllocation[];
  
  // References
  projectReferenceId?: string;
  costCenterCode?: string;
  zakatEligibleOnly?: boolean; // Strictly enforced for Zakat funds
  notes?: string;
}

export interface BudgetVersionSnapshot {
  versionNumber: number; // 1, 2, 3...
  effectiveDate: string; // YYYY-MM-DD
  approvedBy: string;
  approvalReference: string;
  totalPlannedIncome: number;
  totalPlannedExpense: number;
  totalPlannedSurplusDeficit: number;
  linesSnapshot: BudgetLine[];
  revisionReason?: string;
  createdAt: string;
}

export interface Budget {
  id: string; // e.g. EHRJ-BUD-2026-0001
  budgetCode: string; // e.g. EHRJ-BUD-2026-0001
  titleBn: string;
  titleEn: string;
  periodId: string;
  periodNameBn: string;
  fiscalYear: string; // e.g. "2026-2027"
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  currency: string;   // "BDT"
  
  status: BudgetLifecycleStatus;
  currentVersion: number;
  
  // Aggregated Totals (BDT ৳)
  totalIncomePlanned: number;
  totalIncomeActual: number;
  totalExpensePlanned: number;
  totalExpenseActual: number;
  totalExpenseCommitted: number;
  totalExpenseRemaining: number;
  netProjectedSurplus: number;
  overallUtilizationRate: number; // %
  
  lines: BudgetLine[];
  versions: BudgetVersionSnapshot[];
  
  // Control Thresholds
  warningThresholdRate: number;  // Default 80%
  criticalThresholdRate: number; // Default 90%
  hardEnforcementEnabled: boolean; // Default false (soft control + admin warning)
  
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  lockedAt?: string;
  updatedBy: string;
  updatedAt: string;
  notes?: string;
}

export interface BudgetPeriod {
  id: string; // e.g. EHRJ-BPR-2026-01
  periodCode: string;
  titleBn: string;
  titleEn: string;
  periodType: BudgetPeriodType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: BudgetPeriodStatus;
  isLocked: boolean;
  notes?: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  lockedAt?: string;
}

export interface BudgetRevisionLineDiff {
  budgetLineId: string;
  categoryNameBn: string;
  fundCode: BudgetFundCode;
  previousAmount: number;
  newRequestedAmount: number;
  amountDifference: number; // new - previous
  justificationBn: string;
}

export interface BudgetRevision {
  id: string; // e.g. EHRJ-BREV-2026-0001
  revisionCode: string;
  budgetId: string;
  budgetTitleBn: string;
  previousVersion: number;
  targetVersion: number;
  
  titleBn: string;
  reasonBn: string;
  supportingDocUrl?: string;
  
  lineDiffs: BudgetRevisionLineDiff[];
  netExpenseAdjustment: number;
  netIncomeAdjustment: number;
  
  status: BudgetRevisionStatus;
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  workflowInstanceId?: string;
}

export interface BudgetProject {
  id: string; // e.g. EHRJ-BPRJ-2026-001
  projectCode: string;
  nameBn?: string;
  titleBn?: string;
  nameEn?: string;
  titleEn?: string;
  descriptionBn?: string;
  notes?: string;
  budgetId?: string;
  fundCode: BudgetFundCode;
  fundNameBn: string;
  
  startDate: string;
  endDate: string;
  targetCompletionDate?: string;
  status: BudgetProjectStatus;
  
  approvedBudget: number;
  revisedBudget: number;
  plannedBudget?: number;
  actualExpense: number;       // Sourced from Phase 6 Finance
  committedAmount: number;     // Sourced from Phase 12 POs
  remainingBudget: number;
  utilizationRate: number;     // %
  
  projectManagerName: string;
  ownerName?: string;
  contractorVendorId?: string; // Phase 40 Vendor link
  contractorVendorName?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface BudgetControlAlert {
  id: string; // e.g. EHRJ-BALT-2026-001
  budgetId: string;
  budgetLineId?: string;
  projectId?: string;
  categoryNameBn: string;
  fundCode: BudgetFundCode;
  alertLevel: BudgetControlAlertLevel;
  utilizationRate: number; // e.g. 85%, 92%, 105%
  thresholdRate: number;
  currentExpenseAmount: number;
  plannedAmount: number;
  overrunAmount: number;
  messageBn: string;
  isAcknowledged: boolean;
  status?: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  justificationBn?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface BudgetAuditEntry {
  id: string;
  timestamp: string;
  budgetId: string;
  action:
    | "CREATE_PERIOD"
    | "LOCK_PERIOD"
    | "CREATE_BUDGET"
    | "UPDATE_BUDGET"
    | "SUBMIT_BUDGET"
    | "APPROVE_BUDGET"
    | "ACTIVATE_BUDGET"
    | "REQUEST_REVISION"
    | "APPROVE_REVISION"
    | "REJECT_REVISION"
    | "CREATE_PROJECT"
    | "UPDATE_PROJECT"
    | "OVERRUN_DETECTED"
    | "ACKNOWLEDGE_ALERT"
    | "CLOSE_BUDGET"
    | "ARCHIVE_BUDGET";
  actorId: string;
  actorName: string;
  actorRole: string; // ADMIN, PRINCIPAL
  notes: string;
  details?: Record<string, any>;
}

export interface BudgetDashboardStats {
  totalActiveBudgets: number;
  totalPlannedIncome: number;
  totalActualIncome: number;
  incomeCollectionRate: number; // %
  totalPlannedExpense: number;
  totalActualExpense: number;
  totalCommittedExpense: number;
  totalAvailableBudget: number;
  overallExpenseUtilizationRate: number; // %
  activeProjectsCount: number;
  pendingRevisionsCount: number;
  overrunAlertsCount: number;
  warningAlertsCount: number;
}
