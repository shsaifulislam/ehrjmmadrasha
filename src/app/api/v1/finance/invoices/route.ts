import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/integration/apiKeyManager";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/finance/invoices
 * Institutional Interoperability API - Fee Invoices Summary
 * Required Scope: finance:read
 */
export async function GET(req: NextRequest) {
  try {
    const rawApiKey =
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (!rawApiKey) {
      return NextResponse.json(
        { error: "অননুমোদিত অনুরোধ। 'x-api-key' হেডার প্রদান করুন।" },
        { status: 401 }
      );
    }

    const authResult = validateApiKey(rawApiKey, "finance:read");
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error || "অননুমোদিত অ্যাক্সেস।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 25)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [total, invoices] = await Promise.all([
      prisma.feeInvoice.count({ where }),
      prisma.feeInvoice.findMany({
        where,
        include: {
          student: { select: { studentIdNumber: true, fullNameBn: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const formatted = invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      studentIdNumber: inv.student.studentIdNumber,
      studentName: inv.student.fullNameBn,
      feeType: inv.feeType,
      netAmount: inv.netAmount,
      paidAmount: inv.paidAmount,
      dueAmount: inv.dueAmount,
      status: inv.status,
      dueDate: inv.dueDate.toISOString().split("T")[0],
    }));

    const response = NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      meta: {
        apiVersion: "v1.0",
        institution: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
      },
    });

    response.headers.set("x-ratelimit-remaining", String(authResult.rateLimitRemaining ?? 60));
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ইনভয়েস তথ্য লোড করা যায়নি।" },
      { status: 500 }
    );
  }
}
