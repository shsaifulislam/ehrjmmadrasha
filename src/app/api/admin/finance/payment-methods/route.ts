import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

// Initial default institutional accounts for Eliotgonj Hazi Rohmatollah Jamiria Madrasha
const DEFAULT_ACCOUNTS = [
  {
    nameBn: "প্রধান হিসাব শাখা (ক্যাশ কাউন্টার)",
    nameEn: "Main Accounts Cash Counter",
    type: "CASH",
    accountNumber: "CASH-COUNTER-01",
    bankName: "মাদরাসা হিসাব বিভাগ",
    branchName: "মূল ক্যাম্পাস, পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ",
    currentBalance: 0,
    isActive: true,
  },
  {
    nameBn: "বিকাশ হিসাব (অফিসিয়াল মার্চেন্ট / পার্সোনাল)",
    nameEn: "Official bKash Account",
    type: "BKASH_MERCHANT",
    accountNumber: "01822-822222",
    bankName: "বিকাশ (bKash)",
    branchName: "ইলিয়টগঞ্জ এজেন্ট/মার্চেন্ট পয়েন্ট",
    currentBalance: 0,
    isActive: true,
  },
  {
    nameBn: "নগদ ইসলামিক হিসাব",
    nameEn: "Official Nagad Islamic Account",
    type: "NAGAD_MERCHANT",
    accountNumber: "01822-822222",
    bankName: "নগদ (Nagad Islamic)",
    branchName: "ইলিয়টগঞ্জ",
    currentBalance: 0,
    isActive: true,
  },
  {
    nameBn: "ইসলামী ব্যাংক বাংলাদেশ পিএলসি (সঞ্চয়ী হিসাব)",
    nameEn: "Islami Bank Bangladesh PLC (MSA)",
    type: "BANK",
    accountNumber: "2050-2130-1000-8899",
    bankName: "ইসলামী ব্যাংক বাংলাদেশ পিএলসি",
    branchName: "ইলিয়টগঞ্জ শাখা, দাউদকান্দি, কুমিল্লা",
    currentBalance: 0,
    isActive: true,
  },
  {
    nameBn: "রকেট একাউন্ট (ডাচ-বাংলা ব্যাংক)",
    nameEn: "DBBL Rocket Account",
    type: "ROCKET_MERCHANT",
    accountNumber: "01822-822222-7",
    bankName: "ডাচ-বাংলা ব্যাংক পিএলসি",
    branchName: "ইলিয়টগঞ্জ শাখা",
    currentBalance: 0,
    isActive: true,
  },
];

/**
 * GET /api/admin/finance/payment-methods
 * Retrieves all institutional financial accounts / payment methods.
 * Auto-seeds default institutional accounts if table is currently empty.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 403 });
    }

    let accounts = await prisma.financialAccount.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (accounts.length === 0) {
      // Seed default institutional accounts
      for (const def of DEFAULT_ACCOUNTS) {
        await prisma.financialAccount.create({ data: def });
      }
      accounts = await prisma.financialAccount.findMany({
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json({
      success: true,
      methods: accounts,
      accounts,
    });
  } catch (error: any) {
    console.error("GET Payment Methods Error:", error);
    return NextResponse.json(
      { error: error.message || "পেমেন্ট মাধ্যম লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/finance/payment-methods
 * Creates a new financial account / payment gateway.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 403 });
    }

    const body = await req.json();
    const { nameBn, nameEn, type, accountNumber, bankName, branchName, currentBalance, isEnabled, isActive } = body;

    if (!nameBn || !type) {
      return NextResponse.json(
        { error: "হিসাবের নাম (বাংলা) এবং হিসাবের ধরন আবশ্যক।" },
        { status: 400 }
      );
    }

    const newAccount = await prisma.financialAccount.create({
      data: {
        nameBn: nameBn.trim(),
        nameEn: nameEn?.trim() || nameBn.trim(),
        type,
        accountNumber: accountNumber?.trim() || null,
        bankName: bankName?.trim() || null,
        branchName: branchName?.trim() || null,
        currentBalance: Number(currentBalance) || 0,
        isActive: isEnabled !== undefined ? Boolean(isEnabled) : (isActive !== undefined ? Boolean(isActive) : true),
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "PAYMENT_METHOD_CREATED",
      entityType: "FinancialAccount",
      entityId: newAccount.id,
      details: {
        nameBn: newAccount.nameBn,
        type: newAccount.type,
        accountNumber: newAccount.accountNumber,
      },
    });

    return NextResponse.json({
      success: true,
      message: "নতুন পেমেন্ট মাধ্যম সফলভাবে যুক্ত হয়েছে।",
      account: newAccount,
      method: newAccount,
    });
  } catch (error: any) {
    console.error("POST Payment Method Error:", error);
    return NextResponse.json(
      { error: error.message || "পেমেন্ট মাধ্যম যোগ করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * PUT & PATCH /api/admin/finance/payment-methods
 * Updates an existing financial account / toggles status.
 */
export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

export async function PATCH(req: NextRequest) {
  return handleUpdate(req);
}

async function handleUpdate(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 403 });
    }

    const body = await req.json();
    const { id, nameBn, nameEn, type, accountNumber, bankName, branchName, currentBalance, isActive, isEnabled } = body;

    if (!id) {
      return NextResponse.json({ error: "হিসাব আইডি প্রদান আবশ্যক।" }, { status: 400 });
    }

    const existing = await prisma.financialAccount.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "হিসাব পাওয়া যায়নি।" }, { status: 404 });
    }

    const updateData: any = {};
    if (nameBn !== undefined) updateData.nameBn = nameBn.trim();
    if (nameEn !== undefined) updateData.nameEn = nameEn.trim();
    if (type !== undefined) updateData.type = type;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber?.trim() || null;
    if (bankName !== undefined) updateData.bankName = bankName?.trim() || null;
    if (branchName !== undefined) updateData.branchName = branchName?.trim() || null;
    if (currentBalance !== undefined) updateData.currentBalance = Number(currentBalance);
    if (isEnabled !== undefined) updateData.isActive = Boolean(isEnabled);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.financialAccount.update({
      where: { id },
      data: updateData,
    });

    await recordAuditLog({
      userId: user.userId,
      action: "PAYMENT_METHOD_UPDATED",
      entityType: "FinancialAccount",
      entityId: updated.id,
      details: {
        changes: updateData,
      },
    });

    return NextResponse.json({
      success: true,
      message: "পেমেন্ট মাধ্যম সফলভাবে হালনাগাদ করা হয়েছে।",
      account: updated,
      method: updated,
    });
  } catch (error: any) {
    console.error("PUT/PATCH Payment Method Error:", error);
    return NextResponse.json(
      { error: error.message || "পেমেন্ট মাধ্যম হালনাগাদ করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/finance/payment-methods?id=...
 * Deletes or disables an account.
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "হিসাব আইডি প্রদান আবশ্যক।" }, { status: 400 });
    }

    await prisma.financialAccount.delete({
      where: { id },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "PAYMENT_METHOD_DELETED",
      entityType: "FinancialAccount",
      entityId: id,
    });

    return NextResponse.json({
      success: true,
      message: "পেমেন্ট মাধ্যম অপসারিত হয়েছে।",
    });
  } catch (error: any) {
    console.error("DELETE Payment Method Error:", error);
    return NextResponse.json(
      { error: error.message || "পেমেন্ট মাধ্যম মুছতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
