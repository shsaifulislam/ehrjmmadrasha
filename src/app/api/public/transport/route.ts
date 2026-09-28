import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const routes = await prisma.transportRoute.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        routeName: true,
        routeCode: true,
        startPoint: true,
        endPoint: true,
        monthlyFee: true,
        stops: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            stopName: true,
            sequenceOrder: true,
            pickupTime: true,
            dropTime: true,
          },
          orderBy: { sequenceOrder: "asc" },
        },
      },
      orderBy: { routeCode: "asc" },
    });

    return NextResponse.json({ success: true, routes });
  } catch (error: any) {
    console.error("Public transport routes error:", error);
    return NextResponse.json(
      { error: "রুট তথ্য লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
