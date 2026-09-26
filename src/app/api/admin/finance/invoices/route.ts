import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { calculateStudentFee, generateNextInvoiceNumber } from "@/lib/feeCalculationService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/finance/invoices
 * Paginated list of student fee invoices
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");
    const feeType = searchParams.get("feeType");
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 25)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (status) where.status = status;
    if (feeType) where.feeType = feeType;

    if (classId) {
      where.student = {
        enrollments: {
          some: { classId, status: "ACTIVE" },
        },
      };
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { title: { contains: search } },
        { student: { fullNameBn: { contains: search } } },
        { student: { studentIdNumber: { contains: search } } },
      ];
    }

    const [total, invoices, summary] = await Promise.all([
      prisma.feeInvoice.count({ where }),
      prisma.feeInvoice.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              studentIdNumber: true,
              fullNameBn: true,
              fullNameEn: true,
              residentialStatus: true,
              enrollments: {
                where: { status: "ACTIVE" },
                select: {
                  rollNumber: true,
                  jamatClass: { select: { id: true, nameBn: true } },
                  section: { select: { nameBn: true } },
                },
                take: 1,
              },
            },
          },
          session: { select: { id: true, name: true } },
          receipts: {
            select: {
              id: true,
              receiptNumber: true,
              amount: true,
              paymentMethod: true,
              receiptDate: true,
            },
          },
          refunds: {
            select: {
              id: true,
              refundNumber: true,
              amount: true,
              refundDate: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.feeInvoice.aggregate({
        where,
        _sum: {
          totalAmount: true,
          netAmount: true,
          paidAmount: true,
          dueAmount: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalBilled: summary._sum.netAmount || 0,
        totalCollected: summary._sum.paidAmount || 0,
        totalDue: summary._sum.dueAmount || 0,
      },
    });
  } catch (error: any) {
    console.error("Invoices GET error:", error);
    return NextResponse.json({ error: "ইনভয়েস লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/finance/invoices
 * Create a new student fee invoice using the Fee Rule Engine
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন ইনভয়েস তৈরি করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentId,
      sessionId,
      classId,
      feeType,
      title,
      dueDate,
      customBaseFee,
      customDiscount = 0,
      customWaiver = 0,
    } = body;

    if (!studentId || !sessionId || !feeType) {
      return NextResponse.json(
        { error: "শিক্ষার্থী, সেশন এবং ফি ধরন প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    // Resolve classId from active enrollment if not provided
    let resolvedClassId = classId;
    if (!resolvedClassId) {
      const activeEnrollment = await prisma.enrollment.findFirst({
        where: { studentId, sessionId, status: "ACTIVE" },
      });
      if (activeEnrollment) resolvedClassId = activeEnrollment.classId;
    }

    // Run canonical Fee Calculation Service
    const calc = await calculateStudentFee({
      sessionId,
      classId: resolvedClassId || "",
      studentId,
      feeType,
      customBaseFee: customBaseFee !== undefined ? Number(customBaseFee) : undefined,
    });

    const invoiceNumber = await generateNextInvoiceNumber();
    const resolvedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    const resolvedTitle = title || `ফি ইনভয়েস (${feeType}) - ${invoiceNumber}`;

    const totalAmount = calc.baseAmount;
    const discountAmount = calc.scholarshipAmount + calc.assistanceAmount + Number(customDiscount);
    const waiverAmount = calc.waiverAmount + Number(customWaiver);
    const lateFeeAmount = calc.lateFeeAmount;
    const netAmount = Math.max(0, totalAmount - discountAmount - waiverAmount + lateFeeAmount);
    const dueAmount = netAmount;

    const invoice = await prisma.feeInvoice.create({
      data: {
        invoiceNumber,
        studentId,
        sessionId,
        feeType,
        title: resolvedTitle,
        dueDate: resolvedDueDate,
        totalAmount,
        discountAmount,
        waiverAmount,
        lateFeeAmount,
        netAmount,
        paidAmount: 0,
        dueAmount,
        fundCode: calc.fundCode,
        status: netAmount === 0 ? "WAIVED" : "UNPAID",
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "CREATE_FEE_INVOICE",
      entityType: "FeeInvoice",
      entityId: invoice.id,
      details: {
        invoiceNumber,
        studentId,
        feeType,
        totalAmount,
        netAmount,
        fundCode: calc.fundCode,
      },
    });

    return NextResponse.json({
      success: true,
      message: `ইনভয়েস ${invoiceNumber} সফলভাবে প্রস্তুত হয়েছে।`,
      invoice,
      calculation: calc,
    });
  } catch (error: any) {
    console.error("Invoice POST error:", error);
    return NextResponse.json({ error: error.message || "ইনভয়েস তৈরি ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
