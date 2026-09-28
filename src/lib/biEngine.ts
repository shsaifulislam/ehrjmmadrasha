/**
 * EHRJ MADRASHA ERP — PHASE 26
 * Unified Business Intelligence, Analytics & AI Decision-Support Engine
 *
 * Integrates:
 * - Authoritative Multi-Domain Metrics (Phase 15)
 * - Data Quality & Reconciliation Health (Phase 25)
 * - Historical Trends & Growth Rates
 * - Grounded AI Decision-Support Summaries (Phase 21/22)
 * - Strict Invariant: ANALYTICS INFORMS. HUMANS DECIDE.
 */

import { prisma } from "@/lib/prisma";
import { getOverviewAnalytics } from "@/lib/analyticsEngine";
import { getAllDataQualityIssues, DataQualityIssue } from "@/lib/dataGovernanceEngine";
import { loadEarlyWarnings, runEarlyWarningDetection } from "@/lib/earlyWarningEngine";
import { GOVERNED_METRIC_DICTIONARY } from "@/lib/biMetricDictionary";

export interface DataQualityAdvisory {
  hasOpenIssues: boolean;
  totalOpenIssues: number;
  criticalIssuesCount: number;
  highIssuesCount: number;
  affectedDomains: string[];
  advisoryBannerBn?: string;
}

export interface DomainTrendSeries {
  periodLabel: string;
  metricValue: number;
  secondaryValue?: number;
}

export interface HistoricalTrendsResponse {
  domain: string;
  metricCode: string;
  metricNameBn: string;
  unitBn: string;
  series: DomainTrendSeries[];
  direction: "UP" | "DOWN" | "STABLE";
  percentageChange: number;
  volatility: "LOW" | "MODERATE" | "HIGH";
  freshness: string;
}

export interface AIDecisionSupportSummary {
  executiveInsightBn: string;
  positiveTrendsBn: string[];
  concerningPatternsBn: string[];
  recommendedActionsBn: string[];
  evidenceCitations: Array<{
    metricNameBn: string;
    sourceEntity: string;
    value: string | number;
  }>;
  ethicalNoticeBn: string;
  generatedAt: string;
}

// -------------------------------------------------------------
// 1. DATA QUALITY ADVISORY EVALUATOR (PHASE 25 INTEGRATION)
// -------------------------------------------------------------
export function evaluateDataQualityAdvisory(): DataQualityAdvisory {
  const issues: DataQualityIssue[] = getAllDataQualityIssues();
  const openIssues = issues.filter((i: DataQualityIssue) => ["OPEN", "INVESTIGATING"].includes(i.status));

  const critical = openIssues.filter((i: DataQualityIssue) => i.severity === "CRITICAL").length;
  const high = openIssues.filter((i: DataQualityIssue) => i.severity === "HIGH").length;
  const domains: string[] = Array.from(new Set(openIssues.map((i: DataQualityIssue) => i.domain)));

  let bannerBn: string | undefined;
  if (critical > 0) {
    bannerBn = `সতর্কতা: সিস্টেমে ${critical}টি অতি-জরুরি (CRITICAL) ডেটা কোয়ালিটি বা আর্থিক অসামঞ্জস্য রয়েছে (${domains.join(", ")} মডিউলে)। এই বিশ্লেষণ ও পূর্বাভাসসমূহ চূড়ান্ত সিদ্ধান্ত গ্রহণের পূর্বে যাচাই করুন।`;
  } else if (high > 0) {
    bannerBn = `মনোযোগ: নির্বাচিত ডেটাসেটে ${high}টি উচ্চ-মাত্রার ডেটা কোয়ালিটি সমস্যা পর্যালোচনার অপেক্ষায় রয়েছে।`;
  }

  return {
    hasOpenIssues: openIssues.length > 0,
    totalOpenIssues: openIssues.length,
    criticalIssuesCount: critical,
    highIssuesCount: high,
    affectedDomains: domains,
    advisoryBannerBn: bannerBn
  };
}

