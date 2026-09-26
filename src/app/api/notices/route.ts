import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ success: true, notices });
  } catch (error) {
    console.error("Notices API Error:", error);
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}
