import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/integration/apiKeyManager";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/attendance
 * Institutional Interoperability API - Daily Attendance Records
 * Required Scope: attendance:read
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

    const authResult = validateApiKey(rawApiKey, "attendance:read");
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error || "অননুমোদিত অ্যাক্সেস।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 25)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (dateParam) {
      const d = new Date(dateParam);
      if (!isNaN(d.getTime())) {
        const startOfDay = new Date(d.setHours(0, 0, 0, 0));
        const endOfDay = new Date(d.setHours(23, 59, 59, 999));
        where.date = { gte: startOfDay, lte: endOfDay };
      }
    }

    const [total, attendances] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        include: {
          student: { select: { studentIdNumber: true, fullNameBn: true } },
          jamatClass: { select: { code: true, nameBn: true } },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const formatted = attendances.map((a: any) => ({
      studentIdNumber: a.student?.studentIdNumber || "",
      fullNameBn: a.student?.fullNameBn || "",
      classCode: a.jamatClass?.code || "",
      className: a.jamatClass?.nameBn || "",
      date: a.date.toISOString().split("T")[0],
      status: a.status,
      remarks: a.remarks || "",
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
      { error: error.message || "উপস্থিতি তথ্য লোড করা যায়নি।" },
      { status: 500 }
    );
  }
}