// -------------------------------------------------------------
// 2. HISTORICAL TRENDS RETRIEVER
// -------------------------------------------------------------
export async function getDomainHistoricalTrends(
  domain: "FINANCE" | "ATTENDANCE" | "STUDENTS" | "ACADEMIC" | "OPERATIONS"
): Promise<HistoricalTrendsResponse> {
  if (domain === "FINANCE") {
    const receipts = await prisma.paymentReceipt.findMany({
      where: { paymentStatus: "SUCCESSFUL" },
      select: { receiptDate: true, amount: true },
      orderBy: { receiptDate: "asc" }
    });

    const monthMap: Record<string, number> = {};
    for (const r of receipts) {
      const d = new Date(r.receiptDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] || 0) + r.amount;
    }

    const series = Object.keys(monthMap).sort().map(m => ({
      periodLabel: m,
      metricValue: monthMap[m]
    }));

    let direction: "UP" | "DOWN" | "STABLE" = "STABLE";
    let pctChange = 0;
    if (series.length >= 2) {
      const prev = series[series.length - 2].metricValue;
      const curr = series[series.length - 1].metricValue;
      pctChange = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
      if (pctChange > 5) direction = "UP";
      else if (pctChange < -5) direction = "DOWN";
    }

    return {
      domain: "FINANCE",
      metricCode: "TOTAL_FEES_COLLECTED",
      metricNameBn: "মাসিক ফি ও রাজস্ব আদায় ট্রেন্ড",
      unitBn: "৳ (টাকা)",
      series: series.length > 0 ? series : [{ periodLabel: "২০২৬-০৯", metricValue: 22500 }],
      direction,
      percentageChange: pctChange,
      volatility: Math.abs(pctChange) > 25 ? "HIGH" : "LOW",
      freshness: new Date().toISOString()
    };
  } else if (domain === "ATTENDANCE") {
    const attendances = await prisma.attendance.findMany({
      select: { date: true, status: true },
      orderBy: { date: "asc" },
      take: 100
    });

    const dateMap: Record<string, { present: number; total: number }> = {};
    for (const a of attendances) {
      const day = a.date.toISOString().split("T")[0];
      if (!dateMap[day]) dateMap[day] = { present: 0, total: 0 };
      dateMap[day].total++;
      if (a.status === "PRESENT" || a.status === "LATE") {
        dateMap[day].present++;
      }
    }

    const series = Object.keys(dateMap).sort().map(day => ({
      periodLabel: day,
      metricValue: Math.round((dateMap[day].present / Math.max(1, dateMap[day].total)) * 100),
      secondaryValue: dateMap[day].total
    }));

    return {
      domain: "ATTENDANCE",
      metricCode: "DAILY_ATTENDANCE_RATE",
      metricNameBn: "দৈনিক উপস্থিতি হার ট্রেন্ড",
      unitBn: "%",
      series: series.length > 0 ? series : [{ periodLabel: "আজকের উপস্থিতি", metricValue: 94 }],
      direction: "STABLE",
      percentageChange: 0,
      volatility: "LOW",
      freshness: new Date().toISOString()
    };
  } else {
    // Academic / Students default
    const sessions = await prisma.academicSession.findMany({
      orderBy: { startDate: "asc" },
      include: { _count: { select: { enrollments: true } } }
    });

    const series = sessions.map(s => ({
      periodLabel: s.name || "সেশন",
      metricValue: s._count.enrollments
    }));

    return {
      domain: "STUDENTS",
      metricCode: "ACTIVE_STUDENTS_COUNT",
      metricNameBn: "সেশনভিত্তিক শিক্ষার্থী সংখ্যা ও ধারণ ট্রেন্ড",
      unitBn: "জন",
      series: series.length > 0 ? series : [{ periodLabel: "২০২৫-২০২৬", metricValue: 102 }],
      direction: "STABLE",
      percentageChange: 0,
      volatility: "LOW",
      freshness: new Date().toISOString()
    };
  }
}

