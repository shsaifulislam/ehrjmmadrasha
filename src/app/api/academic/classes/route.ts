import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const classes = await prisma.jamatClass.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        sections: true,
        subjects: true,
      },
    });

    return NextResponse.json({ success: true, classes });
  } catch (error) {
    console.error("Classes API Error:", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}
