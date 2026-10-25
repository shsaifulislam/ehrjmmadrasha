import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/principal/profile
 * Retrieve authoritative Principal Profile and institutional message
 */
export async function GET() {
  try {
    let profile = await prisma.principalProfile.findFirst();
    if (!profile) {
      profile = await prisma.principalProfile.create({
        data: {
          fullNameBn: "মাওলানা মহা. আবুল কালাম সরকার",
          fullNameEn: "Maulana Md. Abul Kalam Sarkar",
          designationBn: "মুহতামিম ও অধ্যক্ষ",
          designationEn: "Principal & Shaykhul Hadith",
          bioBn: "সুদীর্ঘ অভিজ্ঞ আলেমে দ্বীন, মুহতামিম ও অধ্যক্ষ — ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (স্থাপিত: ২০২১ইং)।",
          photoUrl: "/images/principal.jpg",
          officialMessageBn:
            "বিসমিল্লাহির রাহমানির রাহিম। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কুরআন-সুন্নাহর সঠিক প্রচার ও চরিত্রবান আদর্শ নাগরিক গড়ার একটি অন্যতম শ্রেষ্ঠ মারকাজ। আমাদের লক্ষ্য শুধু কিতাবি জ্ঞান নয়, বরং আমলে পরিপূর্ণ এক আদর্শ প্রজন্ম তৈরি করা। আল্লাহ তায়ালা এই প্রতিষ্ঠানকে কিয়ামত পর্যন্ত দ্বীনের জন্য কবুল করুন। আমিন।",
        },
      });
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("Principal Profile GET Error:", error);
    return NextResponse.json({ error: "মুহতামিম প্রোফাইল লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}

/**
 * PUT /api/principal/profile
 * Update Principal Profile & Official Statement with strict audit trail
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন ও মুহতামিম প্রোফাইল আপডেট করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { officialMessageBn, bioBn, bioEn, photoUrl, signatureUrl } = body;

    let profile = await prisma.principalProfile.findFirst();
    if (!profile) {
      profile = await prisma.principalProfile.create({
        data: {
          fullNameBn: "মাওলানা মহা. আবুল কালাম সরকার",
          fullNameEn: "Maulana Md. Abul Kalam Sarkar",
          officialMessageBn: officialMessageBn || "বিসমিল্লাহির রাহমানির রাহিম।",
          bioBn: bioBn || null,
          photoUrl: photoUrl || "/images/principal.jpg",
        },
      });
    } else {
      const updateData: any = {};
      if (officialMessageBn !== undefined) updateData.officialMessageBn = String(officialMessageBn).trim();
      if (bioBn !== undefined) updateData.bioBn = String(bioBn).trim();
      if (bioEn !== undefined) updateData.bioEn = bioEn ? String(bioEn).trim() : null;
      if (photoUrl !== undefined) updateData.photoUrl = String(photoUrl).trim();
      if (signatureUrl !== undefined) updateData.signatureUrl = String(signatureUrl).trim();

      profile = await prisma.principalProfile.update({
        where: { id: profile.id },
        data: updateData,
      });
    }

    // Record immutable audit log
    await recordAuditLog({
      userId: user.userId,
      action: "PRINCIPAL_PROFILE_UPDATED",
      entityType: "PrincipalProfile",
      entityId: profile.id,
      details: {
        updatedBy: user.name,
        role: user.role,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "মুহতামিম মহোদয়ের বার্তা ও প্রোফাইল সফলভাবে আপডেট করা হয়েছে।",
      profile,
    });
  } catch (error: any) {
    console.error("Principal Profile PUT Error:", error);
    return NextResponse.json({ error: error.message || "প্রোফাইল আপডেট ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
