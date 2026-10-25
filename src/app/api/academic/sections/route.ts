import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const sections = await prisma.section.findMany({
      where: classId ? { classId } : {},
      orderBy: { nameBn: "asc" },
      select: {
        id: true,
        nameBn: true,
        nameEn: true,
        classId: true,
        roomNo: true,
        maxCapacity: true,
      },
    });

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    console.error("Sections API Error:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}
