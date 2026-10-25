/**
 * EHRJ MADRASHA ERP — PHASE 40
 * Procurement Integration Bridge
 * 
 * Inter-phase bridge respecting strict source-of-truth invariants:
 * - Phase 12 (Inventory & POs): Reads PurchaseRequests, PurchaseOrders, GoodsReceipts.
 * - Phase 6 (Finance): Reads CashTransactions for payment reconciliations.
 * - Phase 41 (Budget): Checks budget line commitments and allocations.
 * - Phase 33 (Calendar): Schedules contract renewal reminders.
 * - STRICTLY NO SMS — In-app portal alerts only.
 */

import { prisma } from "../prisma";
import { ProcurementStore } from "./procurementStore";
import { Contract, ThreeWayMatchStatus } from "./types";

export class ProcurementIntegrationBridge {
  /**
   * Fetches Phase 12 Purchase Requests eligible for RFQ quotation tenders
   */
  static async getEligiblePurchaseRequests(): Promise<
    {
      id: string;
      requestNumber: string;
      title: string;
      purpose: string;
      totalEstimatedCost: number;
      itemCount: number;
      requestedDate: Date;
    }[]
  > {
    try {
      const prs = await prisma.purchaseRequest.findMany({
        where: {
          status: { in: ["APPROVED", "DRAFT", "SUBMITTED"] },
        },
        include: {
          items: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return prs.map((p) => ({
        id: p.id,
        requestNumber: p.requestNumber,
        title: p.title,
        purpose: p.purpose,
        totalEstimatedCost: p.totalEstimatedCost,
        itemCount: p.items.length,
        requestedDate: p.requestedDate,
      }));
    } catch (err) {
      console.warn("Could not fetch Phase 12 Purchase Requests:", err);
      return [];
    }
  }

  /**
   * Fetches Phase 12 Purchase Orders for a given vendor
   */
  static async getVendorPurchaseOrders(supplierCodeOrName: string): Promise<
    {
      id: string;
      poNumber: string;
      status: string;
      totalAmount: number;
      orderDate: Date;
      itemCount: number;
    }[]
  > {
    try {
      const pos = await prisma.purchaseOrder.findMany({
        where: {
          supplier: {
            OR: [
              { supplierCode: supplierCodeOrName },
              { name: { contains: supplierCodeOrName } },
            ],
          },
        },
        include: {
          items: true,
        },
        orderBy: { orderDate: "desc" },
      });

      return pos.map((po) => ({
        id: po.id,
        poNumber: po.poNumber,
        status: po.status,
        totalAmount: po.totalAmount,
        orderDate: po.orderDate,
        itemCount: po.items.length,
      }));
    } catch (err) {
      console.warn("Could not fetch Phase 12 POs:", err);
      return [];
    }
  }

  /**
   * Reconciles Three-Way Match for a Contract or PO:
   * 1. Purchase Order Amount (Phase 12)
   * 2. Goods Receipt Received Items/Value (Phase 12)
   * 3. Financial Cash Transaction Payments (Phase 6)
   */
  static async reconcileThreeWayMatch(params: {
    contractId?: string;
    purchaseOrderId?: string;
  }): Promise<{
    status: ThreeWayMatchStatus;
    poAmount: number;
    receivedAmount: number;
    paidAmount: number;
    discrepancyBdt: number;
    detailsBn: string;
  }> {
    let poAmount = 0;
    let receivedAmount = 0;
    let paidAmount = 0;

    let contract: Contract | undefined;
    if (params.contractId) {
      contract = ProcurementStore.getContractById(params.contractId);
      if (contract) {
        poAmount = contract.totalContractValue;
      }
    }

    if (params.purchaseOrderId) {
      try {
        const po = await prisma.purchaseOrder.findUnique({
          where: { id: params.purchaseOrderId },
          include: {
            items: true,
            goodsReceipts: {
              include: { items: true },
            },
          },
        });

        if (po) {
          poAmount = po.totalAmount;
          // Calculate goods receipt amount
          let grnVal = 0;
          for (const grn of po.goodsReceipts) {
            for (const it of grn.items) {
              const poItem = po.items.find((pi) => pi.itemId === it.itemId);
              const unitCost = poItem?.unitPrice || it.unitCost || 0;
              grnVal += (it.quantityReceived || 0) * unitCost;
            }
          }
          receivedAmount = grnVal;
        }
      } catch (e) {
        console.warn("Could not query PO for 3-way match:", e);
      }
    }

    // Check Phase 6 payments
    try {
      const orConditions: any[] = [];
      if (contract) {
        orConditions.push({ notes: { contains: contract.contractCode } });
        orConditions.push({ notes: { contains: contract.vendorNameBn } });
        orConditions.push({ payeeOrPayer: { contains: contract.vendorNameBn } });
      }
      if (params.purchaseOrderId) {
        orConditions.push({ referenceNo: params.purchaseOrderId });
      }

      const txs = await prisma.cashTransaction.findMany({
        where: {
          type: "EXPENSE",
          ...(orConditions.length > 0 ? { OR: orConditions } : {}),
        },
      });

      paidAmount = txs.reduce((sum, tx) => sum + tx.amount, 0);
    } catch (e) {
      console.warn("Could not query CashTransactions:", e);
    }

    const discrepancy = Math.abs(poAmount - paidAmount);
    let matchStatus: ThreeWayMatchStatus = "PENDING";
    let detailsBn = "ম্যাচিং অপেক্ষমান";

    if (poAmount > 0 && paidAmount > 0) {
      if (discrepancy === 0) {
        matchStatus = "MATCHED";
        detailsBn = "কার্যাদেশ মূল্য ও পরিশোধিত বিল শতভাগ সামঞ্জস্যপূর্ণ";
      } else if (paidAmount < poAmount) {
        matchStatus = "PARTIALLY_MATCHED";
        detailsBn = `আংশিক বিল পরিশোধিত (বকেয়া: ৳${(poAmount - paidAmount).toLocaleString("bn-BD")})`;
      } else {
        matchStatus = "MISMATCH";
        detailsBn = `বিল অসামঞ্জস্য! অনুমোদিত মূল্যের চেয়ে ৳${(paidAmount - poAmount).toLocaleString("bn-BD")} বেশি পরিশোধিত`;
      }
    } else if (poAmount > 0 && receivedAmount > 0 && paidAmount === 0) {
      matchStatus = "PARTIALLY_MATCHED";
      detailsBn = "পণ্য গ্রহণ সম্পন্ন, বিল পরিশোধ অপেক্ষমান";
    }

    if (contract) {
      contract.threeWayMatchStatus = matchStatus;
      ProcurementStore.saveContract(contract);
    }

    return {
      status: matchStatus,
      poAmount,
      receivedAmount,
      paidAmount,
      discrepancyBdt: discrepancy,
      detailsBn,
    };
  }

  /**
   * Phase 33 Calendar Integration:
   * Synchronizes contract expiration and renewal reminders to the institutional calendar
   */
  static async syncContractToCalendar(contractId: string): Promise<{
    success: boolean;
    calendarEventId?: string;
    message: string;
  }> {
    try {
      const contract = ProcurementStore.getContractById(contractId);
      if (!contract) {
        return { success: false, message: "চুক্তিপত্র পাওয়া যায়নি।" };
      }

      const { getCalendarEvents, saveCalendarEvents } = await import("../calendar/calendarStore");
      const events = getCalendarEvents();
      const existingIdx = events.findIndex(
        (e) => e.sourceEntityId === contract.id || e.id === `CAL-CON-${contract.id}`
      );

      const eventId = `CAL-CON-${contract.id}`;
      const now = new Date().toISOString();

      const calEvent = {
        id: eventId,
        title: `[চুক্তি মেয়াদ শেষ] ${contract.titleBn} (${contract.vendorNameBn})`,
        titleBn: `[চুক্তি মেয়াদ শেষ] ${contract.titleBn} (${contract.vendorNameBn})`,
        eventType: "INSTITUTIONAL" as const,
        startAt: `${contract.endDate}T09:00:00.000Z`,
        endAt: `${contract.endDate}T17:00:00.000Z`,
        timezone: "Asia/Dhaka",
        allDay: true,
        status: (contract.status === "ACTIVE" || contract.status === "EXPIRING" ? "SCHEDULED" : "COMPLETED") as any,
        visibility: "ADMIN_ONLY" as const,
        sourceModule: "FINANCE" as const,
        sourceEntityId: contract.id,
        location: "মাদরাসা প্রশাসনিক দপ্তর",
        descriptionBn: `চুক্তি নং: ${contract.contractCode || contract.id}, মূল্য: ৳${contract.totalContractValue.toLocaleString("bn-BD")}`,
        createdBy: "procurement-system",
        updatedBy: "procurement-system",
        createdAt: now,
        updatedAt: now,
      };

      if (existingIdx >= 0) {
        events[existingIdx] = { ...events[existingIdx], ...calEvent, updatedAt: now };
      } else {
        events.push(calEvent);
      }

      saveCalendarEvents(events);
      return {
        success: true,
        calendarEventId: eventId,
        message: "চুক্তির মেয়াদোত্তীর্ণ সতর্কতা প্রাতিষ্ঠানিক ক্যালেন্ডারে সিনক্রোনাইজ করা হয়েছে।",
      };
    } catch (err: any) {
      console.warn("Calendar sync failed:", err);
      return { success: false, message: err.message || "Calendar sync failed" };
    }
  }

  /**
   * Phase 33 Calendar Integration:
   * Synchronizes RFQ submission deadlines to the institutional calendar
   */
  static async syncRfqDeadlineToCalendar(rfqId: string): Promise<{
    success: boolean;
    calendarEventId?: string;
    message: string;
  }> {
    try {
      const rfq = ProcurementStore.getRFQById(rfqId);
      if (!rfq) {
        return { success: false, message: "দরপত্র পাওয়া যায়নি।" };
      }

      const { getCalendarEvents, saveCalendarEvents } = await import("../calendar/calendarStore");
      const events = getCalendarEvents();
      const eventId = `CAL-RFQ-${rfq.id}`;
      const existingIdx = events.findIndex(
        (e) => e.sourceEntityId === rfq.id || e.id === eventId
      );

      const now = new Date().toISOString();
      const calEvent = {
        id: eventId,
        title: `[দরপত্র ডেডলাইন] ${rfq.titleBn}`,
        titleBn: `[দরপত্র ডেডলাইন] ${rfq.titleBn}`,
        eventType: "INSTITUTIONAL" as const,
        startAt: `${rfq.submissionDeadline}T10:00:00.000Z`,
        endAt: `${rfq.submissionDeadline}T17:00:00.000Z`,
        timezone: "Asia/Dhaka",
        allDay: true,
        status: (rfq.status === "OPEN" ? "SCHEDULED" : "COMPLETED") as any,
        visibility: "ADMIN_ONLY" as const,
        sourceModule: "FINANCE" as const,
        sourceEntityId: rfq.id,
        location: "মাদরাসা প্রশাসনিক দপ্তর",
        descriptionBn: `দরপত্র কোড: ${rfq.rfqCode || rfq.id}, আইটেম সংখ্যা: ${rfq.items.length}`,
        createdBy: "procurement-system",
        updatedBy: "procurement-system",
        createdAt: now,
        updatedAt: now,
      };

      if (existingIdx >= 0) {
        events[existingIdx] = { ...events[existingIdx], ...calEvent, updatedAt: now };
      } else {
        events.push(calEvent);
      }

      saveCalendarEvents(events);
      return {
        success: true,
        calendarEventId: eventId,
        message: "দরপত্র জমা দেওয়ার সময়সীমা প্রাতিষ্ঠানিক ক্যালেন্ডারে যুক্ত করা হয়েছে।",
      };
    } catch (err: any) {
      console.warn("Calendar sync failed for RFQ:", err);
      return { success: false, message: err.message || "Calendar sync failed" };
    }
  }
}
