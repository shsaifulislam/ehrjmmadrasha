import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/integration/apiKeyManager";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/students
 * Institutional Interoperability API - External Student Directory
 * Required Scope: students:read
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

    const authResult = validateApiKey(rawApiKey, "students:read");
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error || "অননুমোদিত অ্যাক্সেস।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 25)));
    const skip = (page - 1) * limit;
    const classCode = searchParams.get("classCode");

    const where: any = { status: "ACTIVE" };
    if (classCode) {
      where.enrollments = {
        some: {
          class: { code: classCode },
          status: "ACTIVE",
        },
      };
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        select: {
          id: true,
          studentIdNumber: true,
          fullNameBn: true,
          fullNameEn: true,
          gender: true,
          status: true,
          enrollments: {
            where: { status: "ACTIVE" },
            select: {
              rollNumber: true,
              jamatClass: { select: { code: true, nameBn: true } },
              session: { select: { id: true, name: true } },
            },
            take: 1,
          },
        },
        orderBy: { studentIdNumber: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const formatted = students.map((s: any) => ({
      studentIdNumber: s.studentIdNumber,
      fullNameBn: s.fullNameBn,
      fullNameEn: s.fullNameEn || "",
      gender: s.gender,
      className: s.enrollments?.[0]?.jamatClass?.nameBn || "N/A",
      classCode: s.enrollments?.[0]?.jamatClass?.code || "N/A",
      rollNumber: s.enrollments?.[0]?.rollNumber || 0,
      sessionName: s.enrollments?.[0]?.session?.name || "N/A",
      status: s.status,
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
      { error: error.message || "শিক্ষার্থী তালিকা লোড করা যায়নি।" },
      { status: 500 }
    );
  }
}
