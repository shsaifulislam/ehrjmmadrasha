import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { parsePaginationParams } from "@/lib/pagination";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/finance/transactions
 * SEC-01 Hardened query endpoint for institutional financial ledger transactions.
 * Enforces strict bounded pagination: default take=50, max take=200.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন বা অধ্যক্ষ মহোদয় প্রবেশ করতে পারেন।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const { page, take, skip } = parsePaginationParams(searchParams, 50, 200);

    const type = searchParams.get("type"); // INCOME | EXPENSE
    const fundCode = searchParams.get("fundCode");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (fundCode) where.fund = { code: fundCode };
    if (search) {
      where.OR = [
        { receiptOrVoucherNo: { contains: search } },
        { payeeOrPayer: { contains: search } },
        { referenceNo: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const [total, transactions] = await Promise.all([
      prisma.cashTransaction.count({ where }),
      prisma.cashTransaction.findMany({
        where,
        include: {
          fund: {
            select: {
              id: true,
              nameBn: true,
              code: true,
              currentBalance: true,
            },
          },
        },
        orderBy: { transactionDate: "desc" },
        skip,
        take,
      }),
    ]);

    return NextResponse.json({
      success: true,
      page,
      take,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
      transactions,
    });
  } catch (error: any) {
    console.error("GET /api/admin/finance/transactions error:", error);
    return NextResponse.json(
      { error: "লেনদেন তালিকা লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
