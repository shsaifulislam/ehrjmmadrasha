import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন বা অধ্যক্ষের জন্য প্রযোজ্য।" },
        { status: 403 }
      );
    }

    const [classes, sessions] = await Promise.all([
      prisma.jamatClass.findMany({
        include: {
          sections: {
            orderBy: { nameBn: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.academicSession.findMany({
        orderBy: { startDate: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      classes,
      jamatClasses: classes,
      sessions,
    });
  } catch (error: any) {
    console.error("GET Academic Overview API Error:", error);
    return NextResponse.json(
      { error: "একাডেমিক তথ্য লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
