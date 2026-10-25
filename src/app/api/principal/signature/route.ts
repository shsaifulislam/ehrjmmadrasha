import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * POST /api/principal/signature
 * Secure endpoint to upload & persist Principal's official seal and digital signature.
 * Enforces:
 * - Strict RBAC: ADMIN or PRINCIPAL only
 * - MIME type validation: image/png, image/jpeg, image/webp
 * - File size limit: max 2MB
 * - Persistent storage in public/uploads/signatures/
 * - Update PrincipalProfile.signatureUrl
 * - Immutable AuditLog record
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অধ্যক্ষ ও অ্যাডমিন স্বাক্ষর আপলোড করতে পারেন।" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("signature") as File | null;

    if (!file) {
      return NextResponse.json({ error: "অনুগ্রহ করে একটি স্বাক্ষর/সিল ফাইল নির্বাচন করুন।" }, { status: 400 });
    }

    // 1. File size check: Max 2MB (2,097,152 bytes)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "ফাইলের আকার সর্বোচ্চ ২ মেগাবাইট (2MB) হতে হবে।" },
        { status: 400 }
      );
    }

    // 2. MIME type check
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "শুধুমাত্র PNG, JPG বা WEBP ফরম্যাটের ছবি আপলোডযোগ্য।" },
        { status: 400 }
      );
    }

    // 3. Prepare target directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", "signatures");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 4. Generate safe unique filename
    const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
    const fileName = `principal_signature_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/signatures/${fileName}`;

    // 5. Update PrincipalProfile in Database
    let profile = await prisma.principalProfile.findFirst();
    if (!profile) {
      profile = await prisma.principalProfile.create({
        data: {
          fullNameBn: "মুহতামিম মাওলানা আব্দুল কাইয়ুম",
          fullNameEn: "Principal Maulana Abdul Qayyum",
          officialMessageBn: "বিসমিল্লাহির রাহমানির রাহিম। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কুরআন-সুন্নাহর সঠিক প্রচার ও চরিত্রবান আদর্শ নাগরিক গড়ার একটি অন্যতম শ্রেষ্ঠ মারকাজ।",
          signatureUrl: publicUrl,
        },
      });
    } else {
      profile = await prisma.principalProfile.update({
        where: { id: profile.id },
        data: { signatureUrl: publicUrl },
      });
    }

    // 6. Record Immutable Audit Log
    await recordAuditLog({
      userId: user.userId,
      action: "PRINCIPAL_SIGNATURE_UPDATED",
      entityType: "PrincipalProfile",
      entityId: profile.id,
      details: {
        fileName,
        fileSize: file.size,
        mimeType: file.type,
        updatedBy: user.name,
        role: user.role,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "মুহতামিমের অফিসিয়াল ডিজিটাল স্বাক্ষর সফলভাবে আপলোড ও ডাটাবেজে সংরক্ষিত হয়েছে।",
      signatureUrl: publicUrl,
      profile,
    });
  } catch (error: any) {
    console.error("Principal Signature Upload Error:", error);
    return NextResponse.json(
      { error: error.message || "স্বাক্ষর ফাইল সংরক্ষণ করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