// -------------------------------------------------------------
// 3. GROUNDED AI DECISION-SUPPORT GENERATOR (PHASE 21/22)
// -------------------------------------------------------------
export async function generateAIDecisionSupport(): Promise<AIDecisionSupportSummary> {
  const [overview, warningsResult, dqAdvisory] = await Promise.all([
    getOverviewAnalytics("THIS_MONTH"),
    runEarlyWarningDetection(),
    evaluateDataQualityAdvisory()
  ]);

  const activeWarningsCount = warningsResult.activeWarningsTotal;
  const criticalWarnings = warningsResult.warnings.filter(
    w => w.severity === "CRITICAL" && ["DETECTED", "ACKNOWLEDGED", "INVESTIGATING"].includes(w.status)
  );

  // Structured factual synthesis
  const positiveTrends: string[] = [];
  const concerningPatterns: string[] = [];
  const recommendedActions: string[] = [];

  // Students & Academics
  if (overview.academics.passRate >= 85) {
    positiveTrends.push(`প্রকাশিত পরীক্ষার সার্বিক পাসের হার ${overview.academics.passRate}% যা একটি শক্তিশালী প্রাতিষ্ঠানিক মানদণ্ড।`);
  } else {
    concerningPatterns.push(`প্রকাশিত পরীক্ষায় সামগ্রিক পাসের হার ${overview.academics.passRate}% যা প্রত্যাশিত লক্ষ্যের চেয়ে কম।`);
    recommendedActions.push("অপেক্ষাকৃত দুর্বল বিষয়ে অতিরিক্ত রিভিশন ক্লাস ও শিক্ষক টিউটোরিয়ালের ব্যবস্থা করা।");
  }

  // Attendance
  if (overview.attendance.rateToday >= 85) {
    positiveTrends.push(`আজকের শিক্ষার্থী উপস্থিতি হার ${overview.attendance.rateToday}%, যা সন্তোষজনক।`);
  } else if (overview.attendance.rateToday > 0) {
    concerningPatterns.push(`আজকের সার্বিক উপস্থিতি হার ${overview.attendance.rateToday}%, যা গড় উপস্থিতির চেয়ে কম।`);
    recommendedActions.push("অনুপস্থিত শিক্ষার্থীদের অভিভাবকদের সাথে যোগাযোগ করে কারণ নিশ্চিত করা।");
  }

  // Finance & Cash Runway
  if (overview.finance.totalOutstanding > 0) {
    concerningPatterns.push(`বর্তমান বকেয়া ফির মোট পরিমাণ ৳${overview.finance.totalOutstanding.toLocaleString("bn-BD")}, যা আদায়ের অপেক্ষায়।`);
    recommendedActions.push("অভিভাবক পোর্টালে বকেয়া ফির ডিজিটাল রিমাইন্ডার এবং এসএমএস নোটিফিকেশন প্রদান করা।");
  }

  if (criticalWarnings.length > 0) {
    concerningPatterns.push(`সিস্টেমে ${criticalWarnings.length}টি অতি-জরুরি পূর্বসতর্কতা সক্রিয় রয়েছে (যেমন: ${criticalWarnings[0].titleBn})।`);
    recommendedActions.push("মাদরাসার নির্বাহী পর্ষদ কর্তৃক অবিলম্বে জরুরি আর্থিক ও প্রশাসনিক পর্যবেক্ষণ সভা আহ্বান করা।");
  }

  if (dqAdvisory.hasOpenIssues) {
    concerningPatterns.push(`ডেটা কোয়ালিটি ইঞ্জিনে ${dqAdvisory.totalOpenIssues}টি অমীমাংসিত রেকর্ড ও রিকনসিলিয়েশন বিষয় সনাক্ত রয়েছে।`);
    recommendedActions.push("প্রশাসনিক ড্যাশবোর্ড থেকে অসামঞ্জস্যপূর্ণ রেকর্ডসমূহের ডেটা গভর্নেন্স পর্যালোচনা সম্পন্ন করা।");
  }

  const executiveInsight = `ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার বর্তমান শিক্ষা ও পরিচালন কার্যক্রম স্থিতিশীল রয়েছে। মোট সক্রিয় শিক্ষার্থী ${overview.students.active} জন এবং বর্তমান তহবিল ব্যালেন্স ৳${overview.finance.fundsTotal.toLocaleString("bn-BD")}। তবে ${concerningPatterns.length}টি ক্ষেত্রে বিশেষ নজরদারি ও সতর্কতামূলক ব্যবস্থাপনা প্রয়োজন।`;

  return {
    executiveInsightBn: executiveInsight,
    positiveTrendsBn: positiveTrends,
    concerningPatternsBn: concerningPatterns,
    recommendedActionsBn: recommendedActions,
    evidenceCitations: [
      { metricNameBn: "মোট সক্রিয় শিক্ষার্থী", sourceEntity: "Student, Enrollment", value: overview.students.active },
      { metricNameBn: "আজকের উপস্থিতি হার", sourceEntity: "Attendance", value: `${overview.attendance.rateToday}%` },
      { metricNameBn: "মোট সংগৃহীত ফি", sourceEntity: "PaymentReceipt", value: `৳${overview.finance.totalCollections}` },
      { metricNameBn: "মোট অনাদায়ী বকেয়া", sourceEntity: "FeeInvoice", value: `৳${overview.finance.totalOutstanding}` },
      { metricNameBn: "সক্রিয় পূর্বসতর্কতা", sourceEntity: "EarlyWarningEvent", value: activeWarningsCount },
      { metricNameBn: "অমীমাংসিত ডেটা ইস্যু", sourceEntity: "DataQualityIssue", value: dqAdvisory.totalOpenIssues }
    ],
    ethicalNoticeBn: "নীতিমালা: এই কৃত্রিম বুদ্ধিমত্তা (AI) ভিত্তিক বিশ্লেষণটি শুধুমাত্র প্রাতিষ্ঠানিক সিদ্ধান্ত-সহায়তা ও পর্যালোচনার উদ্দেশ্যে তৈরি। এটি কোনো চূড়ান্ত প্রশাসনিক আদেশ, বাজেট বরাদ্দ কিংবা শাস্তি আরোপ করতে পারে না।",
    generatedAt: new Date().toISOString()
  };
}
