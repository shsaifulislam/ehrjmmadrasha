import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enrollStudentInTransport } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const routeId = searchParams.get("routeId");
    const search = searchParams.get("search");

    const where: any = {};
    if (status) where.status = status;
    if (routeId) where.routeId = routeId;
    if (search) {
      where.student = {
        OR: [
          { studentIdNumber: { contains: search } },
          { fullNameBn: { contains: search } },
          { fullNameEn: { contains: search } },
        ],
      };
    }

    const enrollments = await prisma.transportEnrollment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            fullNameEn: true,
            photoUrl: true,
            residentialStatus: true,
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
                id: true,
                vehicleNumber: true,
                capacity: true,
                driver: {
                  select: {
                    id: true,
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

    return NextResponse.json({ success: true, enrollments });
  } catch (error: any) {
    console.error("Get transport enrollments error:", error);
    return NextResponse.json(
      { error: error.message || "পরিবহন তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, sessionId, routeId, pickupStopId, dropStopId, monthlyFee, startDate, notes } = body;

    if (!studentId || !sessionId || !routeId) {
      return NextResponse.json(
        { error: "শিক্ষার্থী, শিক্ষাবর্ষ এবং রুট নির্বাচন আবশ্যক।" },
        { status: 400 }
      );
    }

    const enrollment = await enrollStudentInTransport({
      studentId,
      sessionId,
      routeId,
      pickupStopId,
      dropStopId,
      monthlyFee: monthlyFee !== undefined ? Number(monthlyFee) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      notes,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, enrollment });
  } catch (error: any) {
    console.error("Enroll student in transport error:", error);
    return NextResponse.json(
      { error: error.message || "শিক্ষার্থীকে পরিবহন সেবায় যুক্ত করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
