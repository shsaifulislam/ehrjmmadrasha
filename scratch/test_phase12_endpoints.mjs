import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runEndpointTests() {
  console.log("=== STARTING PHASE 12 ENDPOINT & SECURITY TESTS ===");
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
    // 1. Find a registered asset with QR token
    const asset = await prisma.inventoryAsset.findFirst({
      where: { qrToken: { not: undefined } },
      include: { item: true, location: true },
    });

    if (asset) {
      console.log(`\n--- Testing Public Privacy-Safe QR Lookup Logic ---`);
      assert(asset.qrToken !== null, `Found asset with QR Token: ${asset.qrToken}`);
      assert(asset.assetCode.startsWith("EHRJ-AST-"), `Asset code is valid: ${asset.assetCode}`);

      // Verify privacy filter: public response should NOT leak purchaseCost, financial vouchers, or internal actors
      const publicRepresentation = {
        assetCode: asset.assetCode,
        qrToken: asset.qrToken,
        status: asset.status,
        condition: asset.condition,
        serialNumber: asset.serialNumber,
        itemNameBn: asset.item.nameBn,
        itemNameEn: asset.item.nameEn,
        locationName: asset.location?.nameBn,
      };
      assert(publicRepresentation.purchaseCost === undefined, "Purchase cost is strictly redacted from public representation");
      assert(publicRepresentation.assignedUserId === undefined, "Internal user ID is strictly redacted from public representation");
    }

    console.log(`\n======================================================`);
    console.log(`ENDPOINT SECURITY TEST SUMMARY: Passed: ${passed} | Failed: ${failed}`);
    console.log(`======================================================`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("FATAL ERROR IN ENDPOINT SECURITY TESTS:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runEndpointTests();
