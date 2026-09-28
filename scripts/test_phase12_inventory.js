import { PrismaClient } from "@prisma/client";
import {
  ensureDefaultInventoryMasterData,
  createInventoryCategory,
  createInventoryLocation,
  createInventoryItem,
  recordStockIn,
  recordStockOut,
  recordStockTransfer,
  recordStockAdjustment,
  createSupplier,
  createPurchaseRequest,
  reviewPurchaseRequest,
  createPurchaseOrder,
  receiveGoodsForPurchaseOrder,
  createInventoryAsset,
  assignInventoryAsset,
  updateAssetConditionOrStatus,
  disposeInventoryAsset,
  getInventoryDashboardStats,
  generateNextInventorySequence,
} from "../src/lib/inventoryEngine.ts";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=== STARTING PHASE 12 INVENTORY, ASSET & PROCUREMENT REGRESSION TESTS ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: "test_inventory_admin@ehrj.edu",
          name: "Inventory Test Admin",
          role: "ADMIN",
          phone: "01700000000",
        },
      });
    }

    let teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
    if (!teacher) {
      teacher = await prisma.user.create({
        data: {
          email: "test_inventory_teacher@ehrj.edu",
          name: "Mawlana Test Teacher",
          role: "TEACHER",
          phone: "01800000000",
        },
      });
    }

    // 1. Default master data seeding
    console.log("\n--- Testing Default Master Data Seeding ---");
    await ensureDefaultInventoryMasterData();
    const categoriesCount = await prisma.inventoryCategory.count();
    const locationsCount = await prisma.inventoryLocation.count();
    assert(categoriesCount >= 10, `Default categories count: ${categoriesCount}`);
    assert(locationsCount >= 7, `Default locations count: ${locationsCount}`);

    // 2. Category & Location Creation
    console.log("\n--- Testing Category & Location Management ---");
    const testCatCode = `CAT_${Date.now().toString().slice(-5)}`;
    const testCategory = await createInventoryCategory(
      {
        code: testCatCode,
        nameBn: "রেগ্রেশন স্টেশনারি",
        nameEn: "Regression Stationery Cat",
        description: "Automated regression test category",
        sortOrder: 99,
      },
      admin.id
    );
    assert(testCategory.id && testCategory.nameEn === "Regression Stationery Cat", "Category created successfully");

    const testLocCode1 = `LOC1_${Date.now().toString().slice(-5)}`;
    const testLocation1 = await createInventoryLocation(
      {
        code: testLocCode1,
        nameBn: "রেগ্রেশন কেন্দ্রীয় ভাণ্ডার",
        nameEn: "Central Regression Store",
        description: "Central Regression Store",
      },
      admin.id
    );
    assert(testLocation1.id && testLocation1.nameEn === "Central Regression Store", "Source Location created successfully");

    const testLocCode2 = `LOC2_${Date.now().toString().slice(-5)}`;
    const testLocation2 = await createInventoryLocation(
      {
        code: testLocCode2,
        nameBn: "রেগ্রেশন ল্যাব স্টোর",
        nameEn: "Lab Regression Store",
        description: "Lab Regression Store",
      },
      admin.id
    );
    assert(testLocation2.id && testLocation2.nameEn === "Lab Regression Store", "Destination Location created");

    // 3. Unique Sequence Generator Test
    console.log("\n--- Testing Atomic Sequence Generator ---");
    const itemCode1 = await generateNextInventorySequence("INV");
    const itemCode2 = await generateNextInventorySequence("INV");
    assert(itemCode1.startsWith("EHRJ-INV-"), `Item code generated: ${itemCode1}`);
    assert(itemCode1 !== itemCode2, "Consecutive item codes are strictly distinct and non-colliding");

    // 4. Item Master with Initial Stock
    console.log("\n--- Testing Item Master Creation & Opening Stock ---");
    const testItem = await createInventoryItem(
      {
        nameBn: "অফিস কলম বক্স",
        nameEn: "Ballpoint Pen Box",
        categoryId: testCategory.id,
        unit: "BOX",
        description: "Blue 0.5mm pen box",
        minStock: 5,
        reorderLevel: 10,
        isConsumable: true,
        initialStock: {
          locationId: testLocation1.id,
          quantity: 40,
        },
      },
      admin.id
    );
    assert(testItem.id && testItem.itemCode.startsWith("EHRJ-INV-"), "Item master record created with auto code");

    const initialBalance = await prisma.inventoryStockBalance.findUnique({
      where: {
        itemId_locationId: {
          itemId: testItem.id,
          locationId: testLocation1.id,
        },
      },
    });
    assert(initialBalance && initialBalance.currentBalance === 40, "Initial opening stock is 40 BOX in Test Store");

    // 5. Transactional Stock-In
    console.log("\n--- Testing Stock-In Operation ---");
    const stockInResult = await recordStockIn({
      itemId: testItem.id,
      locationId: testLocation1.id,
      quantity: 20,
      unitCost: 150,
      purpose: "নতুন কলম ক্রয়",
      notes: "Batch #1",
      adminUserId: admin.id,
    });
    assert(stockInResult.stockTx.transactionType === "PURCHASE_IN" && stockInResult.stockTx.quantity === 20, "Stock-in transaction registered");

    const balanceAfterIn = await prisma.inventoryStockBalance.findUnique({
      where: {
        itemId_locationId: {
          itemId: testItem.id,
          locationId: testLocation1.id,
        },
      },
    });
    assert(balanceAfterIn.currentBalance === 60, "Balance updated atomically from 40 to 60 (+20)");

    // 6. Transactional Stock-Out
    console.log("\n--- Testing Stock-Out Operation ---");
    const stockOutResult = await recordStockOut({
      itemId: testItem.id,
      locationId: testLocation1.id,
      quantity: 10,
      purpose: "পরীক্ষা শাখার জন্য বিতরণ",
      recipient: "নাযেমে দারুল ইকামাহ",
      adminUserId: admin.id,
    });
    assert(stockOutResult.stockTx.transactionType === "ISSUE_OUT" && stockOutResult.stockTx.quantity === 10, "Stock-out transaction registered");

    const balanceAfterOut = await prisma.inventoryStockBalance.findUnique({
      where: {
        itemId_locationId: {
          itemId: testItem.id,
          locationId: testLocation1.id,
        },
      },
    });
    assert(balanceAfterOut.currentBalance === 50, "Balance reduced atomically from 60 to 50 (-10)");

    // 7. Negative Stock Prevention
    console.log("\n--- Testing Negative Stock Guard ---");
    let negativeStockBlocked = false;
    try {
      await recordStockOut({
        itemId: testItem.id,
        locationId: testLocation1.id,
        quantity: 500, // Exceeds 50
        purpose: "অতিরিক্ত উত্তোলনের চেষ্টা",
        recipient: "অননুমোদিত",
        adminUserId: admin.id,
      });
    } catch (err) {
      negativeStockBlocked = true;
      assert(err.message.includes("পর্যাপ্ত স্টক নেই"), `Negative stock blocked with message: "${err.message}"`);
    }
    assert(negativeStockBlocked, "Negative stock was strictly rejected by transaction engine");

    // 8. Stock Transfer between locations
    console.log("\n--- Testing Stock Transfer Operation ---");
    const transferResult = await recordStockTransfer({
      itemId: testItem.id,
      sourceLocationId: testLocation1.id,
      destLocationId: testLocation2.id,
      quantity: 15,
      notes: "ল্যাব স্টোরে স্থানান্তর",
      adminUserId: admin.id,
    });
    assert(transferResult.stockTxOut && transferResult.stockTxIn, "Dual transfer transactions created");

    const sourceBalAfterTransfer = await prisma.inventoryStockBalance.findUnique({
      where: { itemId_locationId: { itemId: testItem.id, locationId: testLocation1.id } },
    });
    const destBalAfterTransfer = await prisma.inventoryStockBalance.findUnique({
      where: { itemId_locationId: { itemId: testItem.id, locationId: testLocation2.id } },
    });
    assert(sourceBalAfterTransfer.currentBalance === 35, "Source balance debited to 35 (50 - 15)");
    assert(destBalAfterTransfer.currentBalance === 15, "Destination balance credited to 15 (0 + 15)");

    // 9. Physical Stock Adjustment
    console.log("\n--- Testing Physical Stock Adjustment ---");
    const adjustResult = await recordStockAdjustment({
      itemId: testItem.id,
      locationId: testLocation1.id,
      actualQuantity: 34,
      reason: "১ বক্স ভেঙে নষ্ট পাওয়া যায়",
      notes: "Audit #102",
      adminUserId: admin.id,
    });
    assert(adjustResult.diff === -1, "Difference computed correctly: 34 - 35 = -1");
    assert(adjustResult.stockTx.transactionType === "ADJUSTMENT_OUT", "Adjustment OUT recorded for negative difference");

    const balAfterAdjustment = await prisma.inventoryStockBalance.findUnique({
      where: { itemId_locationId: { itemId: testItem.id, locationId: testLocation1.id } },
    });
    assert(balAfterAdjustment.currentBalance === 34, "Balance adjusted strictly to physical count (34)");

    // 10. Supplier Management
    console.log("\n--- Testing Supplier Management ---");
    const supplier = await createSupplier(
      {
        name: "ঢাকা সেন্ট্রাল স্টেশনারি",
        contactPerson: "মুহাম্মদ হাবিবুল্লাহ",
        phone: "01811223344",
        email: "habib.stat@example.com",
        address: "বাংলাবাজার, ঢাকা",
      },
      admin.id
    );
    assert(supplier.id && supplier.supplierCode.startsWith("EHRJ-SUP-"), "Supplier created with unique sequence code");

    // 11. Procurement: Purchase Request
    console.log("\n--- Testing Procurement Request Lifecycle ---");
    const prq = await createPurchaseRequest(
      {
        title: "অফিস সরঞ্জাম ক্রয়",
        purpose: "অফিসিয়াল নথিপত্র ও কলম",
        priority: "NORMAL",
        requiredDate: new Date(Date.now() + 86400000 * 5),
        items: [
          {
            itemId: testItem.id,
            quantity: 30,
            estimatedUnitCost: 150,
          },
        ],
      },
      admin.id
    );
    assert(prq.id && prq.requestNumber.startsWith("EHRJ-PRQ-"), "Purchase Request created in SUBMITTED status");

    const reviewedPrq = await reviewPurchaseRequest(
      prq.id,
      "APPROVE",
      "অনুমোদিত",
      admin.id
    );
    assert(reviewedPrq.status === "APPROVED", "Purchase Request approved by authorized review");

    // 12. Procurement: Purchase Order & Goods Receiving (GRN)
    console.log("\n--- Testing Purchase Order & Goods Receiving Workflow ---");
    const po = await createPurchaseOrder(
      {
        supplierId: supplier.id,
        purchaseRequestId: reviewedPrq.id,
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 2),
        notes: "তাড়াতাড়ি ডেলিভারি",
        tax: 0,
        discount: 50,
        items: [
          {
            itemId: testItem.id,
            quantity: 30,
            unitPrice: 145,
          },
        ],
      },
      admin.id
    );
    assert(po.id && po.poNumber.startsWith("EHRJ-PO-"), "Purchase Order created in ORDERED status");

    // Partial Goods Receiving
    const grnPartial = await receiveGoodsForPurchaseOrder({
      purchaseOrderId: po.id,
      locationId: testLocation1.id,
      deliveryChallanNumber: "CHL-REG-01",
      notes: "আংশিক ডেলিভারি",
      adminUserId: admin.id,
      items: [
        {
          purchaseOrderItemId: po.items[0].id,
          itemId: testItem.id,
          quantityReceived: 20,
          quantityDamaged: 1,
          unitCost: 145,
        },
      ],
    });
    assert(grnPartial.grn.receiptNumber.startsWith("EHRJ-GRN-"), "Goods Receipt Note (GRN) generated");
    assert(grnPartial.updatedPOStatus === "PARTIALLY_RECEIVED", "PO status transitioned to PARTIALLY_RECEIVED");

    // Full Remaining Goods Receiving
    const grnFull = await receiveGoodsForPurchaseOrder({
      purchaseOrderId: po.id,
      locationId: testLocation1.id,
      deliveryChallanNumber: "CHL-REG-02",
      notes: "সমাপনী চালান",
      adminUserId: admin.id,
      items: [
        {
          purchaseOrderItemId: po.items[0].id,
          itemId: testItem.id,
          quantityReceived: 10,
          quantityDamaged: 0,
          unitCost: 145,
        },
      ],
    });
    assert(grnFull.updatedPOStatus === "RECEIVED", "PO status transitioned to fully RECEIVED");

    // 13. Asset Management Lifecycle
    console.log("\n--- Testing Durable Asset Registration & Lifecycle ---");
    const projCatCode = `CAT_EQ_${Date.now().toString().slice(-5)}`;
    const eqCategory = await createInventoryCategory(
      {
        code: projCatCode,
        nameBn: "বৈদ্যুতিক সরঞ্জাম",
        nameEn: "Electrical Equipment",
      },
      admin.id
    );
    const eqItem = await createInventoryItem(
      {
        nameBn: "স্ট্যান্ড ফ্যান",
        nameEn: "Stand Fan 24 Inch",
        categoryId: eqCategory.id,
        unit: "PCS",
        isConsumable: false,
      },
      admin.id
    );

    const asset = await createInventoryAsset(
      {
        itemId: eqItem.id,
        serialNumber: "SN-FAN-2026-01",
        locationId: testLocation2.id,
        supplierId: supplier.id,
        purchaseDate: new Date(),
        purchaseCost: 4500,
        warrantyExpiry: new Date(Date.now() + 86400000 * 365),
        condition: "NEW",
        assignedDepartment: "শিক্ষক মিলনায়তন",
        assignedUserId: teacher.id,
        notes: "গ্রীষ্মকালীন অতিরিক্ত ফ্যান",
      },
      admin.id
    );
    assert(asset.id && asset.assetCode.startsWith("EHRJ-AST-"), `Asset registered with code: ${asset.assetCode}`);
    assert(asset.qrToken && asset.qrToken.length > 0, "Cryptographic QR token generated for QR security");
    assert(asset.status === "IN_USE", "Asset status marked IN_USE on assignment");

    // Reassignment
    const reassigned = await assignInventoryAsset({
      assetId: asset.id,
      assignedDepartment: "প্রশাসন কক্ষ",
      assignedUserId: undefined,
      locationId: testLocation1.id,
      reason: "অফিস স্থানান্তর",
      adminUserId: admin.id,
    });
    assert(reassigned.locationId === testLocation1.id, "Asset location updated to Test Store 1");

    // Condition update
    const conditionUpdate = await updateAssetConditionOrStatus({
      assetId: asset.id,
      condition: "REPAIR_REQUIRED",
      status: "REPAIR",
      event: "REPAIR_SENT",
      reason: "ক্যাপাসিটর পরিবর্তন প্রয়োজন",
      cost: 350,
      adminUserId: admin.id,
    });
    assert(conditionUpdate.status === "REPAIR", "Asset status transitioned to REPAIR");

    // Disposal
    const disposed = await disposeInventoryAsset({
      assetId: asset.id,
      disposalReason: "মোটর পুড়ে গেছে",
      disposalValue: 500,
      adminUserId: admin.id,
    });
    assert(disposed.status === "DISPOSED", "Asset status updated to DISPOSED without deleting historical record");

    // 14. Dashboard Stats Aggregation
    console.log("\n--- Testing Authoritative Inventory Dashboard Stats ---");
    const stats = await getInventoryDashboardStats();
    assert(typeof stats.totalItemTypes === "number" && stats.totalItemTypes > 0, `Stats totalItemTypes: ${stats.totalItemTypes}`);
    assert(typeof stats.totalStockQuantity === "number", `Stats totalStockQuantity: ${stats.totalStockQuantity}`);
    assert(Array.isArray(stats.recentTransactions), "Stats includes recentTransactions array");
    assert(Array.isArray(stats.recentPurchaseOrders), "Stats includes recentPurchaseOrders array");

    console.log(`\n======================================================`);
    console.log(`PHASE 12 REGRESSION SUITE: Passed: ${passed} | Failed: ${failed}`);
    console.log(`======================================================`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("FATAL ERROR IN REGRESSION TEST SUITE:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
