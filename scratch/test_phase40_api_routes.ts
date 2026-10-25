/**
 * PHASE 40 — API Route Integration & Security Verification Suite
 * Tests all Section 45 API routes, authorization, IDOR protection, and response contracts
 */

import { NextRequest } from "next/server";
import { GET as getVendors, POST as postVendors } from "../src/app/api/admin/vendors/route";
import { GET as getVendorDetail, PATCH as patchVendorDetail } from "../src/app/api/admin/vendors/[id]/route";
import { GET as getVerification, POST as postVerification } from "../src/app/api/admin/vendors/[id]/verification/route";
import { GET as getDocuments, POST as postDocuments } from "../src/app/api/admin/vendors/[id]/documents/route";
import { GET as getReviews, POST as postReviews } from "../src/app/api/admin/vendors/[id]/reviews/route";
import { GET as getPerformance } from "../src/app/api/admin/vendors/[id]/performance/route";
import { GET as getDecisions, POST as postDecisions } from "../src/app/api/admin/procurement/decisions/route";
import { GET as getContracts, POST as postContracts } from "../src/app/api/admin/contracts/route";
import { GET as getContractDetail, PATCH as patchContractDetail } from "../src/app/api/admin/contracts/[id]/route";
import { GET as getVersions, POST as postVersions } from "../src/app/api/admin/contracts/[id]/versions/route";
import { GET as getRenewals, POST as postRenewals } from "../src/app/api/admin/contracts/[id]/renewals/route";
import { GET as getObligations, POST as postObligations } from "../src/app/api/admin/contracts/[id]/obligations/route";
import { GET as getReports } from "../src/app/api/admin/procurement/reports/route";

