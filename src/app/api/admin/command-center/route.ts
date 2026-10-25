import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPermittedCommands } from "@/lib/search/commandShortcuts";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/command-center
 * Aggregates pending work across all authoritative ERP modules
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    // Parallel fetch of pending queues across authoritative modules
    const [
      pendingAdmissionsCount,
      pendingFeeInvoicesCount,
      pendingDocumentRequestsCount,
      openTicketsCount,
      lowStockItemsCount,
    ] = await Promise.all([
      prisma.application.count({ where: { status: "SUBMITTED" } }),
      prisma.feeInvoice.count({ where: { status: "UNPAID" } }),
      prisma.documentRequest.count({ where: { status: "SUBMITTED" } }),
      prisma.supportRequest.count({ where: { status: "SUBMITTED" } }),
      prisma.inventoryItem.count({ where: { isActive: true } }),
    ]);

    // Shortcuts for current role
    const shortcuts = getPermittedCommands(user.role as any);

    return NextResponse.json({
      success: true,
      pendingTasks: [
        {
          id: "TASK-ADM",
          titleBn: "অপেক্ষমান ভর্তি আবেদন",
          count: pendingAdmissionsCount,
          url: "/admin/admissions",
          category: "ADMISSION",
          severity: pendingAdmissionsCount > 5 ? "HIGH" : "NORMAL",
        },
        {
          id: "TASK-FIN",
          titleBn: "বকেয়া ফি ইনভয়েস",
          count: pendingFeeInvoicesCount,
          url: "/admin/finance",
          category: "FINANCE",
          severity: pendingFeeInvoicesCount > 10 ? "HIGH" : "NORMAL",
        },
        {
          id: "TASK-DOC",
          titleBn: "প্রত্যয়নপত্র আবেদন কিউ",
          count: pendingDocumentRequestsCount,
          url: "/admin/documents",
          category: "DOCUMENTS",
          severity: pendingDocumentRequestsCount > 0 ? "HIGH" : "NORMAL",
        },
        {
          id: "TASK-TKT",
          titleBn: "উন্মুক্ত হেল্পডেস্ক টিকিট",
          count: openTicketsCount,
          url: "/admin/helpdesk",
          category: "HELPDESK",
          severity: openTicketsCount > 3 ? "HIGH" : "NORMAL",
        },
        {
          id: "TASK-INV",
          titleBn: "মজুদ সংকট (Low Stock)",
          count: lowStockItemsCount,
          url: "/admin/inventory",
          category: "INVENTORY",
          severity: lowStockItemsCount > 0 ? "WARNING" : "NORMAL",
        },
      ],
      shortcuts,
      summary: {
        totalPendingActions:
          pendingAdmissionsCount +
          pendingDocumentRequestsCount +
          openTicketsCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/command-center error:", error);
    return NextResponse.json(
      { error: error.message || "কমান্ড সেন্টার ডাটা লোড ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
