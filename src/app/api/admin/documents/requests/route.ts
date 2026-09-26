import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/**
 * GET /api/admin/documents/requests
 * List guardian document requests with filter and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "15", 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.documentType = type;

    if (search) {
      where.OR = [
        { requestNumber: { contains: search } },
        { purpose: { contains: search } },
        {
          student: {
            OR: [
              { fullNameBn: { contains: search } },
              { fullNameEn: { contains: search } },
              { studentIdNumber: { contains: search } },
            ],
          },
        },
      ];
    }

    const [total, requests] = await Promise.all([
      prisma.documentRequest.count({ where }),
      prisma.documentRequest.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              studentIdNumber: true,
              fullNameBn: true,
              fullNameEn: true,
              gender: true,
            },
          },
          guardian: {
            select: {
              id: true,
              fullNameBn: true,
              phone: true,
              relation: true,
            },
          },
          feeInvoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              netAmount: true,
              paidAmount: true,
            },
          },
          reviewedByUser: {
            select: { id: true, name: true, role: true },
          },
          certificates: {
            select: { id: true, certificateNumber: true, status: true, issueDate: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Admin Document Requests GET error:", error);
    return NextResponse.json({ error: "আবেদন তালিকা লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}