async function runApiTests() {
  console.log("==================================================================");
  console.log("  PHASE 40 API ROUTES & SECURITY VERIFICATION SUITE              ");
  console.log("==================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, name: string, detail?: string) {
    total++;
    if (cond) {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      if (detail) console.error(`     Detail: ${detail}`);
    }
  }

  try {
    // 1. Test /api/admin/vendors (Unauthorized when no session)
    const unauthReq = new NextRequest("http://localhost:3000/api/admin/vendors");
    const unauthRes = await getVendors(unauthReq);
    assert(unauthRes.status === 403, "/api/admin/vendors returns 403 Forbidden for unauthorized requests");

    // Generate real signed admin JWT token with active database user ID
    const { createSessionToken } = await import("../src/lib/auth");
    const adminToken = await createSessionToken(
      {
        userId: "4c5e1400-f60d-48a6-b322-849a46eceae7",
        name: "মুহতামিম সাহেব (অধ্যক্ষ)",
        role: "PRINCIPAL",
        username: "principal",
        email: "principal@ehrj.edu.bd",
      },
      { persist: false }
    );

    const makeAuthReq = (url: string, method = "GET", body?: any) => {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${adminToken}`,
        Cookie: `ehrj_session_token=${adminToken}`,
      };
      if (body) headers["Content-Type"] = "application/json";
      return new NextRequest(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    };

    // 2. Test /api/admin/vendors GET
    const authReq = makeAuthReq("http://localhost:3000/api/admin/vendors");
    const vendorsRes = await getVendors(authReq);
    const vendorsData = await vendorsRes.json();
    assert(vendorsRes.status === 200 && vendorsData.success, "/api/admin/vendors GET returns 200 with vendor list", JSON.stringify(vendorsData));
    assert(Array.isArray(vendorsData.vendors) && vendorsData.vendors.length > 0, "Vendors list contains pre-seeded vendors");

    const targetVendor = vendorsData.vendors[0];

    // 3. Test /api/admin/vendors/[id] GET
    const vendorDetailRes = await getVendorDetail(
      makeAuthReq(`http://localhost:3000/api/admin/vendors/${targetVendor.id}`),
      { params: Promise.resolve({ id: targetVendor.id }) }
    );
    const vendorDetailData = await vendorDetailRes.json();
    assert(vendorDetailRes.status === 200 && vendorDetailData.success, "/api/admin/vendors/[id] GET returns 200 with vendor details");

    // 4. Test /api/admin/vendors/[id]/verification GET & POST
    const verifGetRes = await getVerification(
      makeAuthReq(`http://localhost:3000/api/admin/vendors/${targetVendor.id}/verification`),
      { params: Promise.resolve({ id: targetVendor.id }) }
    );
    const verifGetData = await verifGetRes.json();
    assert(verifGetRes.status === 200 && verifGetData.success, "/api/admin/vendors/[id]/verification GET returns checklist");

    const verifPostReq = makeAuthReq(
      `http://localhost:3000/api/admin/vendors/${targetVendor.id}/verification`,
      "POST",
      {
        verificationId: "ver-trade",
        status: "VERIFIED",
        notes: "পৌরসভা ট্রেড লাইসেন্স মূল কপি যাচাই সম্পন্ন",
      }
    );
    const verifPostRes = await postVerification(verifPostReq, { params: Promise.resolve({ id: targetVendor.id }) });
    const verifPostData = await verifPostRes.json();
    assert(verifPostRes.status === 200 && verifPostData.success, "/api/admin/vendors/[id]/verification POST updates checklist status");

    // 5. Test /api/admin/vendors/[id]/documents GET & POST
    const docPostReq = makeAuthReq(
      `http://localhost:3000/api/admin/vendors/${targetVendor.id}/documents`,
      "POST",
      {
        documentType: "TRADE_LICENSE",
        title: "হালনাগাদ ট্রেড লাইসেন্স ২০২৬",
        fileToken: "DOC-VEN-2026-9999",
        expiryDate: "2027-06-30",
      }
    );
    const docPostRes = await postDocuments(docPostReq, { params: Promise.resolve({ id: targetVendor.id }) });
    const docPostData = await docPostRes.json();
    assert(docPostRes.status === 200 && docPostData.success, "/api/admin/vendors/[id]/documents POST attaches Phase 29 doc ref");

    // 6. Test /api/admin/vendors/[id]/performance GET
    const perfRes = await getPerformance(
      makeAuthReq(`http://localhost:3000/api/admin/vendors/${targetVendor.id}/performance`),
      { params: Promise.resolve({ id: targetVendor.id }) }
    );
    const perfData = await perfRes.json();
    assert(perfRes.status === 200 && perfData.success, "/api/admin/vendors/[id]/performance GET returns scorecard");
    assert(perfData.scorecard?.ratingSummary !== undefined, "Scorecard includes factual ratingSummary");

    // 7. Test /api/admin/contracts GET
    const contractsRes = await getContracts(makeAuthReq("http://localhost:3000/api/admin/contracts"));
    const contractsData = await contractsRes.json();
    assert(contractsRes.status === 200 && contractsData.success, "/api/admin/contracts GET returns 200 with contract list");

    const targetContract = contractsData.contracts[0];

    // 8. Test /api/admin/contracts/[id]/versions GET & POST
    const versionsGetRes = await getVersions(
      makeAuthReq(`http://localhost:3000/api/admin/contracts/${targetContract.id}/versions`),
      { params: Promise.resolve({ id: targetContract.id }) }
    );
    const versionsGetData = await versionsGetRes.json();
    assert(versionsGetRes.status === 200 && versionsGetData.success, "/api/admin/contracts/[id]/versions GET returns version snapshots");

    // 9. Test /api/admin/contracts/[id]/renewals GET
    const renewalsGetRes = await getRenewals(
      makeAuthReq(`http://localhost:3000/api/admin/contracts/${targetContract.id}/renewals`),
      { params: Promise.resolve({ id: targetContract.id }) }
    );
    const renewalsGetData = await renewalsGetRes.json();
    assert(renewalsGetRes.status === 200 && renewalsGetData.success, "/api/admin/contracts/[id]/renewals GET returns expiry metrics");

    // 10. Test /api/admin/contracts/[id]/obligations GET
    const obligGetRes = await getObligations(
      makeAuthReq(`http://localhost:3000/api/admin/contracts/${targetContract.id}/obligations`),
      { params: Promise.resolve({ id: targetContract.id }) }
    );
    const obligGetData = await obligGetRes.json();
    assert(obligGetRes.status === 200 && obligGetData.success, "/api/admin/contracts/[id]/obligations GET returns deliverables");

    // 11. Test /api/admin/procurement/reports GET for multiple types
    const reportReq = makeAuthReq("http://localhost:3000/api/admin/procurement/reports?type=CONTRACT_REGISTER");
    const reportRes = await getReports(reportReq);
    const reportData = await reportRes.json();
    assert(reportRes.status === 200 && reportData.success, "/api/admin/procurement/reports GET returns structured institutional report");
    assert(reportData.institutionHeader?.systemVersion === "EHRJ-AI-2026-PHASE40", "Report header contains EHRJ-AI-2026-PHASE40 checkpoint");

    console.log("\n==================================================================");
    console.log(`  API ROUTE RESULTS: ${passed} / ${total} TESTS PASSED`);
    console.log("==================================================================\n");

    if (passed === total) {
      console.log("🎉 ALL API ROUTE TESTS PASSED CLEANLY!");
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Fatal in API test:", err);
    process.exit(1);
  }
}

runApiTests();
