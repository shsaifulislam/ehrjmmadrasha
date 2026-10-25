import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ProcurementStore,
  ContractEngine,
  Contract,
  QuotationComparisonMatrix,
} from "@/lib/procurement";

export const dynamic = "force-dynamic";

export type ProcurementReportType =
  | "VENDOR_MASTER"
  | "VENDOR_VERIFICATION"
  | "VENDOR_COMPLIANCE"
  | "RFQ_REGISTER"
  | "QUOTATION_COMPARISON"
  | "PROCUREMENT_HISTORY"
  | "CONTRACT_REGISTER"
  | "CONTRACT_EXPIRY"
  | "CONTRACT_RENEWALS"
  | "VENDOR_PERFORMANCE"
  | "DELIVERY_PERFORMANCE"
  | "PROCUREMENT_BUDGET"
  | "PROCUREMENT_FINANCE"
  | "VENDOR_RISK";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const reportType = (searchParams.get("type") as ProcurementReportType) || "VENDOR_MASTER";
    const rfqId = searchParams.get("rfqId");
    const vendorId = searchParams.get("vendorId");

    const now = new Date().toISOString();
    const institutionHeader = {
      nameBn: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
      nameEn: "Eliotganj Hazi Rohmatollah Jamiria Madrasha",
      addressBn: "ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
      generatedAt: now,
      generatedBy: user.name || "অ্যাডমিনিস্ট্রেটর",
      systemVersion: "EHRJ-AI-2026-PHASE40",
    };

    let reportTitle = "";
    let data: any = null;

    switch (reportType) {
      case "VENDOR_MASTER":
        reportTitle = "সরবরাহকারী ও ভেন্ডর মাস্টার রেজিস্টার রিপোর্ট";
        data = ProcurementStore.getVendors().map((v) => ({
          vendorId: v.id,
          nameBn: v.legalNameBn,
          type: v.vendorType,
          category: v.categoryCode,
          phone: v.phone,
          status: v.status,
          verification: v.verificationStatus,
          risk: v.riskLevel,
          totalOrders: v.ratingSummary.totalOrdersFulfilled,
        }));
        break;

      case "VENDOR_VERIFICATION":
        reportTitle = "ভেন্ডর সত্যতা ও সনদপত্র যাচাইকরণ রিপোর্ট";
        data = ProcurementStore.getVendors().map((v) => ({
          vendorId: v.id,
          nameBn: v.legalNameBn,
          verificationStatus: v.verificationStatus,
          tradeLicense: v.tradeLicenseNo || "নেই",
          tin: v.tinNumber || "নেই",
          bin: v.binVatNumber || "নেই",
          bankAccountMasked: v.bankAccountNumberMasked || "সংরক্ষিত নয়",
          checklistItems: v.verifications || [],
        }));
        break;

      case "VENDOR_COMPLIANCE":
        reportTitle = "ভেন্ডর কমপ্লায়েন্স ও আইনি নথি পর্যালোচনা রিপোর্ট";
        data = ProcurementStore.getVendors().map((v) => ({
          vendorId: v.id,
          nameBn: v.legalNameBn,
          documentsCount: v.documents?.length || 0,
          verifiedDocuments: v.documents?.filter((d) => d.isVerified).length || 0,
          pendingDocuments: v.documents?.filter((d) => !d.isVerified).length || 0,
          expiringDocuments: v.documents?.filter((d) => d.expiryDate && new Date(d.expiryDate) < new Date(Date.now() + 30 * 86400000)).length || 0,
        }));
        break;

      case "RFQ_REGISTER":
        reportTitle = "দরপত্র (RFQ) ও চাহিদা রেজিস্টার রিপোর্ট";
        data = ProcurementStore.getRFQs().map((r) => ({
          rfqId: r.id,
          titleBn: r.titleBn,
          category: r.categoryCode,
          status: r.status,
          deadline: r.submissionDeadline,
          itemsCount: r.items.length,
          quotationsReceived: ProcurementStore.getQuotationsByRFQ(r.id).length,
          awardedVendor: r.awardedVendorId || "অমীমাংসিত",
        }));
        break;

      case "QUOTATION_COMPARISON":
        reportTitle = "কোটেশন তুলনামূলক বিশ্লেষণ ম্যাট্রিক্স রিপোর্ট";
        const targetRfq = rfqId ? ProcurementStore.getRFQById(rfqId) : ProcurementStore.getRFQs()[0];
        if (targetRfq) {
          const quotes = ProcurementStore.getQuotationsByRFQ(targetRfq.id);
          data = {
            rfq: targetRfq,
            quotations: quotes.map((q) => ({
              quotationId: q.id,
              vendorName: q.vendorNameBn,
              version: q.versionNumber,
              totalAmount: q.netTotalAmount,
              deliveryDays: q.deliveryTimeDays,
              warrantyMonths: q.warrantyPeriodMonths,
              status: q.status,
            })),
          };
        } else {
          data = { message: "কোনো দরপত্র পাওয়া যায়নি।" };
        }
        break;

      case "PROCUREMENT_HISTORY":
        reportTitle = "প্রকিউরমেন্ট ও কার্যাদেশ ঐতিহাসিক লগ";
        data = ProcurementStore.getAuditLogs().map((a) => ({
          timestamp: a.timestamp,
          entityType: a.entityType,
          entityId: a.entityId,
          action: a.action,
          actor: a.actorName,
          notes: a.notes,
        }));
        break;

      case "CONTRACT_REGISTER":
        reportTitle = "প্রাতিষ্ঠানিক চুক্তিপত্র রেজিস্টার রিপোর্ট";
        data = ProcurementStore.getContracts().map((c) => ({
          contractId: c.id,
          titleBn: c.titleBn,
          vendorName: c.vendorNameBn,
          type: c.contractType,
          status: c.status,
          valueBdt: c.totalContractValue,
          startDate: c.startDate,
          endDate: c.endDate,
          currentVersion: c.currentVersion,
          deliverablesCount: c.deliverables?.length || 0,
        }));
        break;

      case "CONTRACT_EXPIRY":
        reportTitle = "আসন্ন মেয়াদোত্তীর্ণ চুক্তিপত্র তালিকা";
        data = (ContractEngine.checkExpiringContracts(90) as Contract[]).map((c: Contract) => ({
          contractId: c.id,
          titleBn: c.titleBn,
          vendorName: c.vendorNameBn,
          endDate: c.endDate,
          status: c.status,
          valueBdt: c.totalContractValue,
        }));
        break;

      case "CONTRACT_RENEWALS":
        reportTitle = "চুক্তি নবায়ন ও মেয়াদ বৃদ্ধি সংক্রান্ত রিপোর্ট";
        data = ProcurementStore.getContracts()
          .filter((c) => (c.versions?.length || 0) > 1)
          .map((c) => ({
            contractId: c.id,
            titleBn: c.titleBn,
            vendorName: c.vendorNameBn,
            currentVersion: c.currentVersion,
            totalRevisions: c.versions.length,
            revisionHistory: c.versions.map((v) => ({
              version: v.versionNumber,
              reason: v.changeReason,
              effectiveDate: v.effectiveDate,
              revisedValue: v.totalContractValue,
            })),
          }));
        break;

      case "VENDOR_PERFORMANCE":
        reportTitle = "ভেন্ডর ও সরবরাহকারী কর্মদক্ষতা মূল্যায়ন রিপোর্ট";
        data = ProcurementStore.getReviews().map((r) => ({
          vendorName: r.vendorName,
          period: r.reviewPeriod,
          totalOrders: r.totalOrders,
          onTimeRate: `${r.onTimeRatePercent}%`,
          qualityCompliance: `${r.qualityComplianceRatePercent}%`,
          disputes: r.disputeCount,
          recommendedAction: r.recommendedAction,
          reviewer: r.reviewerName,
        }));
        break;

      case "DELIVERY_PERFORMANCE":
        reportTitle = "পণ্য সরবরাহ সময়নিষ্ঠতা ও চালান ট্র্যাকিং রিপোর্ট";
        data = ProcurementStore.getVendors().map((v) => ({
          vendorName: v.legalNameBn,
          category: v.categoryCode,
          totalOrders: v.ratingSummary.totalOrdersFulfilled,
          onTimeRate: `${v.ratingSummary.onTimeDeliveryRate}%`,
          avgResponseDays: v.ratingSummary.averageResponseDays,
          disputes: v.ratingSummary.disputeCount,
        }));
        break;

      case "PROCUREMENT_BUDGET":
        reportTitle = "প্রকিউরমেন্ট ও বাজেট বরাদ্দ সামঞ্জস্য রিপোর্ট (Phase 41)";
        data = ProcurementStore.getContracts().map((c) => ({
          contractId: c.id,
          contractTitle: c.titleBn,
          contractValue: c.totalContractValue,
          committedBudgetStatus: "ALLOCATED_IN_PHASE_41",
          varianceStatus: "FAVORABLE",
        }));
        break;

      case "PROCUREMENT_FINANCE":
        reportTitle = "প্রকিউরমেন্ট বিল ও ৩-মুখী আর্থিক ম্যাচিং রিপোর্ট (Phase 6)";
        data = ProcurementStore.getContracts().map((c) => ({
          contractId: c.id,
          vendorName: c.vendorNameBn,
          contractValue: c.totalContractValue,
          threeWayMatchStatus: c.threeWayMatchStatus || "PENDING",
          currency: "BDT",
        }));
        break;

      case "VENDOR_RISK":
        reportTitle = "সরবরাহকারী ঝুঁকি ও প্রাতিষ্ঠানিক নির্ভরশীলতা রিপোর্ট";
        data = ProcurementStore.getRisks().map((rk) => ({
          riskId: rk.id,
          vendorName: rk.vendorName,
          riskCategory: rk.riskCategory,
          severity: rk.severity,
          status: rk.isMitigated ? "MITIGATED" : "ACTIVE",
          description: rk.descriptionBn,
          mitigationPlan: rk.mitigationPlanBn,
        }));
        break;

      default:
        reportTitle = "প্রকিউরমেন্ট সাধারণ প্রতিবেদন";
        data = [];
    }

    return NextResponse.json({
      success: true,
      reportType,
      reportTitle,
      institutionHeader,
      summaryStats: ProcurementStore.getDashboardStats(),
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate procurement report." },
      { status: 500 }
    );
  }
}
