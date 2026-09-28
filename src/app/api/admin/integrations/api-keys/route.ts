import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { loadApiKeys, createApiKey, revokeApiKey } from "@/lib/integration";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const keys = loadApiKeys();
    return NextResponse.json({ success: true, data: keys });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load API keys" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "কেবলমাত্র অ্যাডমিন নতুন এপিআই কী ইস্যু করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, owner, ownerType, scopes, environment, rateLimitPerMin, validDays } = body;

    if (!name || !owner || !scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json(
        { error: "নাম, ওনার এবং কমপক্ষে একটি ভ্যালিড স্কোপ আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await createApiKey({
      name,
      owner,
      ownerType: ownerType || "EXTERNAL_INSTITUTION",
      scopes,
      environment: environment || "PRODUCTION",
      rateLimitPerMin: rateLimitPerMin ? Number(rateLimitPerMin) : 60,
      validDays: validDays ? Number(validDays) : 180,
      createdBy: user.userId,
    });

    return NextResponse.json({
      success: true,
      message: "নতুন এপিআই কী সফলভাবে তৈরি হয়েছে। গোপনীয় কী-টি সংরক্ষণ করুন, এটি পুনরায় আর প্রদর্শিত হবে না।",
      data: {
        record: result.record,
        rawKey: result.rawKey, // Returned exactly once
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create API key" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "কেবলমাত্র অ্যাডমিন এপিআই কী বাতিল করতে পারেন।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const reason = searchParams.get("reason") || "Admin revocation";

    if (!id) {
      return NextResponse.json({ error: "এপিআই কী আইডি প্রদান করুন।" }, { status: 400 });
    }

    const updated = await revokeApiKey(id, user.userId, reason);
    return NextResponse.json({
      success: true,
      message: "এপিআই কী সফলভাবে বাতিল (Revoke) করা হয়েছে।",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to revoke API key" }, { status: 500 });
  }
}
