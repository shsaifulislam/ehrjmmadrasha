/**
 * EHRJ MADRASHA ERP — PHASE 41
 * Budget Control, Overrun & Alert Engine
 * 
 * Rules:
 * 1. Default: Soft control + Admin Warning (does not block legitimate operations blindly).
 * 2. 80% Utilization -> WARNING Alert
 * 3. 90% Utilization -> CRITICAL Alert
 * 4. 100%+ Utilization -> OVERRUN Alert (triggers review & revision workflow)
 * 5. Immutable audit trails for all alerts and acknowledgments.
 */

import {
  Budget,
  BudgetLine,
  BudgetControlAlert,
  BudgetControlAlertLevel,
} from "./types";
import {
  getBudgetById,
  getAllAlerts,
  saveAlert,
  recordBudgetAudit,
} from "./budgetStore";
import { ActorContext } from "./budgetLifecycleEngine";

export interface BudgetControlCheckResult {
  hasAlert: boolean;
  alertLevel: BudgetControlAlertLevel;
  utilizationRate: number;
  overrunAmount: number;
  messageBn: string;
  allowTransaction: boolean;
}

/**
 * Checks a proposed expense against budget line allocation
 */
export function checkBudgetControl(
  budgetId: string,
  budgetLineId: string,
  proposedExpenseAmount: number
): BudgetControlCheckResult {
  const budget = getBudgetById(budgetId);
  if (!budget) {
    return {
      hasAlert: false,
      alertLevel: "INFO",
      utilizationRate: 0,
      overrunAmount: 0,
      messageBn: "বাজেট পাওয়া যায়নি।",
      allowTransaction: true,
    };
  }

  const line = budget.lines.find((l) => l.id === budgetLineId);
  if (!line || line.categoryType !== "EXPENSE") {
    return {
      hasAlert: false,
      alertLevel: "INFO",
      utilizationRate: 0,
      overrunAmount: 0,
      messageBn: "বাজেট লাইন প্রযোজ্য নয়।",
      allowTransaction: true,
    };
  }

  const currentOccupied = line.actualAmount + line.committedAmount;
  const newProjectedTotal = currentOccupied + proposedExpenseAmount;
  const planned = line.revisedAmount;

  const utilizationRate =
    planned > 0 ? Math.round((newProjectedTotal / planned) * 1000) / 10 : 0;

  const overrunAmount = Math.max(0, newProjectedTotal - planned);

  let alertLevel: BudgetControlAlertLevel = "INFO";
  let messageBn = "বাজেট বরাদ্দের সীমার মধ্যে রয়েছে।";
  let hasAlert = false;

  if (newProjectedTotal > planned) {
    alertLevel = "OVERRUN";
    hasAlert = true;
    messageBn = `বাজেট অতিক্রম সতর্কতা! প্রস্তাবিত ব্যয়ের পর মোট ব্যয় ৳${newProjectedTotal} (বরাদ্দ ৳${planned})। অতিরিক্ত ব্যয়: ৳${overrunAmount} (${utilizationRate}%)।`;
  } else if (utilizationRate >= budget.criticalThresholdRate) {
    alertLevel = "CRITICAL";
    hasAlert = true;
    messageBn = `জরুরী বাজেট সতর্কতা: এই খাতের ব্যয় ${utilizationRate}% এ পৌঁছেছে (সীমা ${budget.criticalThresholdRate}%)।`;
  } else if (utilizationRate >= budget.warningThresholdRate) {
    alertLevel = "WARNING";
    hasAlert = true;
    messageBn = `বাজেট সতর্কতা: এই খাতের ব্যয় ${utilizationRate}% এ পৌঁছেছে (সীমা ${budget.warningThresholdRate}%)।`;
  }

  // If hard enforcement is enabled on this budget and overrun occurs, block transaction
  const allowTransaction = !(budget.hardEnforcementEnabled && alertLevel === "OVERRUN");

  return {
    hasAlert,
    alertLevel,
    utilizationRate,
    overrunAmount,
    messageBn,
    allowTransaction,
  };
}

/**
 * Scans a budget and emits/updates alerts for all lines exceeding thresholds
 */
