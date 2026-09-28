import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ehrj-madrasa-digital-campus-secure-production-jwt-secret-key-2026"
);

async function runHttpApiVerification() {
  console.log("=================================================");
  console.log("EHRJ MADRASHA ERP — PHASE 12 HTTP API TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Resolve Admin User & Mint Valid JWT Session Token
    console.log("--- 1. Admin Authentication ---");
    let adminUser = await prisma.user.findFirst({ where: { role: "ADMIN", status: "ACTIVE" } });
    if (!adminUser) {
      throw new Error("No active admin user found in database");
    }

    const adminToken = await new SignJWT({
      userId: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      email: adminUser.email,
      name: adminUser.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    const adminCookie = `ehrj_session_token=${adminToken}`;
    assert(adminCookie.length > 0, "Obtained valid Admin auth JWT cookie");

    // Teacher authentication for role checking
    let teacherUser = await prisma.user.findFirst({ where: { role: "TEACHER", status: "ACTIVE" } });
    if (!teacherUser) {
      teacherUser = await prisma.user.create({
        data: {
          username: "teacher_test_inv_http",
          email: "teacher_test_inv_http@ehrjmadrasha.com",
          name: "Mawlana Teacher HTTP Test",
          role: "TEACHER",
          status: "ACTIVE",
          passwordHash: "dummy",
        },
      });
    }

    const teacherToken = await new SignJWT({
      userId: teacherUser.id,
      username: teacherUser.username,
      role: teacherUser.role,
      email: teacherUser.email,
      name: teacherUser.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    const teacherCookie = `ehrj_session_token=${teacherToken}`;
    assert(teacherCookie.length > 0, "Obtained valid Teacher auth JWT cookie");

    const adminHeaders = {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    };
    const teacherHeaders = {
      "Content-Type": "application/json",
      Cookie: teacherCookie,
    };

    // 2. Admin Inventory Stats
    console.log("\n--- 2. Testing Inventory Dashboard Stats API ---");
    const statsRes = await fetch(`${BASE_URL}/api/admin/inventory/stats`, {
      headers: adminHeaders,
    });
    const statsData = await statsRes.json();
    assert(statsRes.ok && statsData.success, "GET /api/admin/inventory/stats returned 200 OK");
    assert(typeof statsData.stats.totalItemTypes === "number", "Stats contains totalItemTypes");
    assert(typeof statsData.stats.totalStockQuantity === "number", "Stats contains totalStockQuantity");
    assert(Array.isArray(statsData.stats.recentTransactions), "Stats contains recentTransactions array");

    // 3. Category & Location Management
    console.log("\n--- 3. Testing Categories & Locations API ---");
    const catCode = `HTTP_CAT_${Date.now().toString().slice(-5)}`;
    const catRes = await fetch(`${BASE_URL}/api/admin/inventory/categories`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        code: catCode,
        nameBn: "এইচটিটিপি টেস্ট ক্যাটাগরি",
        nameEn: "HTTP Test Category",
        sortOrder: 15,
      }),
    });
    const catData = await catRes.json();
    assert(catRes.ok && catData.success, "POST /api/admin/inventory/categories created category");
    const createdCat = catData.category;

    const locCode1 = `HTTP_LOC1_${Date.now().toString().slice(-5)}`;
    const locRes1 = await fetch(`${BASE_URL}/api/admin/inventory/locations`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        code: locCode1,
        nameBn: "এইচটিটিপি প্রধান ভাণ্ডার",
        nameEn: "HTTP Main Store",
      }),
    });
    const locData1 = await locRes1.json();
    assert(locRes1.ok && locData1.success, "POST /api/admin/inventory/locations created store 1");
    const createdLoc1 = locData1.location;

    const locCode2 = `HTTP_LOC2_${Date.now().toString().slice(-5)}`;
    const locRes2 = await fetch(`${BASE_URL}/api/admin/inventory/locations`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        code: locCode2,
        nameBn: "এইচটিটিপি শাখা ভাণ্ডার",
        nameEn: "HTTP Branch Store",
      }),
    });
    const locData2 = await locRes2.json();
    assert(locRes2.ok && locData2.success, "POST /api/admin/inventory/locations created store 2");
    const createdLoc2 = locData2.location;

    // 4. Item Master Creation
    console.log("\n--- 4. Testing Item Master Creation & Stock API ---");
    const itemRes = await fetch(`${BASE_URL}/api/admin/inventory/items`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        nameBn: "হোয়াইটবোর্ড মার্কার বক্স",
        nameEn: "Whiteboard Marker Box",
        categoryId: createdCat.id,
        unit: "BOX",
        minStock: 5,
        reorderLevel: 10,
        isConsumable: true,
        initialStock: {
          locationId: createdLoc1.id,
          quantity: 50,
        },
      }),
    });
    const itemData = await itemRes.json();
    assert(itemRes.ok && itemData.success, "POST /api/admin/inventory/items created item master");
    const createdItem = itemData.item;
    assert(createdItem.itemCode.startsWith("EHRJ-INV-"), `Generated valid item code: ${createdItem.itemCode}`);

    // Verify stock balance
    const balRes1 = await fetch(
      `${BASE_URL}/api/admin/inventory/stock/balances?itemId=${createdItem.id}&locationId=${createdLoc1.id}`,
      { headers: adminHeaders }
    );
    const balData1 = await balRes1.json();
    assert(balRes1.ok && balData1.success, "GET /api/admin/inventory/stock/balances returned 200 OK");
    const balanceItem1 = balData1.balances[0];
    assert(balanceItem1 && balanceItem1.currentBalance === 50, "Initial opening balance verified at 50 BOX");

    // 5. Stock-In
    console.log("\n--- 5. Testing Stock-In Operation via API ---");
    const inRes = await fetch(`${BASE_URL}/api/admin/inventory/stock/in`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        itemId: createdItem.id,
        locationId: createdLoc1.id,
        quantity: 20,
        unitCost: 250,
        purpose: "শিক্ষাবর্ষের প্রস্তুতি",
      }),
    });
    const inData = await inRes.json();
    assert(inRes.ok && inData.success, "POST /api/admin/inventory/stock/in registered successfully");
    assert(inData.balance.currentBalance === 70, "Balance updated atomically from 50 to 70 (+20)");

    // 6. Stock-Out
    console.log("\n--- 6. Testing Stock-Out Operation via API ---");
    const outRes = await fetch(`${BASE_URL}/api/admin/inventory/stock/out`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        itemId: createdItem.id,
        locationId: createdLoc1.id,
        quantity: 15,
        purpose: "ক্লাসরুম বিতরণ",
        recipient: "উস্তাদ অনুষদ",
      }),
    });
    const outData = await outRes.json();
    assert(outRes.ok && outData.success, "POST /api/admin/inventory/stock/out registered successfully");
    assert(outData.balance.currentBalance === 55, "Balance updated atomically from 70 to 55 (-15)");

    // 7. Negative Stock Guard Enforcement
    console.log("\n--- 7. Testing Strict Negative Stock Guard via API ---");
    const negRes = await fetch(`${BASE_URL}/api/admin/inventory/stock/out`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        itemId: createdItem.id,
        locationId: createdLoc1.id,
        quantity: 9999,
        purpose: "অতিরিক্ত স্টক আউট টেস্ট",
      }),
    });
    const negData = await negRes.json();
    assert(negRes.status === 400 && !negData.success, "API rejected withdrawal exceeding available balance (400 Bad Request)");
    assert(negData.error && negData.error.includes("পর্যাপ্ত স্টক নেই"), "Received clear institutional Bengali error message");

    // 8. Stock Transfer
    console.log("\n--- 8. Testing Stock Transfer via API ---");
    const trRes = await fetch(`${BASE_URL}/api/admin/inventory/stock/transfer`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        itemId: createdItem.id,
        sourceLocationId: createdLoc1.id,
        destLocationId: createdLoc2.id,
        quantity: 10,
        notes: "শাখা স্টোরে স্থানান্তর",
      }),
    });
    const trData = await trRes.json();
    assert(trRes.ok && trData.success, "POST /api/admin/inventory/stock/transfer succeeded");
    assert(trData.updatedSrc.currentBalance === 45, "Source balance debited to 45 (55 - 10)");
    assert(trData.updatedDest.currentBalance === 10, "Destination balance credited to 10 (0 + 10)");

    // 9. Stock Adjustment
    console.log("\n--- 9. Testing Stock Adjustment via API ---");
    const adjRes = await fetch(`${BASE_URL}/api/admin/inventory/stock/adjust`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        itemId: createdItem.id,
        locationId: createdLoc1.id,
        actualQuantity: 44, // 1 less than recorded 45
        reason: "মাসিক ভৌত গণনা সমন্বয়",
      }),
    });
    const adjData = await adjRes.json();
    assert(adjRes.ok && adjData.success, "POST /api/admin/inventory/stock/adjust succeeded");
    assert(adjData.balance.currentBalance === 44, "Balance adjusted strictly to physical count (44)");

    // 10. Suppliers & Procurement Lifecycle
    console.log("\n--- 10. Testing Suppliers & Procurement APIs ---");
    const supRes = await fetch(`${BASE_URL}/api/admin/inventory/suppliers`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "জমিরীয়া স্টেশনারি ও সাপ্লাই",
        contactPerson: "মুহাম্মদ রফিকুল ইসলাম",
        phone: "01711223344",
        address: "দাউদকান্দি বাজার, কুমিল্লা",
      }),
    });
    const supData = await supRes.json();
    assert(supRes.ok && supData.success, "POST /api/admin/inventory/suppliers created supplier");
    const supplier = supData.supplier;
    assert(supplier.supplierCode.startsWith("EHRJ-SUP-"), `Supplier code verified: ${supplier.supplierCode}`);

    // Purchase Request
    const prqRes = await fetch(`${BASE_URL}/api/admin/inventory/procurement/requests`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: "শিক্ষাবর্ষের খাতা ও মার্কার সামগ্রী",
        purpose: "শ্রেণিকক্ষের ব্যবহার",
        priority: "HIGH",
        items: [
          {
            itemId: createdItem.id,
            quantity: 30,
            estimatedUnitCost: 240,
            notes: "জরুরি ভিত্তিতে প্রয়োজন",
          },
        ],
      }),
    });
    const prqData = await prqRes.json();
    assert(prqRes.ok && prqData.success, "POST /api/admin/inventory/procurement/requests created request");
    const purchaseReq = prqData.request;

    // Review Purchase Request
    const revRes = await fetch(
      `${BASE_URL}/api/admin/inventory/procurement/requests/${purchaseReq.id}/review`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          action: "APPROVE",
          adminNotes: "বাজেট অনুযায়ী অনুমোদিত",
        }),
      }
    );
    const revData = await revRes.json();
    assert(revRes.ok && revData.success, "Purchase request approved via review API");
    assert(revData.request.status === "APPROVED", "Request status transitioned to APPROVED");

    // Purchase Order
    const poRes = await fetch(`${BASE_URL}/api/admin/inventory/procurement/orders`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        supplierId: supplier.id,
        purchaseRequestId: purchaseReq.id,
        items: [
          {
            itemId: createdItem.id,
            quantityOrdered: 30,
            unitPrice: 240,
          },
        ],
        discount: 100,
        notes: "দ্রুত সরবরাহের নির্দেশ",
      }),
    });
    const poData = await poRes.json();
    assert(poRes.ok && poData.success, "POST /api/admin/inventory/procurement/orders created order");
    const purchaseOrder = poData.order;
    assert(purchaseOrder.poNumber.startsWith("EHRJ-PO-"), `PO Number verified: ${purchaseOrder.poNumber}`);

    // Goods Receipt Note (GRN)
    const grnRes = await fetch(
      `${BASE_URL}/api/admin/inventory/procurement/orders/${purchaseOrder.id}/receive`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          locationId: createdLoc1.id,
          deliveryChallanNumber: "CHAL-99881",
          items: [
            {
              purchaseOrderItemId: purchaseOrder.items[0].id,
              itemId: createdItem.id,
              quantityReceived: 30,
              quantityDamaged: 2,
              quantityAccepted: 28,
              unitCost: 240,
            },
          ],
        }),
      }
    );
    const grnData = await grnRes.json();
    assert(grnRes.ok && grnData.success, "POST .../receive generated Goods Receipt Note (GRN)");
    assert(grnData.grn.receiptNumber.startsWith("EHRJ-GRN-"), "GRN number verified");

    // 11. Durable Asset Management Lifecycle
    console.log("\n--- 11. Testing Durable Asset Management APIs ---");
    const astRes = await fetch(`${BASE_URL}/api/admin/inventory/assets`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        itemId: createdItem.id,
        locationId: createdLoc1.id,
        supplierId: supplier.id,
        serialNumber: "SN-EHRJ-8877",
        purchaseCost: 12500,
        purchaseDate: new Date().toISOString(),
        assignedUserId: teacherUser.id,
        assignedDepartment: "হিফজুল কুরআন বিভাগ",
        notes: "উস্তাদের শ্রেণিকক্ষে ব্যবহারের জন্য",
      }),
    });
    const astData = await astRes.json();
    assert(astRes.ok && astData.success, "POST /api/admin/inventory/assets created durable asset");
    const asset = astData.asset;
    assert(asset.assetCode.startsWith("EHRJ-AST-"), `Asset code verified: ${asset.assetCode}`);
    assert(asset.qrToken && asset.qrToken.length > 10, "Cryptographic QR token generated");

    // Asset Reassignment
    const reassignRes = await fetch(
      `${BASE_URL}/api/admin/inventory/assets/${asset.id}/assign`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          locationId: createdLoc2.id,
          assignedDepartment: "প্রশাসনিক দপ্তর",
          reason: "দপ্তর পুনর্গঠন",
        }),
      }
    );
    const reassignData = await reassignRes.json();
    assert(reassignRes.ok && reassignData.success, "POST .../assign updated asset assignment");

    // Asset Condition Update
    const condRes = await fetch(
      `${BASE_URL}/api/admin/inventory/assets/${asset.id}/condition`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          newCondition: "REPAIR_REQUIRED",
          newStatus: "REPAIR",
          event: "REPAIR_START",
          reason: "ক্লিপ ক্ষতিগ্রস্থ",
        }),
      }
    );
    const condData = await condRes.json();
    assert(condRes.ok && condData.success, "POST .../condition recorded maintenance event");

    // Asset Safe Disposal
    const dispRes = await fetch(
      `${BASE_URL}/api/admin/inventory/assets/${asset.id}/dispose`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          disposalValue: 200,
          disposalReason: "স্থায়ীভাবে অকেজো ও মেরামত অযোগ্য",
        }),
      }
    );
    const dispData = await dispRes.json();
    assert(dispRes.ok && dispData.success, "POST .../dispose safely retired asset record");
    assert(dispData.asset.status === "DISPOSED", "Asset status marked DISPOSED");

    // 12. Teacher Scoped Read-Only View
    console.log("\n--- 12. Testing Teacher Scoped View & RBAC Isolation ---");
    const teachAstRes = await fetch(`${BASE_URL}/api/teacher/inventory/assets`, {
      headers: teacherHeaders,
    });
    const teachAstData = await teachAstRes.json();
    assert(teachAstRes.ok && teachAstData.success, "GET /api/teacher/inventory/assets returned 200 OK");
    assert(Array.isArray(teachAstData.assets), "Teacher assets returned array");

    // Teacher mutation block: attempt to create item with teacher cookie
    const blockRes = await fetch(`${BASE_URL}/api/admin/inventory/items`, {
      method: "POST",
      headers: teacherHeaders,
      body: JSON.stringify({
        nameBn: "অননুমোদিত আইটেম",
        nameEn: "Unauthorized Item",
        categoryId: createdCat.id,
        unit: "BOX",
      }),
    });
    assert(blockRes.status === 403, "Teacher unauthorized mutation strictly blocked (403 Forbidden)");

    // 13. Public Privacy-Safe QR Lookup
    console.log("\n--- 13. Testing Public Privacy-Safe QR Verification ---");
    const pubVerifyRes = await fetch(
      `${BASE_URL}/api/public/inventory/verify/asset/${asset.qrToken}`
    );
    const pubVerifyData = await pubVerifyRes.json();
    assert(pubVerifyRes.ok && pubVerifyData.success, "GET /api/public/inventory/verify/asset/:token returned 200 OK");
    assert(pubVerifyData.asset.assetCode === asset.assetCode, "Public asset code verified");
    assert(pubVerifyData.asset.purchaseCost === undefined, "Purchase cost strictly redacted from public representation");
    assert(pubVerifyData.asset.assignedUserId === undefined, "Assigned user ID strictly redacted from public representation");

    console.log("\n=================================================");
    console.log(`PHASE 12 HTTP API SUITE SUMMARY:`);
    console.log(`Passed: ${passed} | Failed: ${failed}`);
    console.log("=================================================");

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("FATAL ERROR IN HTTP TEST SUITE:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runHttpApiVerification();
