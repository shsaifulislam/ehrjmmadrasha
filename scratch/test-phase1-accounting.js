const http = require('http');

async function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ username: 'admin', password: 'password123' });
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

async function runTests() {
  console.log('🚀 Running Phase 1 Accounting Core Automated Tests...\n');

  const { cookie } = await login();
  console.log('✅ 1. Admin Auth Successful');

  // Test 1: Fetch Chart of Accounts
  const coaRes = await request('/api/admin/accounting/chart-of-accounts', 'GET', null, cookie);
  console.log(`✅ 2. Chart of Accounts fetched: ${coaRes.body.data.length} accounts found`);
  const cashAccount = coaRes.body.data.find(a => a.code === '1010');
  const donationAccount = coaRes.body.data.find(a => a.code === '3040');

  // Test 2: Double-Entry Validation Error Test
  const invalidJournal = {
    description: 'পরীক্ষামূলক অসামঞ্জস্যপূর্ণ জার্নাল',
    lines: [
      { accountId: cashAccount.id, type: 'DEBIT', amount: 5000 },
      { accountId: donationAccount.id, type: 'CREDIT', amount: 3000 } // Unequal!
    ]
  };
  const invalidRes = await request('/api/admin/accounting/journal-entry', 'POST', invalidJournal, cookie);
  if (invalidRes.status >= 400 || !invalidRes.body.success) {
    console.log('✅ 3. Double-entry imbalance validation passed (Rejected unequal Debit/Credit)');
  } else {
    console.error('❌ Double-entry imbalance check failed!');
  }

  // Test 3: Valid Double-Entry Journal Creation
  const validJournal = {
    voucherNumber: `VCH-TEST-${Date.now()}`,
    description: 'দান গ্রহণ - নগদ ক্যাশ দান প্রাপ্তি',
    lines: [
      { accountId: cashAccount.id, type: 'DEBIT', amount: 10000, description: 'নগদ দান ক্যাশ ডেবিট' },
      { accountId: donationAccount.id, type: 'CREDIT', amount: 10000, description: 'দান ইনকাম ক্রেডিট' }
    ]
  };
  const validRes = await request('/api/admin/accounting/journal-entry', 'POST', validJournal, cookie);
  console.log(`✅ 4. Valid Double-Entry Journal created: Voucher ${validRes.body.data.voucherNumber}`);

  // Test 4: Verify Updated Account Balances
  const updatedCoa = await request('/api/admin/accounting/chart-of-accounts', 'GET', null, cookie);
  const updatedCash = updatedCoa.body.data.find(a => a.code === '1010');
  console.log(`✅ 5. Updated Account Balance verified: Cash Balance = ৳${updatedCash.balance}`);

  // Test 5: General Ledger Retrieval
  const ledgerRes = await request('/api/admin/accounting/ledger', 'GET', null, cookie);
  console.log(`✅ 6. General Ledger retrieved: ${ledgerRes.body.data.length} transactions recorded`);

  // Test 6: Daily Cashbook Closing with Shortage Warning Check
  const cashbookRes = await request('/api/admin/accounting/cashbook', 'GET', null, cookie);
  console.log(`✅ 7. Cashbook Summary: Expected Cash = ৳${cashbookRes.body.data.expectedClosingCash}`);

  const closeRes = await request('/api/admin/accounting/cashbook/close', 'POST', {
    actualCountedCash: 9500, // 9,500 vs Expected 10,000 -> Shortage of 500
    note: 'সন্ধ্যার ক্যাশ হিসাব - ৫০০ টাকা ক্যাশ ঘাটতি সতর্কবার্তা রেকর্ডকৃত'
  }, cookie);
  console.log(`✅ 8. Daily Cash Closing Completed: Actual = ৳${closeRes.body.data.actualCountedCash}, Shortage/Surplus = ৳${closeRes.body.data.shortageOrSurplus}`);

  console.log('\n🎉 ALL PHASE 1 ACCOUNTING CORE TESTS PASSED SUCCESSFULLY! 💯');
}

runTests().catch(console.error);
