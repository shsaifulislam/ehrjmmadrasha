import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessions = await prisma.academicSession.findMany({
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        isCurrent: true,
      },
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error("Sessions API Error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
