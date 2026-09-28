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
  console.log("=== STARTING PHASE 12 INVENTORY, ASSET & PROCUREMENT INTEGRATION TESTS ===");
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
    // 1. Ensure admin user exists for test actor context
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

    // 2. Default master data seeding
    console.log("\n--- Testing Default Master Data Seeding ---");
    await ensureDefaultInventoryMasterData();
    const categoriesCount = await prisma.inventoryCategory.count();
    const locationsCount = await prisma.inventoryLocation.count();
    assert(categoriesCount >= 10, `Default categories count: ${categoriesCount}`);
    assert(locationsCount >= 7, `Default locations count: ${locationsCount}`);

    // 3. Category & Location Creation
    console.log("\n--- Testing Category & Location Management ---");
    const testCatCode = `TSTCAT_${Date.now().toString().slice(-4)}`;
    const testCategory = await createInventoryCategory(
      {
        code: testCatCode,
        nameBn: "পরীক্ষামূলক স্টেশনারি",
        nameEn: "Test Stationery Cat",
        description: "Automated test category",
        sortOrder: 99,
      },
      admin.id
    );
    assert(testCategory.id && testCategory.nameEn === "Test Stationery Cat", "Category created successfully");

    const testLocCode1 = `TL1_${Date.now().toString().slice(-4)}`;
    const testLocation1 = await createInventoryLocation(
      {
        code: testLocCode1,
        nameBn: "টেস্ট কেন্দ্রীয় ভাণ্ডার",
        nameEn: "Central Test Store",
        description: "Central Test Store",
      },
      admin.id
    );
    assert(testLocation1.id && testLocation1.nameEn === "Central Test Store", "Source Location created successfully");

    const testLocCode2 = `TL2_${Date.now().toString().slice(-4)}`;
    const testLocation2 = await createInventoryLocation(
      {
        code: testLocCode2,
        nameBn: "টেস্ট কম্পিউটার ল্যাব",
        nameEn: "Computer Lab Test Store",
        description: "Computer Lab Test Store",
      },
      admin.id
    );
    assert(testLocation2.id && testLocation2.nameEn === "Computer Lab Test Store", "Destination Location created");

    // 4. Unique Sequence Generator Test
    console.log("\n--- Testing Atomic Sequence Generator ---");
    const itemCode1 = await generateNextInventorySequence("INV");
    const itemCode2 = await generateNextInventorySequence("INV");
    assert(itemCode1.startsWith("EHRJ-INV-"), `Item code generated: ${itemCode1}`);
    assert(itemCode1 !== itemCode2, "Consecutive item codes are strictly distinct and non-colliding");

    // 5. Item Master with Initial Stock
    console.log("\n--- Testing Item Master Creation & Opening Stock ---");
    const testItem = await createInventoryItem(
      {
        nameBn: "সাদা খাতা রিম (A4)",
        nameEn: "White A4 Paper Ream",
        categoryId: testCategory.id,
        unit: "REAM",
        description: "Official 80 GSM Paper",
        minStock: 10,
        reorderLevel: 20,
        isConsumable: true,
        initialStock: {
          locationId: testLocation1.id,
          quantity: 50,
        },
      },
      admin.id
    );
    assert(testItem.id && testItem.itemCode.startsWith("EHRJ-INV-"), "Item master record created with auto code");

    // Verify initial stock balance
    const initialBalance = await prisma.inventoryStockBalance.findUnique({
      where: {
        itemId_locationId: {
          itemId: testItem.id,
          locationId: testLocation1.id,
        },
      },
    });
    assert(initialBalance && initialBalance.currentBalance === 50, "Initial opening stock is 50 REAM in Test Store");

    // 6. Transactional Stock-In
    console.log("\n--- Testing Stock-In Operation ---");
    const stockInResult = await recordStockIn({
      itemId: testItem.id,
      locationId: testLocation1.id,
      quantity: 25,
      unitCost: 460,
      purpose: "অতিরিক্ত রিম সংযোজন",
      notes: "Test stock-in batch",
      adminUserId: admin.id,
    });
    assert(stockInResult.stockTx.transactionType === "PURCHASE_IN" && stockInResult.stockTx.quantity === 25, "Stock-in transaction registered");

    const balanceAfterIn = await prisma.inventoryStockBalance.findUnique({
      where: {
        itemId_locationId: {
          itemId: testItem.id,
          locationId: testLocation1.id,
        },
      },
    });
    assert(balanceAfterIn.currentBalance === 75, "Balance updated atomically from 50 to 75 (+25)");

    // 7. Transactional Stock-Out
    console.log("\n--- Testing Stock-Out Operation ---");
    const stockOutResult = await recordStockOut({
      itemId: testItem.id,
      locationId: testLocation1.id,
      quantity: 15,
      purpose: "মাদরাসা অফিসের বার্ষিক খাতা প্রস্তুত",
      recipient: "প্রধান হিসাবরক্ষক",
      adminUserId: admin.id,
    });
    assert(stockOutResult.stockTx.transactionType === "ISSUE_OUT" && stockOutResult.stockTx.quantity === 15, "Stock-out transaction registered");

    const balanceAfterOut = await prisma.inventoryStockBalance.findUnique({
      where: {
        itemId_locationId: {
          itemId: testItem.id,
          locationId: testLocation1.id,
        },
      },
    });
    assert(balanceAfterOut.currentBalance === 60, "Balance reduced atomically from 75 to 60 (-15)");

    // 8. Negative Stock Prevention
    console.log("\n--- Testing Negative Stock Guard ---");
    let negativeStockBlocked = false;
    try {
      await recordStockOut({
        itemId: testItem.id,
        locationId: testLocation1.id,
        quantity: 1000, // Exceeds 60
        purpose: "অতিরিক্ত উত্তোলনের চেষ্টা",
        recipient: "অননুমোদিত",
        adminUserId: admin.id,
      });
    } catch (err) {
      negativeStockBlocked = true;
      assert(err.message.includes("পর্যাপ্ত স্টক নেই"), `Negative stock blocked with expected message: "${err.message}"`);
    }
    assert(negativeStockBlocked, "Negative stock was strictly rejected by transaction engine");

    // 9. Stock Transfer between locations
    console.log("\n--- Testing Stock Transfer Operation ---");
    const transferResult = await recordStockTransfer({
      itemId: testItem.id,
      sourceLocationId: testLocation1.id,
      destLocationId: testLocation2.id,
      quantity: 20,
      notes: "ল্যাব প্রিন্টারের জন্য ২০ রিম স্থানান্তর",
      adminUserId: admin.id,
    });
    assert(transferResult.stockTxOut && transferResult.stockTxIn, "Dual transfer transactions created");

    const sourceBalAfterTransfer = await prisma.inventoryStockBalance.findUnique({
      where: { itemId_locationId: { itemId: testItem.id, locationId: testLocation1.id } },
    });
    const destBalAfterTransfer = await prisma.inventoryStockBalance.findUnique({
      where: { itemId_locationId: { itemId: testItem.id, locationId: testLocation2.id } },
    });
    assert(sourceBalAfterTransfer.currentBalance === 40, "Source balance correctly debited to 40 (60 - 20)");
    assert(destBalAfterTransfer.currentBalance === 20, "Destination balance correctly credited to 20 (0 + 20)");

    // 10. Physical Stock Adjustment
    console.log("\n--- Testing Physical Stock Adjustment ---");
    // Suppose physical count finds 38 instead of 40 in testLocation1 (difference -2)
    const adjustResult = await recordStockAdjustment({
      itemId: testItem.id,
      locationId: testLocation1.id,
      actualQuantity: 38,
      reason: "দৈবচয়ন অডিটে ২ রিম পানিতে ভিজে নষ্ট পাওয়া যায়",
      notes: "Audit voucher #992",
      adminUserId: admin.id,
    });
    assert(adjustResult.diff === -2, "Difference computed correctly: 38 - 40 = -2");
    assert(adjustResult.stockTx.transactionType === "ADJUSTMENT_OUT", "Adjustment OUT recorded for negative difference");

    const balAfterAdjustment = await prisma.inventoryStockBalance.findUnique({
      where: { itemId_locationId: { itemId: testItem.id, locationId: testLocation1.id } },
    });
    assert(balAfterAdjustment.currentBalance === 38, "Balance adjusted strictly to physical count (38)");

    // 11. Supplier Management
    console.log("\n--- Testing Supplier Management ---");
    const supplier = await createSupplier(
      {
        name: "কুমিল্লা ডিজিটাল আইটি সাপ্লাই",
        contactPerson: "মুহাম্মদ রফিকুল ইসলাম",
        phone: "01712345678",
        email: "rafiq.it@example.com",
        address: "শাসনগাছা বাস টার্মিনাল রোড, কুমিল্লা",
      },
      admin.id
    );
    assert(supplier.id && supplier.supplierCode.startsWith("EHRJ-SUP-"), "Supplier created with unique sequence code");

    // 12. Procurement: Purchase Request
    console.log("\n--- Testing Procurement Request Lifecycle ---");
    const prq = await createPurchaseRequest(
      {
        title: "অফিস কাগজ ও খাতা ক্রয়",
        purpose: "শিক্ষক ও কম্পিউটার ক্লাসরুমের জন্য সামগ্রী",
        priority: "HIGH",
        requiredDate: new Date(Date.now() + 86400000 * 7),
        items: [
          {
            itemId: testItem.id,
            quantity: 50,
            estimatedUnitCost: 450,
          },
        ],
      },
      admin.id
    );
    assert(prq.id && prq.requestNumber.startsWith("EHRJ-PRQ-"), "Purchase Request created in SUBMITTED status");

    const reviewedPrq = await reviewPurchaseRequest(
      prq.id,
      "APPROVE",
      "মুহতামিম কর্তৃক অনুমোদিত",
      admin.id
    );
    assert(reviewedPrq.status === "APPROVED", "Purchase Request approved by authorized review");

    // 13. Procurement: Purchase Order & Goods Receiving (GRN)
    console.log("\n--- Testing Purchase Order & Goods Receiving Workflow ---");
    const po = await createPurchaseOrder(
      {
        supplierId: supplier.id,
        purchaseRequestId: reviewedPrq.id,
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 3),
        notes: "জরুরি ডেলিভারি আবশ্যক",
        tax: 0,
        discount: 100,
        items: [
          {
            itemId: testItem.id,
            quantity: 50,
            unitPrice: 440,
          },
        ],
      },
      admin.id
    );
    assert(po.id && po.poNumber.startsWith("EHRJ-PO-"), "Purchase Order created in ORDERED status");
    assert(po.totalAmount === 50 * 440 - 100, "PO total calculation matches: (50 * 440) - 100 = 21900");

    // Partial Goods Receiving: 30 received (28 accepted, 2 damaged) into testLocation1
    const grnPartial = await receiveGoodsForPurchaseOrder({
      purchaseOrderId: po.id,
      locationId: testLocation1.id,
      deliveryChallanNumber: "CHL-2026-887",
      notes: "প্রথম চালান আংশিক ডেলিভারি",
      adminUserId: admin.id,
      items: [
        {
          purchaseOrderItemId: po.items[0].id,
          itemId: testItem.id,
          quantityReceived: 30,
          quantityDamaged: 2,
          unitCost: 440,
        },
      ],
    });
    assert(grnPartial.grn.receiptNumber.startsWith("EHRJ-GRN-"), "Goods Receipt Note (GRN) generated");
    assert(grnPartial.updatedPOStatus === "PARTIALLY_RECEIVED", "PO status transitioned to PARTIALLY_RECEIVED");

    const balAfterGRN1 = await prisma.inventoryStockBalance.findUnique({
      where: { itemId_locationId: { itemId: testItem.id, locationId: testLocation1.id } },
    });
    assert(balAfterGRN1.currentBalance === 38 + 28, "Accepted 28 units added to stock balance: 38 + 28 = 66");

    // Full Remaining Goods Receiving: 20 received (20 accepted)
    const grnFull = await receiveGoodsForPurchaseOrder({
      purchaseOrderId: po.id,
      locationId: testLocation1.id,
      deliveryChallanNumber: "CHL-2026-899",
      notes: "দ্বিতীয় ও সমাপনী চালান",
      adminUserId: admin.id,
      items: [
        {
          purchaseOrderItemId: po.items[0].id,
          itemId: testItem.id,
          quantityReceived: 20,
          quantityDamaged: 0,
          unitCost: 440,
        },
      ],
    });
    assert(grnFull.updatedPOStatus === "RECEIVED", "PO status transitioned to fully RECEIVED");

    // 14. Asset Management Lifecycle
    console.log("\n--- Testing Durable Asset Registration & Lifecycle ---");
    const projCatCode = `CAT_PROJ_${Date.now().toString().slice(-4)}`;
    const projectorCategory = await createInventoryCategory(
      {
        code: projCatCode,
        nameBn: "আইটি ও হার্ডওয়্যার সরঞ্জাম",
        nameEn: "IT & Hardware",
      },
      admin.id
    );
    const projectorItem = await createInventoryItem(
      {
        nameBn: "এপসন মাল্টিমিডিয়া প্রজেক্টর",
        nameEn: "Epson Multimedia Projector XGA",
        categoryId: projectorCategory.id,
        unit: "PCS",
        isConsumable: false, // Durable asset
      },
      admin.id
    );

    const asset = await createInventoryAsset(
      {
        itemId: projectorItem.id,
        serialNumber: "SN-EPSON-2026-9011",
        locationId: testLocation2.id,
        supplierId: supplier.id,
        purchaseDate: new Date(),
        purchaseCost: 65000,
        warrantyExpiry: new Date(Date.now() + 86400000 * 365 * 2),
        condition: "NEW",
        assignedDepartment: "হিফজ ও দাওরা হাদিস ল্যাব",
        assignedUserId: teacher.id,
        notes: "স্মার্ট ক্লাস প্রেজেন্টেশন ও হিফজ অডিটোরিয়াম",
      },
      admin.id
    );
    assert(asset.id && asset.assetCode.startsWith("EHRJ-AST-"), `Asset registered with code: ${asset.assetCode}`);
    assert(asset.qrToken && asset.qrToken.length > 0, "Cryptographic QR token generated for QR security");
    assert(asset.status === "IN_USE", "Asset status marked IN_USE on assignment");

    // Reassignment with history tracking
    console.log("\n--- Testing Asset Reassignment History ---");
    const reassigned = await assignInventoryAsset({
      assetId: asset.id,
      assignedDepartment: "সাধারণ প্রশাসন ও শিক্ষক কমনরুম",
      assignedUserId: undefined,
      locationId: testLocation1.id,
      reason: "কমনরুম মিটিংয়ের জন্য সাময়িক স্থানান্তর",
      adminUserId: admin.id,
    });
    assert(reassigned.locationId === testLocation1.id, "Asset location updated to Test Store 1");

    const assignmentHistories = await prisma.assetAssignmentHistory.findMany({
      where: { assetId: asset.id },
    });
    assert(assignmentHistories.length >= 2, "Assignment history logged both initial and updated assignments");

    // Condition change / Repair event
    console.log("\n--- Testing Asset Condition & Damage/Repair Recording ---");
    const conditionUpdate = await updateAssetConditionOrStatus({
      assetId: asset.id,
      condition: "REPAIR_REQUIRED",
      status: "REPAIR",
      event: "REPAIR_SENT",
      reason: "এইচডিএমআই পোর্ট সংযোগে গোলযোগ দেখা দিয়েছে",
      cost: 2500,
      notes: "ওয়ারেন্টির আওতায় সেন্টারে প্রেরণ",
      adminUserId: admin.id,
    });
    assert(conditionUpdate.status === "REPAIR", "Asset status transitioned to REPAIR");

    const conditionHistories = await prisma.assetConditionHistory.findMany({
      where: { assetId: asset.id },
    });
    assert(conditionHistories.some((c) => c.newCondition === "REPAIR_REQUIRED"), "Condition history logged REPAIR_REQUIRED");

    // Asset Disposal
    console.log("\n--- Testing Asset Safe Disposal ---");
    const disposed = await disposeInventoryAsset({
      assetId: asset.id,
      disposalReason: "মেরামত অযোগ্য স্ক্র্যাপ ও মেয়াদোত্তীর্ণ",
      disposalValue: 4000,
      notes: "পুরাতন পার্টস বিক্রয় ভাউচার সংরক্ষিত",
      adminUserId: admin.id,
    });
    assert(disposed.status === "DISPOSED", "Asset status updated to DISPOSED without deleting historical record");

    // Verify historical records remain intact
    const historicalAsset = await prisma.inventoryAsset.findUnique({
      where: { id: asset.id },
      include: {
        conditions: true,
        assignments: true,
      },
    });
    assert(historicalAsset !== null, "Disposed asset record is preserved in database (never deleted)");
    assert(historicalAsset.conditions.length > 0, "Asset condition history remains intact");

    // 15. Dashboard Stats Aggregation
    console.log("\n--- Testing Authoritative Inventory Dashboard Stats ---");
    const stats = await getInventoryDashboardStats();
    assert(typeof stats.totalItemTypes === "number" && stats.totalItemTypes > 0, `Stats totalItemTypes: ${stats.totalItemTypes}`);
    assert(typeof stats.totalStockQuantity === "number", `Stats totalStockQuantity: ${stats.totalStockQuantity}`);
    assert(typeof stats.totalAssets === "number", `Stats totalAssets: ${stats.totalAssets}`);
    assert(Array.isArray(stats.recentTransactions), "Stats includes recentTransactions array");
    assert(Array.isArray(stats.recentPurchaseOrders), "Stats includes recentPurchaseOrders array");

    console.log(`\n======================================================`);
    console.log(`PHASE 12 TEST SUMMARY: Passed: ${passed} | Failed: ${failed}`);
    console.log(`======================================================`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("FATAL ERROR IN TEST SUITE:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
