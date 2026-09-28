import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const requests = await prisma.transportRequest.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            fullNameEn: true,
            photoUrl: true,
          },
        },
        guardian: {
          select: {
            id: true,
            fullNameBn: true,
            phone: true,
          },
        },
        route: {
          select: {
            id: true,
            routeName: true,
            routeCode: true,
            monthlyFee: true,
            vehicle: {
              select: {
                vehicleNumber: true,
                capacity: true,
              },
            },
          },
        },
        pickupStop: {
          select: {
            id: true,
            stopName: true,
            pickupTime: true,
          },
        },
        dropStop: {
          select: {
            id: true,
            stopName: true,
            dropTime: true,
          },
        },
        session: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("Get transport requests error:", error);
    return NextResponse.json(
      { error: error.message || "আবেদন তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
