import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INSTITUTION_INFO } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const asset = await prisma.inventoryAsset.findUnique({
      where: { qrToken: params.token },
      select: {
        assetCode: true,
        serialNumber: true,
        condition: true,
        status: true,
        assignedDepartment: true,
        createdAt: true,
        item: {
          select: {
            itemCode: true,
            nameBn: true,
            nameEn: true,
            unit: true,
            category: { select: { nameBn: true } },
          },
        },
        location: {
          select: {
            nameBn: true,
            nameEn: true,
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "সম্পদ বা কিউআর কোডটি সঠিক নয় অথবা প্রতিষ্ঠান থেকে বাতিল করা হয়েছে।" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      institution: {
        nameBn: INSTITUTION_INFO.nameBn,
        nameEn: INSTITUTION_INFO.nameEn,
        established: INSTITUTION_INFO.established,
        addressBn: INSTITUTION_INFO.addressBn,
      },
      asset: {
        assetCode: asset.assetCode,
        itemNameBn: asset.item.nameBn,
        itemNameEn: asset.item.nameEn,
        category: asset.item.category.nameBn,
        serialNumber: asset.serialNumber ? `${asset.serialNumber.slice(0, 4)}****` : null,
        location: asset.location.nameBn,
        department: asset.assignedDepartment,
        condition: asset.condition,
        status: asset.status,
        verifiedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error("Public asset verification error:", error);
    return NextResponse.json(
      { error: "সম্পদ যাচাই প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
