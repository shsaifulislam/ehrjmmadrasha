import { NextRequest, NextResponse } from "next/server";
import { createDonation, getAllDonations } from "@/lib/donations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const donations = getAllDonations();
    // Return sanitized public donation stats (without leaking donor private phones)
    const publicStats = {
      totalCount: donations.length,
      totalAmount: donations.reduce((sum, d) => sum + d.amount, 0),
      recentDonations: donations.slice(0, 8).map((d) => ({
        id: d.id,
        receiptNumber: d.receiptNumber,
        donorName: d.isAnonymous ? "গোপন দাতা" : d.donorName,
        fundCategoryBn: d.fundCategoryBn,
        amount: d.amount,
        createdAt: d.createdAt,
      })),
    };
    return NextResponse.json({ success: true, ...publicStats });
  } catch (error) {
    console.error("Donations GET error:", error);
    return NextResponse.json({ success: false, error: "তথ্যাদি লোড করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json(
        { success: false, error: "অনুগ্রহ করে দানের একটি সঠিক অংক (যেকোনো পরিমাণ) প্রদান করুন।" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: "অনুগ্রহ করে একটি পেমেন্ট মেথড নির্বাচন করুন।" },
        { status: 400 }
      );
    }

    if (!transactionId || transactionId.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "অনুগ্রহ করে আপনার পেমেন্টের ট্রানজেকশন আইডি (TrxID) বা ব্যাংক রেফারেন্স দিন।" },
        { status: 400 }
      );
    }

    const existingDonation = getAllDonations().find(
      (d) => d.transactionId.trim().toUpperCase() === transactionId.trim().toUpperCase()
    );
    if (existingDonation) {
      return NextResponse.json(
        { success: false, error: "এই ট্রানজেকশন আইডিটি (TrxID) ইতিপূর্বে অনুদানে জমা দেওয়া হয়েছে।" },
        { status: 409 }
      );
    }

    if (!isAnonymous && (!donorName || donorName.trim().length < 2)) {
      return NextResponse.json(
        { success: false, error: "দাতার নাম প্রদান করুন অথবা 'গোপন দাতা' নির্বাচন করুন।" },
        { status: 400 }
      );
    }

    const donation = createDonation({
      donorName: donorName || "গোপন দাতা",
      donorPhone: donorPhone || "N/A",
      donorEmail,
      donorAddress,
      fundCategory: fundCategory || "ORPHAN_LILLAH",
      amount: parsedAmount,
      paymentMethod,
      paymentMethodBn,
      transactionId,
      isAnonymous: !!isAnonymous,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: "আলহামদুলিল্লাহ! আপনার অনুদান সফলভাবে সংরক্ষিত হয়েছে।",
      donation,
    });
  } catch (error) {
    console.error("Donations POST error:", error);
    return NextResponse.json(
      { success: false, error: "অনুদান সংরক্ষণ প্রক্রিয়ায় সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
