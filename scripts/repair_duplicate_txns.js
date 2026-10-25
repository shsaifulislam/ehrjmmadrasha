const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function repairDuplicateTransactions() {
  console.log("=== CHECKING AND REPAIRING DUPLICATE TRANSACTION IDS ===");
  const receipts = await prisma.paymentReceipt.findMany({
    orderBy: { receiptDate: "asc" },
  });

  const seen = new Map();
  let updatedCount = 0;

  for (const r of receipts) {
    if (!r.transactionId) continue;
    const txn = r.transactionId.trim();

    if (seen.has(txn)) {
      const occurrence = seen.get(txn) + 1;
      seen.set(txn, occurrence);
      const uniqueSuffix = `-LEGACY-${String(occurrence).padStart(2, "0")}`;
      const newTxnId = `${txn}${uniqueSuffix}`;

      console.log(`Repairing Receipt ${r.receiptNumber} (${r.id}): ${txn} -> ${newTxnId}`);
      await prisma.paymentReceipt.update({
        where: { id: r.id },
        data: {
          transactionId: newTxnId,
          notes: `${r.notes || ""} | [Audit Correction: Migrated duplicate legacy seed TrxID to unique reference ${newTxnId}]`,
        },
      });
      updatedCount++;
    } else {
      seen.set(txn, 1);
    }
  }

  console.log(`=== REPAIR COMPLETE: ${updatedCount} duplicate receipts safely disambiguated ===`);
  await prisma.$disconnect();
}

repairDuplicateTransactions().catch((err) => {
  console.error("Repair error:", err);
  process.exit(1);
});
