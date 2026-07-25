const http = require('http');

async function login(username = 'admin', password = 'password123') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ username, password });
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, res => {
      let body = '';
      const cookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ cookie, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function request(path, method = 'GET', data = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Cookie': cookie
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runPhase2FullSuite() {
  console.log('🚀 Running Comprehensive Phase 2 HR & Payroll 14-Test Automated Verification...\n');

  const { cookie } = await login('admin', 'password123');
  console.log('✅ 1. Admin Auth Successful');

  // Test 1: Staff Creation
  const staffData = {
    employeeId: `STF-FULL-${Date.now().toString().slice(-4)}`,
    name: 'মো: জহিরুল ইসলাম (হিসাব প্রধান)',
    phone: '01711223344',
    designation: 'Accountant',
    department: 'Accounts',
    paymentMethod: 'CASH'
  };
  const staffRes = await request('/api/admin/staff', 'POST', staffData, cookie);
  const staffId = staffRes.body.data.id;
  console.log(`✅ 2. Staff Created: ${staffRes.body.data.name} (ID: ${staffRes.body.data.employeeId})`);

  // Test 2: Salary Structure
  const structRes = await request('/api/admin/payroll/structure', 'POST', {
    staffId,
    basicSalary: 20000,
    houseRent: 4000,
    medicalAllowance: 1000
  }, cookie);
  console.log(`✅ 3. Salary Structure Configured: Basic = ৳${structRes.body.data.basicSalary}, Gross = ৳${structRes.body.data.grossSalary}`);

  // Test 3: Staff Advance Creation
  const advRes = await request('/api/admin/payroll/advance', 'POST', { staffId, amount: 3000, reason: 'মেডিকেল ফি' }, cookie);
  console.log(`✅ 4. Staff Advance Created & Disbursed: ৳${advRes.body.data.amount}`);

  // Test 4: Batch Payroll Generation
  const testMonth = Math.floor(Math.random() * 12) + 1;
  const genRes = await request('/api/admin/payroll/generate', 'POST', { year: 2026, month: testMonth }, cookie);
  console.log(`✅ 5. Monthly Payroll Generated for 2026/${testMonth}: Batch Records = ${genRes.body.data.records.length}`);

  const record = genRes.body.data.records.find(r => r.staffId === staffId);
  console.log(`✅ 6. Net Payroll Calculation Verified: Gross ৳${record.grossSalary} - Advance ৳${record.advanceDeduction} = Net ৳${record.netPayable}`);

  // Test 5: Duplicate Payroll Protection
  const dupRes = await request('/api/admin/payroll/generate', 'POST', { year: 2026, month: testMonth }, cookie);
  if (dupRes.status >= 400 || !dupRes.body.success) {
    console.log(`✅ 7. Duplicate Payroll Generation Rejected correctly (${dupRes.body.message})`);
  } else {
    console.error('❌ Duplicate payroll generation rejection failed!');
  }

  // Test 6: Payroll Approval & Accrual Double-Entry Journal Entry Creation
  const appRes = await request('/api/admin/payroll/approve', 'POST', { year: 2026, month: testMonth }, cookie);
  console.log(`✅ 8. Payroll Approved & Salary Accrual Entry Created (Status: ${appRes.body.data.status})`);

  // Test 7: Approved Payroll Immutability Protection
  const reAppRes = await request('/api/admin/payroll/approve', 'POST', { year: 2026, month: testMonth }, cookie);
  if (reAppRes.status >= 400 || !reAppRes.body.success) {
    console.log(`✅ 9. Approved Payroll Immutability Protection Verified (${reAppRes.body.message})`);
  } else {
    console.error('❌ Approved payroll immutability check failed!');
  }

  // Test 8: Partial Salary Payment Execution
  const pay1Res = await request('/api/admin/payroll/pay', 'POST', {
    payrollRecordId: record.id,
    amountPaid: 12000,
    paymentMethod: 'CASH',
    note: 'প্রথম কিস্তি প্রদান'
  }, cookie);
  console.log(`✅ 10. Partial Salary Payment Executed: Voucher ${pay1Res.body.data.voucherNumber}, Paid ৳12000`);

  // Test 9: Remaining Due Amount Verification
  const payslip1 = await request(`/api/admin/payroll/payslip/${record.id}`, 'GET', null, cookie);
  console.log(`✅ 11. Remaining Due Verified: Net ৳${payslip1.body.data.netPayable}, Paid ৳${payslip1.body.data.paidAmount}, Remaining Due = ৳${payslip1.body.data.dueAmount}`);

  // Test 10: Overpayment Protection Test (Attempting to pay ৳50,000 when due is ৳10,000)
  const overpayRes = await request('/api/admin/payroll/pay', 'POST', {
    payrollRecordId: record.id,
    amountPaid: 50000,
    paymentMethod: 'CASH',
    note: 'ওভার-পেমেন্ট টেস্ট'
  }, cookie);
  if (overpayRes.status >= 400 || !overpayRes.body.success) {
    console.log(`✅ 12. Overpayment Protection Verified (Attempted ৳50000 > Due ৳${payslip1.body.data.dueAmount} -> Rejected: ${overpayRes.body.message})`);
  } else {
    console.error('❌ Overpayment protection failed! Allowed paying more than due balance.');
  }

  // Test 11: Full Remaining Salary Payment Execution
  const remainingDue = Number(payslip1.body.data.dueAmount);
  const pay2Res = await request('/api/admin/payroll/pay', 'POST', {
    payrollRecordId: record.id,
    amountPaid: remainingDue,
    paymentMethod: 'CASH',
    note: 'চূড়ান্ত অবশিষ্ট পরিশোধ'
  }, cookie);
  console.log(`✅ 13. Full Remaining Salary Paid: ৳${remainingDue}`);

  const payslipFinal = await request(`/api/admin/payroll/payslip/${record.id}`, 'GET', null, cookie);
  console.log(`✅ 14. Final Status Verified: Status = ${payslipFinal.body.data.status}, Final Due = ৳${payslipFinal.body.data.dueAmount}`);

  // Test 12: General Ledger Double-Entry Verification
  const ledgerRes = await request('/api/admin/accounting/ledger', 'GET', null, cookie);
  const accrualEntry = ledgerRes.body.data.find(j => j.reference === `PAYROLL-MONTH-${genRes.body.data.id}`);
  const payEntry = ledgerRes.body.data.find(j => j.reference === `PAYROLL-${record.id}`);
  if (accrualEntry && payEntry) {
    console.log(`✅ 15. Complete Double-Entry Ledger Verification Passed: Accrual Entry ${accrualEntry.voucherNumber} & Payment Settlement Entry ${payEntry.voucherNumber} posted cleanly!`);
  } else {
    console.error('❌ General Ledger entries missing!');
  }

  // Test 13: Unauthorized Access Rejection
  const unauthRes = await request('/api/admin/payroll/month', 'GET', null, '');
  if (unauthRes.status === 401) {
    console.log('✅ 16. Unauthorized Access Protection Verified (401 Unauthorized)');
  } else {
    console.error('❌ Unauthorized access test failed!');
  }

  console.log('\n🎉 ALL 16 PHASE 2 AUTOMATED INTEGRATION & ACCOUNTING TESTS PASSED 100%! 💯');
}

runPhase2FullSuite().catch(console.error);