export function scanAndGenerateBudgetAlerts(budgetId: string): BudgetControlAlert[] {
  const budget = getBudgetById(budgetId);
  if (!budget) return [];

  const generatedAlerts: BudgetControlAlert[] = [];
  const existingAlerts = getAllAlerts();

  for (const line of budget.lines) {
    if (line.categoryType !== "EXPENSE") continue;

    const occupied = line.actualAmount + line.committedAmount;
    const planned = line.revisedAmount;
    const utilizationRate =
      planned > 0 ? Math.round((occupied / planned) * 1000) / 10 : 0;

    if (utilizationRate >= budget.warningThresholdRate) {
      let alertLevel: BudgetControlAlertLevel = "WARNING";
      if (occupied > planned) {
        alertLevel = "OVERRUN";
      } else if (utilizationRate >= budget.criticalThresholdRate) {
        alertLevel = "CRITICAL";
      }

      // Check if alert already exists for this line
      const existing = existingAlerts.find(
        (a) => a.budgetId === budgetId && a.budgetLineId === line.id && a.alertLevel === alertLevel && !a.isAcknowledged
      );

      if (!existing) {
        const overrunAmount = Math.max(0, occupied - planned);
        const alert: BudgetControlAlert = {
          id: `EHRJ-BALT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          budgetId: budget.id,
          budgetLineId: line.id,
          categoryNameBn: line.categoryNameBn,
          fundCode: line.fundCode,
          alertLevel,
          utilizationRate,
          thresholdRate: alertLevel === "OVERRUN" ? 100 : alertLevel === "CRITICAL" ? budget.criticalThresholdRate : budget.warningThresholdRate,
          currentExpenseAmount: occupied,
          plannedAmount: planned,
          overrunAmount,
          messageBn:
            alertLevel === "OVERRUN"
              ? `খাত "${line.categoryNameBn}" এ বাজেট অতিক্রম ঘটেছে! মোট ব্যয় ৳${occupied} (বরাদ্দ ৳${planned}, অতিরিক্ত ৳${overrunAmount})।`
              : `খাত "${line.categoryNameBn}" এ বাজেট ব্যয় ${utilizationRate}% এ উন্নীত হয়েছে।`,
          isAcknowledged: false,
          createdAt: new Date().toISOString(),
        };

        saveAlert(alert);
        generatedAlerts.push(alert);

        if (alertLevel === "OVERRUN") {
          recordBudgetAudit({
            budgetId: budget.id,
            action: "OVERRUN_DETECTED",
            actorId: "SYSTEM",
            actorName: "বাজেট কন্ট্রোল ইঞ্জিন",
            actorRole: "SYSTEM",
            notes: `বাজেট অতিক্রম সনাক্ত: ${line.categoryNameBn} (অতিরিক্ত ৳${overrunAmount})`,
            details: { lineId: line.id, occupied, planned, overrunAmount },
          });
        }
      }
    }
  }

  return generatedAlerts;
}

/**
 * Acknowledges a budget alert
 */
export function acknowledgeAlert(
  alertId: string,
  actor: ActorContext,
  justificationBn?: string
): { success: boolean; alert?: BudgetControlAlert; error?: string } {
  const alerts = getAllAlerts();
  const alert = alerts.find((a) => a.id === alertId);
  if (!alert) {
    return { success: false, error: "সতর্কবার্তা পাওয়া যায়নি।" };
  }

  alert.isAcknowledged = true;
  alert.status = "ACKNOWLEDGED";
  alert.justificationBn = justificationBn;
  alert.acknowledgedBy = actor.actorName;
  alert.acknowledgedAt = new Date().toISOString();

  saveAlert(alert);

  recordBudgetAudit({
    budgetId: alert.budgetId,
    action: "ACKNOWLEDGE_ALERT",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `সতর্কবার্তা গৃহীত হয়েছে: ${alert.categoryNameBn} (${alert.alertLevel})${
      justificationBn ? ` | যুক্তি: ${justificationBn}` : ""
    }`,
    details: { alertId: alert.id, alertLevel: alert.alertLevel, justificationBn },
  });

  return { success: true, alert };
}

export const scanBudgetForThresholdAlerts = scanAndGenerateBudgetAlerts;
export const scanBudgetAndGenerateAlerts = scanAndGenerateBudgetAlerts;
export const acknowledgeControlAlert = acknowledgeAlert;

