import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/hostel/requests
 * Lists guardian residential requests with filters (status, requestType, sessionId) and pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || ""; // SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
    const requestType = searchParams.get("requestType") || "";
    const sessionId = searchParams.get("sessionId") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (requestType) where.requestType = requestType;
    if (sessionId) where.sessionId = sessionId;

    const [requests, total] = await Promise.all([
      prisma.residentialRequest.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              studentIdNumber: true,
              fullNameBn: true,
              fullNameEn: true,
              residentialStatus: true,
            },
          },
          guardian: {
            select: {
              id: true,
              fullNameBn: true,
              relation: true,
              phone: true,
            },
          },
          session: { select: { id: true, name: true } },
          reviewedByUser: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.residentialRequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/hostel/requests error:", error);
    return NextResponse.json(
      { error: error.message || "আবেদন তালিকা সংগ্রহে ত্রুটি ঘটেছে।" },
      { status: 500 }
    );
  }
}
