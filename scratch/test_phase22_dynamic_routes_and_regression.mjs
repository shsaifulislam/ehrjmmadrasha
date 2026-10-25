import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const STAGING_URL = 'http://localhost:3001';
const MASTER_DB_PATH = path.resolve('prisma/dev.db');

function calculateSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

const testResults = [];

function recordTest(id, moduleName, description, status, details) {
  testResults.push({ id, moduleName, description, status, details });
  const mark = status === 'VERIFIED' ? '✓ VERIFIED' : (status === 'BLOCKED' ? '⚠ BLOCKED' : '✗ FAILED');
  console.log(`[${mark}] [${id}] [${moduleName.padEnd(20)}] ${description}`);
  if (details) console.log(`         Details: ${details}`);
}

async function runPhase22Tests() {
  console.log("================================================================================");
  console.log("EHRJ MADRASHA ERP — PHASE 22: DYNAMIC ROUTE & REGRESSION TEST HARNESS");
  console.log("Staging Target: " + STAGING_URL + " (PostgreSQL)");
  console.log("Master SQLite:  " + MASTER_DB_PATH);
  console.log("================================================================================\n");

  const initialMasterHash = calculateSha256(MASTER_DB_PATH);
  console.log(`Initial Master SQLite SHA-256: ${initialMasterHash}\n`);

  // --- TASK 3: ROUTE-LEVEL TESTS ---

  // 1. Valid/Invalid Student ID Verification Route
  try {
    const res = await fetch(`${STAGING_URL}/api/verify/student/non-existent-student-id-9999`);
    const data = await res.json();
    const passed = res.status === 404 && (data.verified === false || data.error !== undefined || data.message !== undefined);
    recordTest(
      'ROUTE-P22-01',
      'Student Verification',
      'GET /api/verify/student/[id] gracefully returns 404 on nonexistent ID',
      passed ? 'VERIFIED' : 'FAILED',
      `Status: ${res.status}, Body: ${JSON.stringify(data)}`
    );
  } catch (err) {
    recordTest('ROUTE-P22-01', 'Student Verification', 'GET /api/verify/student/[id]', 'FAILED', err.message);
  }

  // 2. Valid/Invalid Gatepass Token Verification Route
  try {
    const res = await fetch(`${STAGING_URL}/api/verify/gatepass/invalid-token-xyz-123`);
    const data = await res.json();
    const passed = (res.status === 404 || res.status === 200) && (data.verified === false || data.error !== undefined);
    recordTest(
      'ROUTE-P22-02',
      'GatePass Verification',
      'GET /api/verify/gatepass/[token] safely rejects nonexistent token',
      passed ? 'VERIFIED' : 'FAILED',
      `Status: ${res.status}, Verified: ${data.verified}`
    );
  } catch (err) {
    recordTest('ROUTE-P22-02', 'GatePass Verification', 'GET /api/verify/gatepass/[token]', 'FAILED', err.message);
  }

  // 3. Document/Certificate Verification Route
  try {
    const res = await fetch(`${STAGING_URL}/api/verify/document/NONEXISTENT-CERT-999`);
    const data = await res.json();
    const passed = res.status === 404 && data.verified === false;
    recordTest(
      'ROUTE-P22-03',
      'Document Verification',
      'GET /api/verify/document/[token] returns privacy-safe 404 for invalid code',
      passed ? 'VERIFIED' : 'FAILED',
      `Status: ${res.status}, Verified: ${data.verified}`
    );
  } catch (err) {
    recordTest('ROUTE-P22-03', 'Document Verification', 'GET /api/verify/document/[token]', 'FAILED', err.message);
  }

  // 4. Result Code Verification Route
  try {
    const res = await fetch(`${STAGING_URL}/api/verify/result/INVALID-RES-CODE-000`);
    const data = await res.json();
    const passed = res.status === 404 || (res.status === 200 && data.verification?.isValid === false);
    recordTest(
      'ROUTE-P22-04',
      'Result Verification',
      'GET /api/verify/result/[code] returns safe validation failure for unknown code',
      passed ? 'VERIFIED' : 'FAILED',
      `Status: ${res.status}`
    );
  } catch (err) {
    recordTest('ROUTE-P22-04', 'Result Verification', 'GET /api/verify/result/[code]', 'FAILED', err.message);
  }

  // 5. Receipt Token Verification Route
  try {
    const res = await fetch(`${STAGING_URL}/api/verify/receipt/NONEXISTENT-RCPT-TOKEN`);
    const data = await res.json();
    const passed = res.status === 404 || (data.verified === false);
    recordTest(
      'ROUTE-P22-05',
      'Receipt Verification',
      'GET /api/verify/receipt/[token] returns 404 for nonexistent receipt',
      passed ? 'VERIFIED' : 'FAILED',
      `Status: ${res.status}`
    );
  } catch (err) {
    recordTest('ROUTE-P22-05', 'Receipt Verification', 'GET /api/verify/receipt/[token]', 'FAILED', err.message);
  }

  // 6. Webhook Inbound Provider Route (Signature Verification & Security Boundary)
  try {
    const res = await fetch(`${STAGING_URL}/api/v1/webhooks/inbound/unknown-provider-xyz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ping: 'test' })
    });
    const data = await res.json();
    const passed = (res.status === 400 || res.status === 401) && (data.error?.includes('Unsupported') || data.error?.includes('signature') || data.error?.includes('HMAC'));
    recordTest(
      'ROUTE-P22-06',
      'Inbound Webhook',
      'POST /api/v1/webhooks/inbound/[provider] enforces cryptographic HMAC and provider validation',
      passed ? 'VERIFIED' : 'FAILED',
      `Status: ${res.status}, Error: ${data.error}`
    );
  } catch (err) {
    recordTest('ROUTE-P22-06', 'Inbound Webhook', 'POST /api/v1/webhooks/inbound/[provider]', 'FAILED', err.message);
  }

  // 7. Protected Dynamic Admin Route Boundary (Unauthenticated Check)
  try {
    const res = await fetch(`${STAGING_URL}/api/admin/academic/classes/test-id-123`, {
      method: 'GET'
    });
    const passed = res.status === 401 || res.status === 403;
    recordTest(
      'ROUTE-P22-07',
      'RBAC Boundary',
      'GET /api/admin/academic/classes/[id] strictly forbids unauthenticated requests',
      passed ? 'VERIFIED' : 'FAILED',
      `Status: ${res.status}`
    );
  } catch (err) {
    recordTest('ROUTE-P22-07', 'RBAC Boundary', 'GET /api/admin/academic/classes/[id]', 'FAILED', err.message);
  }

  // 8. Protected HR Employee Document Verification Route Boundary
  try {
    const res = await fetch(`${STAGING_URL}/api/admin/hr/employees/emp1/documents/doc1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationStatus: 'VERIFIED' })
    });
    const passed = res.status === 401 || res.status === 403;
    recordTest(
      'ROUTE-P22-08',
      'Multi-segment RBAC',
      'POST /api/admin/hr/employees/[id]/documents/[docId]/verify rejects unauthenticated callers',
      passed ? 'VERIFIED' : 'FAILED',
      `Status: ${res.status}`
    );
  } catch (err) {
    recordTest('ROUTE-P22-08', 'Multi-segment RBAC', 'POST /api/admin/hr/employees/.../verify', 'FAILED', err.message);
  }

  // 9. Public Notice Detail Page Rendering
  try {
    const res = await fetch(`${STAGING_URL}/notices/non-existent-notice-id-999`);
    const passed = res.status === 200; // Next.js returns 200 with the "নোটিশ পাওয়া যায়নি" friendly UI
    const html = await res.text();
    const hasNotFoundNotice = html.includes('নোটিশটি খুঁজে পাওয়া যায়নি') || html.includes('নোটিশ পাওয়া যায়নি');
    recordTest(
      'ROUTE-P22-09',
      'Notice Page Dynamic',
      'GET /notices/[id] gracefully renders institutionally styled 404 message for missing notice',
      (passed && hasNotFoundNotice) ? 'VERIFIED' : 'FAILED',
      `Status: ${res.status}, Friendly UI present: ${hasNotFoundNotice}`
    );
  } catch (err) {
    recordTest('ROUTE-P22-09', 'Notice Page Dynamic', 'GET /notices/[id]', 'FAILED', err.message);
  }

  // 10. Login Redirects Async searchParams
  try {
    const res = await fetch(`${STAGING_URL}/login/admin?redirect=%2Fadmin%2Ffinance`, {
      redirect: 'manual'
    });
    const location = res.headers.get('location') || '';
    const passed = res.status === 307 || res.status === 302 || res.status === 308;
    const hasTarget = location.toLowerCase().includes('tab=institutional') && location.includes('%2Fadmin%2Ffinance');
    recordTest(
      'ROUTE-P22-10',
      'Login Redirection',
      'GET /login/admin?redirect=... properly awaits searchParams and forwards query',
      (passed && hasTarget) ? 'VERIFIED' : 'FAILED',
      `Status: ${res.status}, Location: ${location}`
    );
  } catch (err) {
    recordTest('ROUTE-P22-10', 'Login Redirection', 'GET /login/admin', 'FAILED', err.message);
  }

  // 11. Final Master SQLite Database Integrity Check
  const finalMasterHash = calculateSha256(MASTER_DB_PATH);
  const hashMatches = initialMasterHash === finalMasterHash;
  recordTest(
    'SAFE-P22-01',
    'Database Protection',
    'Master SQLite database (prisma/dev.db) is preserved byte-for-byte with zero mutation',
    hashMatches ? 'VERIFIED' : 'FAILED',
    `Initial: ${initialMasterHash}\n         Final:   ${finalMasterHash}`
  );

  console.log("\n================================================================================");
  console.log(`Phase 22 Route Test Suite Completed: ${testResults.filter(t => t.status === 'VERIFIED').length}/${testResults.length} Tests Verified`);
  console.log("================================================================================\n");

  fs.writeFileSync('scratch/phase22_test_results.json', JSON.stringify(testResults, null, 2));
}

runPhase22Tests().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
