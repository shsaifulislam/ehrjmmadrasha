import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllDonations,
  createDonation,
  updateDonationStatus,
  deleteDonation,
  FUND_CATEGORIES,
} from "@/lib/donations";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const category = searchParams.get("category") || "";
    const method = searchParams.get("method") || "";

    let donations = getAllDonations();

    // Summary calculations before filtering
    const totalCount = donations.length;
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

    const categoryBreakdown: Record<string, { count: number; amount: number; bn: string }> = {};
    Object.keys(FUND_CATEGORIES).forEach((key) => {
      categoryBreakdown[key] = {
        count: 0,
        amount: 0,
        bn: (FUND_CATEGORIES as any)[key]?.bn || key,
      };
    });

    donations.forEach((d) => {
      if (!categoryBreakdown[d.fundCategory]) {
        categoryBreakdown[d.fundCategory] = {
          count: 0,
          amount: 0,
          bn: d.fundCategoryBn || d.fundCategory,
        };
      }
      categoryBreakdown[d.fundCategory].count += 1;
      categoryBreakdown[d.fundCategory].amount += d.amount;
    });

    // Apply filters
    if (search) {
      donations = donations.filter(
        (d) =>
          d.donorName.toLowerCase().includes(search) ||
          d.donorPhone.toLowerCase().includes(search) ||
          d.receiptNumber.toLowerCase().includes(search) ||
          d.transactionId.toLowerCase().includes(search) ||
          (d.donorEmail && d.donorEmail.toLowerCase().includes(search))
      );
    }

    if (category && category !== "ALL") {
      donations = donations.filter((d) => d.fundCategory === category);
    }

    if (method && method !== "ALL") {
      donations = donations.filter((d) => d.paymentMethod === method);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalCount,
        totalAmount,
        categoryBreakdown,
      },
      donations,
    });
  } catch (error: any) {
    console.error("Admin Donations GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      donorName,
      donorPhone,
      donorEmail,
      donorAddress,
      fundCategory,
      amount,
      paymentMethod,
      paymentMethodBn,
      transactionId,
      isAnonymous,
      notes,
    } = body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "সঠিক অনুদানের পরিমাণ প্রদান করুন।" }, { status: 400 });
    }

    const donation = createDonation({
      donorName: donorName || "সম্মানিত শুভাকাঙ্ক্ষী",
      donorPhone: donorPhone || "N/A",
      donorEmail,
      donorAddress,
      fundCategory: fundCategory || "GENERAL",
      amount: parsedAmount,
      paymentMethod: paymentMethod || "CASH",
      paymentMethodBn: paymentMethodBn || (paymentMethod === "CASH" ? "অফিস ক্যাশ রসিদ" : paymentMethod),
      transactionId: transactionId || `CASH-${Date.now().toString().slice(-6)}`,
      isAnonymous: !!isAnonymous,
      notes,
    });

    await recordAuditLog({
      action: "DONATION_CREATED_ADMIN",
      entityType: "DONATION",
      entityId: donation.id,
      userId: user.userId,
      details: { amount: parsedAmount, receiptNumber: donation.receiptNumber },
    });

    return NextResponse.json({
      success: true,
      message: "অনুদান সফলভাবে এন্ট্রি করা হয়েছে।",
      donation,
    });
  } catch (error: any) {
    console.error("Admin Donations POST Error:", error);
    return NextResponse.json({ error: "Failed to record donation" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "আইডি এবং স্ট্যাটাস আবশ্যক।" }, { status: 400 });
    }

    const updated = updateDonationStatus(id, status, notes);
    if (!updated) {
      return NextResponse.json({ error: "অনুদান রেকর্ড পাওয়া যায়নি।" }, { status: 404 });
    }

    await recordAuditLog({
      action: "DONATION_STATUS_UPDATED",
      entityType: "DONATION",
      entityId: id,
      userId: user.userId,
      details: { newStatus: status },
    });

    return NextResponse.json({
      success: true,
      message: "অনুদান স্ট্যাটাস সফলভাবে আপডেট হয়েছে।",
      donation: updated,
    });
  } catch (error: any) {
    console.error("Admin Donations PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update donation status" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "আইডি আবশ্যক।" }, { status: 400 });
    }

    const success = deleteDonation(id);
    if (!success) {
      return NextResponse.json({ error: "অনুদান রেকর্ড পাওয়া যায়নি।" }, { status: 404 });
    }

    await recordAuditLog({
      action: "DONATION_DELETED",
      entityType: "DONATION",
      entityId: id,
      userId: user.userId,
      details: { deletedId: id },
    });

    return NextResponse.json({
      success: true,
      message: "অনুদান রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    console.error("Admin Donations DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete donation" }, { status: 500 });
  }
}
