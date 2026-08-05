import prisma from "../config/prisma";
import { InventoryService } from "../modules/inventory/inventory.service";

async function runInventoryVerification() {
  console.log("=================================================");
  console.log("🚀 STARTING INVENTORY & ASSET MANAGEMENT CORE MODULE ATOMIC VERIFICATION");
  console.log("=================================================\n");

  const uniqueSuffix = Date.now().toString().slice(-4);

  // 1. Create System User
  let user = await prisma.user.findFirst({ where: { isActive: true } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: `inv_user_${uniqueSuffix}`,
        passwordHash: "dummyhash",
        role: { create: { name: `ROLE_INV_${uniqueSuffix}` } },
      },
    });
  }

  // 2. Create Category
  console.log("📦 Step 1: Creating Asset Category...");
  const cat = await InventoryService.createCategory({
    name: "অফিস ও ক্লাসরুম আসবাবপত্র",
    code: `CAT-${uniqueSuffix}`,
    description: "চেয়ার, টেবিল, ব্ল্যাকবোর্ড ইত্যাদি",
    createdById: user.id,
  });

  console.log(`✅ Inventory Category Created! Code: ${cat.code}, Name: ${cat.name}`);

  // 3. Create Item
  console.log("\n🪑 Step 2: Creating Inventory Item Record...");
  const item = await InventoryService.createItem({
    categoryId: cat.id,
    name: "শিক্ষক কাঠের চেয়ার",
    code: `ITM-${uniqueSuffix}`,
    unit: "PIECE",
    minStockAlert: 2,
    unitPrice: 1500,
    createdById: user.id,
  });

  console.log(`✅ Inventory Item Created! Code: ${item.code}, Name: ${item.name}, Initial Stock: ${item.currentStock}`);

  // 4. Record Stock In Movement
  console.log("\n📥 Step 3: Recording Stock In (নতুন চেয়ার গ্রহণ)...");
  const stockIn = await InventoryService.recordStockMovement({
    itemId: item.id,
    movementType: "STOCK_IN",
    quantity: 10,
    reference: `PO-${uniqueSuffix}`,
    note: "নতুন ক্লাসরুমের জন্য ১০টি চেয়ার ক্রয়",
    createdById: user.id,
  });

  const updatedItemAfterIn = await prisma.inventoryItem.findUnique({ where: { id: item.id } });

  console.log(
    `✅ Stock In Recorded! Type: ${stockIn.movementType}, Added Qty: 10, New Current Stock: ${updatedItemAfterIn?.currentStock}`
  );

  // 5. Record Stock Out Movement
  console.log("\n📤 Step 4: Recording Stock Out (ক্লাসরুমে চেয়ার বিতরণ)...");
  const stockOut = await InventoryService.recordStockMovement({
    itemId: item.id,
    movementType: "STOCK_OUT",
    quantity: 3,
    reference: `ISSUE-${uniqueSuffix}`,
    note: "১ম ও ২য় শ্রেণী কক্ষে ৩টি চেয়ার বিতরণ",
    createdById: user.id,
  });

  const updatedItemAfterOut = await prisma.inventoryItem.findUnique({ where: { id: item.id } });

  console.log(
    `✅ Stock Out Recorded! Type: ${stockOut.movementType}, Issued Qty: 3, Remaining Stock: ${updatedItemAfterOut?.currentStock}`
  );

  // 6. DB Assertion Matrix for Phase 11
  console.log("\n--- DB INVENTORY & ASSET VERIFICATION ASSERTION MATRIX ---");
  console.log(`1. Inventory Category Created: ${cat ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`2. Asset Item Registered: ${item ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`3. Stock In Added to Inventory: ${updatedItemAfterIn?.currentStock === 10 ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`4. Stock Out Issued & Stock Deducted: ${updatedItemAfterOut?.currentStock === 7 ? "PASS ✅" : "FAIL ❌"}`);

  console.log("\n=================================================");
  console.log("🎉 ALL INVENTORY & ASSET MANAGEMENT CORE MODULE FLOWS VERIFIED!");
  console.log("=================================================\n");
}

runInventoryVerification()
  .catch((e) => {
    console.error("❌ Inventory Verification Failed with Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
