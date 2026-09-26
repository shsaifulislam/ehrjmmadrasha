import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appId = searchParams.get("appId")?.trim();
    const phone = searchParams.get("phone")?.trim();

    if (!appId && !phone) {
      return NextResponse.json(
        { error: "আবেদন ট্র্যাকিং নম্বর (Tracking ID) অথবা মোবাইল নম্বর প্রদান করুন।" },
        { status: 400 }
      );
    }

    const application = await prisma.application.findFirst({
      where: {
        OR: [
          appId ? { applicationNumber: appId } : undefined,
          phone ? { guardianPhone: phone } : undefined,
        ].filter(Boolean) as any,
      },
      select: {
        id: true,
        applicationNumber: true,
        studentNameBn: true,
        studentNameEn: true,
        guardianName: true,
        guardianPhone: true,
        status: true,
        remarks: true,
        createdAt: true,
        desiredClassId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!application) {
      return NextResponse.json(
        { error: "প্রদত্ত তথ্যের সাথে কোনো ভর্তি আবেদন খুঁজে পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // Lookup class name if exists
    let classNameBn = "নির্ধারিত বিভাগ";
    if (application.desiredClassId) {
      const cls = await prisma.jamatClass.findUnique({
        where: { id: application.desiredClassId },
        select: { nameBn: true },
      });
      if (cls) classNameBn = cls.nameBn;
    }

    return NextResponse.json({
      success: true,
      application: {
        ...application,
        classNameBn,
      },
    });
  } catch (error: any) {
    console.error("Admission Track API Error:", error);
    return NextResponse.json(
      { error: "আবেদন তথ্য অনুসন্ধান করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
