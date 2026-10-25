import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "PRINCIPAL" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get("routeId");

    const where: any = { status: "ACTIVE" };
    if (routeId) where.routeId = routeId;

    // Read-only roster of active transport students for academic coordination
    const roster = await prisma.transportEnrollment.findMany({
      where,
      select: {
        id: true,
        startDate: true,
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
                jamatClass: { select: { nameBn: true } },
                section: { select: { nameBn: true } },
              },
              take: 1,
            },
          },
        },
        route: {
          select: {
            id: true,
            routeName: true,
            routeCode: true,
            startPoint: true,
            endPoint: true,
            vehicle: {
              select: {
                vehicleNumber: true,
                model: true,
                driver: {
                  select: {
                    name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        pickupStop: {
          select: {
            stopName: true,
            pickupTime: true,
          },
        },
        dropStop: {
          select: {
            stopName: true,
            dropTime: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const activeRoutes = await prisma.transportRoute.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        routeName: true,
        routeCode: true,
      },
    });

    return NextResponse.json({
      success: true,
      routes: activeRoutes,
      roster,
    });
  } catch (error: any) {
    console.error("Teacher transport roster error:", error);
    return NextResponse.json(
      { error: error.message || "পরিবহন রোস্টার লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
