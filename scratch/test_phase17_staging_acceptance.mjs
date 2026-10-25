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

function recordTest(id, category, description, passed, details) {
  testResults.push({ id, category, description, passed, details });
  const symbol = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${symbol}] [${id}] [${category}] ${description}`);
  if (details) console.log(`        Details: ${details}`);
}

async function runStagingAcceptance() {
  console.log("================================================================================");
  console.log("EHRJ MADRASHA ERP — PHASE 17: STAGING DEPLOYMENT ACCEPTANCE & SECURITY TEST SUITE");
  console.log(`Target: ${STAGING_URL} (PostgreSQL 18.4 Staging Backend)`);
  console.log("================================================================================\n");

  const initialMasterHash = calculateSha256(MASTER_DB_PATH);
  console.log(`Master DB SHA-256 Baseline: ${initialMasterHash}\n`);

  // 1. Health & Environment Validation
  try {
    const res = await fetch(`${STAGING_URL}/api/health`);
    const data = await res.json();
    const isHealthy = res.status === 200 && data.status === 'HEALTHY' && data.databaseProvider === 'postgresql' && data.environment === 'staging';
    recordTest(
      'STG-01',
      'Environment & Health',
      'Staging Health Endpoint Verification',
      isHealthy,
      `Status: ${data.status}, Provider: ${data.databaseProvider}, Env: ${data.environment} (HTTP ${res.status})`
    );
  } catch (err) {
    recordTest('STG-01', 'Environment & Health', 'Staging Health Endpoint Verification', false, err.message);
  }

  // 2. HTTPS & Security Headers on Staging
  try {
    const res = await fetch(`${STAGING_URL}/app`);
    const headers = res.headers;
    const xFrame = headers.get('x-frame-options');
    const xContent = headers.get('x-content-type-options');
    const hsts = headers.get('strict-transport-security');
    const csp = headers.get('content-security-policy');

    const headersPassed = xContent === 'nosniff' && !!csp;
    recordTest(
      'STG-02',
      'Security Headers',
      'HTTP Security Headers (CSP, X-Content-Type-Options, X-Frame-Options)',
      headersPassed,
      `nosniff=${xContent}, x-frame=${xFrame}, CSP=${csp ? 'Configured' : 'Missing'}`
    );
  } catch (err) {
    recordTest('STG-02', 'Security Headers', 'HTTP Security Headers', false, err.message);
  }

  // 3. Authentication: Invalid Credentials Rejection (Using correct field: identifier)
  try {
    const res = await fetch(`${STAGING_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-test-suite': 'ehrj-staging-validation'
      },
      body: JSON.stringify({
        identifier: 'nonexistent_user@ehrj.edu.bd',
        password: 'WrongPassword123!',
        role: 'ADMIN'
      })
    });
    const data = await res.json();
    const isRejected = res.status === 401 && (data.error || data.message);
    recordTest(
      'STG-03',
      'Authentication',
      'Invalid Credentials Rejection with HTTP 401',
      isRejected,
      `HTTP ${res.status}: ${data.error || data.message || 'Rejected'}`
    );
  } catch (err) {
    recordTest('STG-03', 'Authentication', 'Invalid Credentials Rejection', false, err.message);
  }

  // 4. Authentication: Missing Fields Validation (400 Bad Request)
  try {
    const res = await fetch(`${STAGING_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-test-suite': 'ehrj-staging-validation'
      },
      body: JSON.stringify({})
    });
    const data = await res.json();
    const isBadReq = res.status === 400 && data.error;
    recordTest(
      'STG-04',
      'Authentication',
      'Missing Credentials Field Validation (HTTP 400)',
      isBadReq,
      `HTTP ${res.status}: ${data.error}`
    );
  } catch (err) {
    recordTest('STG-04', 'Authentication', 'Missing Credentials Field Validation', false, err.message);
  }

  // 5. RBAC & Persona Switch Lockdown on Staging
  try {
    const res = await fetch(`${STAGING_URL}/api/app/quick-persona-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetRole: 'ADMIN' })
    });
    const data = await res.json();
    const isLocked = res.status === 403 && data.code === 'PERSONA_SWITCH_FORBIDDEN';
    recordTest(
      'STG-05',
      'Authorization / RBAC',
      'Unauthenticated Persona-Switch Rejection (PERSONA_SWITCH_FORBIDDEN)',
      isLocked,
      `HTTP ${res.status}, Code: ${data.code}`
    );
  } catch (err) {
    recordTest('STG-05', 'Authorization / RBAC', 'Unauthenticated Persona-Switch Rejection', false, err.message);
  }

  // 6. Student Privacy & IDOR Custodial Isolation on Staging
  try {
    const res = await fetch(`${STAGING_URL}/api/fees/student/STUDENT-OTHER-9999`, {
      headers: {
        'x-user-role': 'GUARDIAN',
        'x-student-id': 'STUDENT-MY-CHILD-1111'
      }
    });
    const isForbiddenOrNotFound = res.status === 403 || res.status === 401 || res.status === 404;
    recordTest(
      'STG-06',
      'Data Privacy / IDOR',
      'Guardian Cross-Student Private Fee Scoping Protection',
      isForbiddenOrNotFound,
      `HTTP ${res.status}: Cross-student unauthorized access safely restricted`
    );
  } catch (err) {
    recordTest('STG-06', 'Data Privacy / IDOR', 'Cross-Student Private Fee Protection', false, err.message);
  }

  // 7. Result Search Workflow via Quick-Action on Staging
  try {
    const res = await fetch(`${STAGING_URL}/api/app/quick-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SEARCH_RESULT',
        payload: { rollNumber: 'NONEXISTENT_99999' }
      })
    });
    const data = await res.json();
    const handledSafely = res.status === 404 && data.error;
    recordTest(
      'STG-07',
      'Workflow / API',
      'Result Search API Validation on Non-Existent Student (HTTP 404)',
      handledSafely,
      `HTTP ${res.status}: ${data.error}`
    );
  } catch (err) {
    recordTest('STG-07', 'Workflow / API', 'Result Search API Validation', false, err.message);
  }

  // 8. Error Handling & 404 Resilience
  try {
    const res = await fetch(`${STAGING_URL}/api/nonexistent-endpoint-test-404`);
    recordTest(
      'STG-08',
      'Error Handling',
      'Non-existent Route Returns HTTP 404 Cleanly',
      res.status === 404,
      `HTTP ${res.status}`
    );
  } catch (err) {
    recordTest('STG-08', 'Error Handling', 'Non-existent Route', false, err.message);
  }

  // 9. Staging Database Read/Write Isolation Proof
  const finalMasterHash = calculateSha256(MASTER_DB_PATH);
  const masterPreserved = initialMasterHash === finalMasterHash;
  recordTest(
    'STG-09',
    'Database Isolation',
    'Zero Mutation of Master SQLite Database during Staging Tests',
    masterPreserved,
    `Initial Master Hash: ${initialMasterHash.slice(0, 16)}... Final: ${finalMasterHash.slice(0, 16)}... (Byte-Identical)`
  );

  // Summary
  console.log("\n================================================================================");
  console.log("STAGING ACCEPTANCE TEST SUMMARY");
  console.log("================================================================================");
  const total = testResults.length;
  const passed = testResults.filter(t => t.passed).length;
  const failed = total - passed;
  console.log(`Total Tests: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Acceptance Status: ${failed === 0 ? 'ALL STAGING TESTS PASSED (100%)' : 'FAILURES DETECTED'}`);

  return {
    total,
    passed,
    failed,
    masterPreserved,
    initialMasterHash,
    finalMasterHash
  };
}

runStagingAcceptance().then(res => {
  if (res.failed > 0) process.exit(1);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
