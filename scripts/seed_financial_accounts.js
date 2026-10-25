const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFinancialAccounts() {
  console.log("=== SEEDING INSTITUTIONAL FINANCIAL ACCOUNTS ===");

  const accounts = [
    {
      nameBn: "প্রধান ক্যাশ ড্রয়ার (অফিস নগদ ক্যাশ)",
      nameEn: "Main Office Cash",
      type: "CASH",
      accountNumber: "CASH-MAIN-01",
      currentBalance: 0,
      isActive: true,
    },
    {
      nameBn: "ইসলামী ব্যাংক সঞ্চয়ী হিসাব (মাদরাসা ফান্ড)",
      nameEn: "Islami Bank Savings Account",
      type: "BANK",
      accountNumber: "IBBL-2050214010001",
      bankName: "Islami Bank Bangladesh PLC",
      branchName: "Eliotgonj Branch",
      currentBalance: 0,
      isActive: true,
    },
    {
      nameBn: "বিকাশ মার্চেন্ট ওয়ালেট (ডিজিটাল কালেকশন)",
      nameEn: "bKash Merchant Settlement Wallet",
      type: "BKASH_MERCHANT",
      accountNumber: "BKASH-01845162664",
      currentBalance: 0,
      isActive: true,
    },
    {
      nameBn: "নগদ মার্চেন্ট ওয়ালেট (ডিজিটাল কালেকশন)",
      nameEn: "Nagad Merchant Settlement Wallet",
      type: "NAGAD_MERCHANT",
      accountNumber: "NAGAD-01845162664",
      currentBalance: 0,
      isActive: true,
    },
  ];

  for (const acc of accounts) {
    const existing = await prisma.financialAccount.findFirst({
      where: { accountNumber: acc.accountNumber },
    });
    if (!existing) {
      const created = await prisma.financialAccount.create({ data: acc });
      console.log(`Created Financial Account: ${created.nameBn} (${created.type})`);
    } else {
      console.log(`Account exists: ${existing.nameBn}`);
    }
  }

  console.log("=== FINANCIAL ACCOUNTS SEEDED SUCCESSFULLY ===");
  await prisma.$disconnect();
}

seedFinancialAccounts().catch((e) => {
  console.error("Seeding error:", e);
  process.exit(1);
});
