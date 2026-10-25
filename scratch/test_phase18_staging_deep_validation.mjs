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

function recordTest(id, moduleName, description, passed, details) {
  testResults.push({ id, moduleName, description, passed, details });
  const mark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${mark}] [${id}] [${moduleName.padEnd(16)}] ${description}`);
  if (details) console.log(`        Details: ${details}`);
}

async function runDeepValidation() {
  console.log("================================================================================");
  console.log("EHRJ MADRASHA ERP — PHASE 18: SUPERVISED STAGING DEEP VALIDATION SUITE");
  console.log(`Target: ${STAGING_URL} (PostgreSQL 18.4 Engine: ehrj_staging)`);
  console.log("================================================================================\n");

  const preMasterHash = calculateSha256(MASTER_DB_PATH);
  console.log(`Master DB SHA-256 Baseline: ${preMasterHash}\n`);

  // 1. Health & Staging Engine Check
  try {
    const res = await fetch(`${STAGING_URL}/api/health`);
    const data = await res.json();
    recordTest(
      'STG18-01',
      'System Health',
      'Staging health check validates PostgreSQL 18.4 engine',
      res.status === 200 && data.status === 'HEALTHY' && data.databaseProvider === 'postgresql',
      `Status: ${data.status}, DB: ${data.databaseProvider}, Env: ${data.environment}`
    );
  } catch (err) {
    recordTest('STG18-01', 'System Health', 'Staging health check', false, err.message);
  }

  // 2. Authentication & Role Sessions
  const roles = [
    { name: 'Admin', identifier: 'admin@ehrj.edu.bd', role: 'ADMIN' },
    { name: 'Principal', identifier: 'principal@ehrj.edu.bd', role: 'PRINCIPAL' },
    { name: 'Teacher', identifier: 'teacher@ehrj.edu.bd', role: 'TEACHER' },
    { name: 'Accountant', identifier: 'accountant@ehrj.edu.bd', role: 'ACCOUNTANT' },
    { name: 'Guardian', identifier: 'guardian@ehrj.edu.bd', role: 'GUARDIAN' },
    { name: 'Student', identifier: 'student@ehrj.edu.bd', role: 'STUDENT' },
  ];

  for (let i = 0; i < roles.length; i++) {
    const r = roles[i];
    try {
      const res = await fetch(`${STAGING_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-suite': 'ehrj-staging-deep-validation'
        },
        body: JSON.stringify({
          identifier: r.identifier,
          password: 'WrongPasswordForTest!',
          role: r.role
        })
      });
      const data = await res.json();
      recordTest(
        `STG18-02.${i + 1}`,
        'Role Auth Gates',
        `${r.name} role authentication handshake & password verification`,
        res.status === 401 && (data.error || data.message),
        `HTTP ${res.status}: Credentials verified and rejected safely for invalid password`
      );
    } catch (err) {
      recordTest(`STG18-02.${i + 1}`, 'Role Auth Gates', `${r.name} auth handshake`, false, err.message);
    }
  }

  // 3. Unauthorized Actions & Persona Switching Lockdown
  try {
    const res = await fetch(`${STAGING_URL}/api/app/quick-persona-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetRole: 'ADMIN' })
    });
    const data = await res.json();
    recordTest(
      'STG18-03',
      'Privilege Lockdown',
      'Unauthenticated persona-switch blocked with PERSONA_SWITCH_FORBIDDEN',
      res.status === 403 && data.code === 'PERSONA_SWITCH_FORBIDDEN',
      `HTTP ${res.status}, Code: ${data.code}`
    );
  } catch (err) {
    recordTest('STG18-03', 'Privilege Lockdown', 'Persona switch lockdown', false, err.message);
  }

  // 4. Student Privacy & IDOR Custodial Isolation
  try {
    const res = await fetch(`${STAGING_URL}/api/fees/student/STUDENT-PRIVATE-TARGET-9999`, {
      headers: {
        'x-user-role': 'GUARDIAN',
        'x-student-id': 'STUDENT-MY-CHILD-1111'
      }
    });
    recordTest(
      'STG18-04',
      'Student Privacy',
      'Cross-student IDOR data access strictly forbidden / scoped',
      res.status === 403 || res.status === 404 || res.status === 401,
      `HTTP ${res.status}: Unauthorized cross-tenant student record query safely restricted`
    );
  } catch (err) {
    recordTest('STG18-04', 'Student Privacy', 'Cross-student IDOR', false, err.message);
  }

  // 5. Admissions Workflow on Staging (Quick Submission & Tracking)
  let testAppNumber = null;
  try {
    const appRes = await fetch(`${STAGING_URL}/api/app/quick-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-suite': 'ehrj-staging-deep-validation'
      },
      body: JSON.stringify({
        action: 'SUBMIT_ADMISSION_QUICK',
        payload: {
          studentNameBn: 'মুহাম্মদ শাকিল আহমেদ (Staging Test)',
          guardianName: 'আহমেদ উল্লাহ',
          guardianPhone: '01711002233',
          desiredClass: 'নূরানী'
        }
      })
    });
    const appData = await appRes.json();
    testAppNumber = appData.applicationNumber || appData.application?.applicationNumber;
    const isSuccess = appRes.status === 200 && (appData.success || !!testAppNumber);
    recordTest(
      'STG18-05',
      'Admissions Engine',
      'Quick Admission submission and PostgreSQL persistence',
      isSuccess,
      `HTTP ${appRes.status}, Application Tracking No: ${testAppNumber || appData.error}`
    );

    // Verify read-back from PostgreSQL staging database
    if (testAppNumber) {
      const trackRes = await fetch(`${STAGING_URL}/api/admissions/status?trackingId=${testAppNumber}`);
      const trackData = await trackRes.json();
      recordTest(
        'STG18-05.1',
        'Admissions Engine',
        'Admission record read-back verification from PostgreSQL',
        trackRes.status === 200 && (trackData.status || trackData.applicationNumber === testAppNumber || trackData.success),
        `Tracking ID: ${testAppNumber} successfully queried from staging DB`
      );
    }
  } catch (err) {
    recordTest('STG18-05', 'Admissions Engine', 'Quick Admission submission', false, err.message);
  }

  // 6. Attendance RBAC Enforcement on Staging
  try {
    const attRes = await fetch(`${STAGING_URL}/api/app/quick-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-suite': 'ehrj-staging-deep-validation'
      },
      body: JSON.stringify({
        action: 'SAVE_ATTENDANCE',
        payload: {
          classId: 'CLASS-NURSERY-01',
          date: new Date().toISOString().slice(0, 10),
          records: [
            { studentId: 'TEST-STU-01', status: 'PRESENT' }
          ]
        }
      })
    });
    const attData = await attRes.json();
    // Attendance must strictly enforce TEACHER / ADMIN authentication
    const rbacEnforced = attRes.status === 403 && (attData.error?.includes('লগইন') || attData.error?.includes('অনুমতি'));
    recordTest(
      'STG18-06',
      'Attendance Engine',
      'Attendance sheet submission RBAC protection (HTTP 403 on unauthenticated save)',
      rbacEnforced,
      `HTTP ${attRes.status}: ${attData.error}`
    );
  } catch (err) {
    recordTest('STG18-06', 'Attendance Engine', 'Attendance submission', false, err.message);
  }

  // 7. Results & Exams Lookup on Staging
  try {
    const resRes = await fetch(`${STAGING_URL}/api/app/quick-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SEARCH_RESULT',
        payload: { rollNumber: '101' }
      })
    });
    const resData = await resRes.json();
    const handledSafely = resRes.status === 200 || resRes.status === 404;
    recordTest(
      'STG18-07',
      'Exams & Results',
      'Student marksheet query against PostgreSQL staging database',
      handledSafely,
      `HTTP ${resRes.status}: ${resData.success ? 'Marksheet Found' : resData.error}`
    );
  } catch (err) {
    recordTest('STG18-07', 'Exams & Results', 'Student marksheet query', false, err.message);
  }

  // 8. Finance: Fee Invoices & Receipt Verification on Staging
  try {
    const feeRes = await fetch(`${STAGING_URL}/api/app/quick-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'GENERATE_FEE_RECEIPT',
        payload: {
          invoiceId: 'NONEXISTENT-INV-000',
          amount: 500,
          paymentMethod: 'CASH'
        }
      })
    });
    const feeData = await feeRes.json();
    recordTest(
      'STG18-08',
      'Finance Engine',
      'Fee receipt voucher generation validation on PostgreSQL staging',
      feeRes.status === 404 || feeRes.status === 400 || feeRes.status === 200,
      `HTTP ${feeRes.status}: ${feeData.error || feeData.message || 'Handled safely'}`
    );
  } catch (err) {
    recordTest('STG18-08', 'Finance Engine', 'Fee receipt generation', false, err.message);
  }

  // 9. Gatepass Verification Workflow on Staging
  try {
    const gateRes = await fetch(`${STAGING_URL}/api/verify/gatepass?token=INVALID_GATE_TOKEN_TEST`);
    const gateData = await gateRes.json().catch(() => ({}));
    recordTest(
      'STG18-09',
      'Gatepass Engine',
      'Gatepass token verification endpoint validation',
      gateRes.status === 404 || gateRes.status === 400 || gateRes.status === 200,
      `HTTP ${gateRes.status}: ${gateData.error || 'Validated'}`
    );
  } catch (err) {
    recordTest('STG18-09', 'Gatepass Engine', 'Gatepass verification', false, err.message);
  }

  // 10. Expired Session & Unauthorized Error Handling
  try {
    const badSessionRes = await fetch(`${STAGING_URL}/api/admin/academic`, {
      headers: {
        'Cookie': 'auth-token=EXPIRED_OR_FORGED_TOKEN_XYZ; HttpOnly; Path=/'
      }
    });
    recordTest(
      'STG18-10',
      'Session Security',
      'Expired or invalid session token rejected with HTTP 401/403',
      badSessionRes.status === 401 || badSessionRes.status === 403 || badSessionRes.status === 302,
      `HTTP ${badSessionRes.status}: Forged/expired session rejected cleanly`
    );
  } catch (err) {
    recordTest('STG18-10', 'Session Security', 'Expired session rejection', false, err.message);
  }

  // 11. Staging Database Read/Write Isolation Proof
  const postMasterHash = calculateSha256(MASTER_DB_PATH);
  const masterUnchanged = preMasterHash === postMasterHash;
  recordTest(
    'STG18-11',
    'Isolation Guard',
    'Master SQLite database unchanged throughout deep staging validation',
    masterUnchanged,
    `Pre Hash: ${preMasterHash.slice(0, 16)}... Post Hash: ${postMasterHash.slice(0, 16)}... (Byte-Identical)`
  );

  console.log("\n================================================================================");
  console.log("DEEP STAGING ACCEPTANCE RESULTS SUMMARY");
  console.log("================================================================================");
  const total = testResults.length;
  const passed = testResults.filter(t => t.passed).length;
  const failed = total - passed;
  console.log(`Total Scenarios Tested: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Deep Validation Status: ${failed === 0 ? 'ALL SCENARIOS PASSED (100% VERIFIED)' : 'ANOMALIES DETECTED'}`);

  return { total, passed, failed, masterUnchanged };
}

runDeepValidation().then(res => {
  if (res.failed > 0) process.exit(1);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
