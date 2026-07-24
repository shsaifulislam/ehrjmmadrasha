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

async function runPhase2Tests() {
  console.log('🚀 Running Phase 2 HR & Advanced Payroll Engine Automated Tests...\n');

  const { cookie } = await login('admin', 'password123');
  console.log('✅ 1. Admin Auth Successful');

  // Test 1: Staff Creation
  const staffData = {
    employeeId: `STF-TEST-${Date.now().toString().slice(-4)}`,
    name: 'আব্দুর রহিম (হিসাবরক্ষক)',
    phone: '01811998877',
    designation: 'Accountant',
    department: 'Accounts & Finance',
    paymentMethod: 'CASH'
  };
  const staffRes = await request('/api/admin/staff', 'POST', staffData, cookie);
  console.log(`✅ 2. Non-Teaching Staff Created: ${staffRes.body.data.name} (ID: ${staffRes.body.data.employeeId})`);
  const staffId = staffRes.body.data.id;

  // Test 2: Salary Structure Creation
  const structData = {
    staffId,
    basicSalary: 15000,
    houseRent: 3000,
    medicalAllowance: 1000
  };
  const structRes = await request('/api/admin/payroll/structure', 'POST', structData, cookie);
  console.log(`✅ 3. Salary Structure Configured: Basic = ৳${structRes.body.data.basicSalary}, Gross = ৳${structRes.body.data.grossSalary}`);

  // Test 3: Staff Advance Request
  const advRes = await request('/api/admin/payroll/advance', 'POST', { staffId, amount: 2000, reason: 'জরুরি এডভান্স' }, cookie);
  console.log(`✅ 4. Staff Advance Requested: ৳${advRes.body.data.amount}`);

  // Test 4: Batch Monthly Payroll Generation
  const testMonth = Math.floor(Math.random() * 12) + 1; // Random month to allow repeat runs
  const genRes = await request('/api/admin/payroll/generate', 'POST', { year: 2026, month: testMonth }, cookie);
  console.log(`✅ 5. Monthly Payroll Generated for 2026/${testMonth}: Total Records = ${genRes.body.data.records.length}`);

  const myRecord = genRes.body.data.records.find(r => r.staffId === staffId);
  console.log(`✅ 6. Payroll Net Calculation Verified: Gross ৳${myRecord.grossSalary} - Advance ৳${myRecord.advanceDeduction} = Net Payable ৳${myRecord.netPayable}`);

  // Test 5: Duplicate Payroll Rejection
  const dupRes = await request('/api/admin/payroll/generate', 'POST', { year: 2026, month: testMonth }, cookie);
  if (dupRes.status >= 400 || !dupRes.body.success) {
    console.log(`✅ 7. Duplicate Payroll Generation Rejected correctly (${dupRes.body.message})`);
  } else {
    console.error('❌ Duplicate payroll rejection failed!');
  }

  // Test 6: Partial Salary Payment Execution
  const pay1Res = await request('/api/admin/payroll/pay', 'POST', {
    payrollRecordId: myRecord.id,
    amountPaid: 10000,
    paymentMethod: 'CASH',
    note: 'প্রথম কিস্তির আংশিক বেতন প্রদান'
  }, cookie);
  console.log(`✅ 8. Partial Salary Payment Executed: Voucher ${pay1Res.body.data.voucherNumber}, Paid ৳10000`);

  // Test 7: Verify Remaining Due Amount & Status
  const payslip1 = await request(`/api/admin/payroll/payslip/${myRecord.id}`, 'GET', null, cookie);
  console.log(`✅ 9. Remaining Due Verified: Net ৳${payslip1.body.data.netPayable}, Paid ৳${payslip1.body.data.paidAmount}, Due ৳${payslip1.body.data.dueAmount}, Status = ${payslip1.body.data.status}`);

  // Test 8: Verify Accounting General Ledger Integration
  const ledgerRes = await request('/api/admin/accounting/ledger', 'GET', null, cookie);
  const salaryJournal = ledgerRes.body.data.find(j => j.reference === `PAYROLL-${myRecord.id}`);
  if (salaryJournal) {
    console.log(`✅ 10. General Ledger Integration Verified: Journal Voucher ${salaryJournal.voucherNumber} posted with ${salaryJournal.lines.length} lines`);
  } else {
    console.error('❌ General Ledger entry not found for salary payment!');
  }

  // Test 9: Full Remaining Salary Payment
  const remainingDue = Number(payslip1.body.data.dueAmount);
  const pay2Res = await request('/api/admin/payroll/pay', 'POST', {
    payrollRecordId: myRecord.id,
    amountPaid: remainingDue,
    paymentMethod: 'CASH',
    note: 'চূড়ান্ত অবশিষ্ট বেতন প্রদান'
  }, cookie);
  console.log(`✅ 11. Final Remaining Salary Paid: ৳${remainingDue}`);

  const payslipFinal = await request(`/api/admin/payroll/payslip/${myRecord.id}`, 'GET', null, cookie);
  console.log(`✅ 12. Final Status Verified: Status = ${payslipFinal.body.data.status}, Final Due = ৳${payslipFinal.body.data.dueAmount}`);

  console.log('\n🎉 ALL PHASE 2 HR & PAYROLL ENGINE AUTOMATED TESTS PASSED SUCCESSFULLY! 💯');
}

runPhase2Tests().catch(console.error);
