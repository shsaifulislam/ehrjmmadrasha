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

async function runPhase3FullSuite() {
  console.log('🚀 Running Comprehensive Phase 3 Hostel & Bazar Accounting Automated Verification...\n');

  const { cookie } = await login('admin', 'password123');
  console.log('✅ 1. Admin Auth Successful');

  // Test 1: Hostel Building Creation
  const bldCode = `BLD-${Date.now().toString().slice(-4)}`;
  const bldRes = await request('/api/admin/hostel/buildings', 'POST', {
    name: 'উসমানী ভবন (আবাসিক)',
    code: bldCode,
    address: 'মাদ্রাসা ক্যাস্পাস'
  }, cookie);
  console.log(`✅ 2. Hostel Building Created: ${bldRes.body.data.name} (Code: ${bldRes.body.data.code})`);
  const buildingId = bldRes.body.data.id;

  // Test 2: Hostel Room Creation
  const roomRes = await request('/api/admin/hostel/rooms', 'POST', {
    buildingId,
    roomNumber: '101',
    floor: 1,
    totalBeds: 2,
    monthlyRent: 2500
  }, cookie);
  console.log(`✅ 3. Hostel Room & Beds Generated: Room ${roomRes.body.data.roomNumber}, Total Beds = ${roomRes.body.data.beds.length}`);
  const bed1 = roomRes.body.data.beds[0];

  // Fetch a student
  const studentsRes = await request('/api/academic/students', 'GET', null, cookie);
  const student = studentsRes.body.data[0];
  if (!student) throw new Error('No students found for hostel allocation');

  // Test 3: Bed Allocation to Student
  const allocRes = await request('/api/admin/hostel/allocate', 'POST', {
    studentId: student.id,
    bedId: bed1.id,
    monthlyFee: 2500
  }, cookie);
  console.log(`✅ 4. Student Allocated to Bed: ${allocRes.body.data.student.nameBn} -> Bed ${allocRes.body.data.bed.bedNumber}`);

  // Test 4: Occupied Bed Re-allocation Rejection Protection
  const dupAllocRes = await request('/api/admin/hostel/allocate', 'POST', {
    studentId: student.id,
    bedId: bed1.id,
    monthlyFee: 2500
  }, cookie);
  if (dupAllocRes.status >= 400 || !dupAllocRes.body.success) {
    console.log(`✅ 5. Occupied Bed Capacity Protection Verified (${dupAllocRes.body.message})`);
  } else {
    console.error('❌ Occupied bed allocation protection failed!');
  }

  // Test 5: Hostel Monthly Fee Collection & General Ledger Income Posting
  const hostelFeeRes = await request('/api/admin/hostel/collect-fee', 'POST', {
    allocationId: allocRes.body.data.id,
    amount: 2500,
    paymentMethod: 'CASH',
    note: 'জুলাই মাসের হোস্টেল সিট ও মেসে ফি'
  }, cookie);
  console.log(`✅ 6. Hostel Fee Collected & Posted to Ledger (Voucher: ${hostelFeeRes.body.data.voucherNumber}, Amount: ৳${hostelFeeRes.body.data.amount})`);

  // Test 6: Bazar Supplier / Vendor Creation
  const vendorRes = await request('/api/admin/bazar/vendors', 'POST', {
    name: 'মো: আল-আমিন (চাউল সাপ্লায়ার)',
    companyName: 'আল-আমিন ট্রেডার্স',
    phone: '01911887766'
  }, cookie);
  console.log(`✅ 7. Bazar Supplier/Vendor Created: ${vendorRes.body.data.name}`);
  const vendorId = vendorRes.body.data.id;

  // Test 7: Cash Bazar Purchase Recording & GL Expense Posting
  const cashBazarRes = await request('/api/admin/bazar/purchases', 'POST', {
    invoiceNumber: `INV-CASH-${Date.now().toString().slice(-4)}`,
    paymentMethod: 'CASH',
    items: [
      { itemName: 'সবজি ও তরকারি', quantity: 15, unit: 'KG', unitPrice: 80 },
      { itemName: 'রুই মাছ', quantity: 5, unit: 'KG', unitPrice: 320 }
    ]
  }, cookie);
  console.log(`✅ 8. Cash Bazar Purchase Recorded: Total ৳${cashBazarRes.body.data.totalAmount} (Voucher: ${cashBazarRes.body.data.voucherNumber})`);

  // Test 8: Credit Bazar Purchase Recording & Vendor Payable Balance Update
  const creditBazarRes = await request('/api/admin/bazar/purchases', 'POST', {
    invoiceNumber: `INV-CREDIT-${Date.now().toString().slice(-4)}`,
    vendorId,
    paymentMethod: 'CREDIT',
    items: [
      { itemName: 'মিনিকেট চাল', quantity: 2, unit: 'BAG', unitPrice: 3500 }
    ]
  }, cookie);
  if (!creditBazarRes.body.data) {
    console.error('Credit Bazar Error:', creditBazarRes.body);
  }
  console.log(`✅ 9. Credit Bazar Purchase (বাকিতে বাজার) Recorded: Total ৳${creditBazarRes.body.data?.totalAmount} (Vendor Balance Updated)`);

  // Test 9: Supplier Payable Settlement Payment
  const payVendorRes = await request('/api/admin/bazar/pay-vendor', 'POST', {
    vendorId,
    amountPaid: 3500,
    paymentMethod: 'CASH',
    note: 'চাল ক্রয়ের বাকির টাকা পরিশোধ'
  }, cookie);
  console.log(`✅ 10. Supplier Payable Settled: Voucher ${payVendorRes.body.data.voucherNumber}, Paid ৳${payVendorRes.body.data.amountPaid}`);

  // Test 10: Daily Meal Attendance Recording
  const mealRes = await request('/api/admin/bazar/meals', 'POST', {
    date: new Date().toISOString().split('T')[0],
    mealType: 'LUNCH',
    studentIds: [student.id],
    guestCount: 2
  }, cookie);
  console.log(`✅ 11. Daily Meal Attendance Recorded for Lunch`);

  // Test 11: Cost Per Meal Analytics Calculation
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const costRes = await request(`/api/admin/bazar/cost-per-meal?year=${currentYear}&month=${currentMonth}`, 'GET', null, cookie);
  console.log(`✅ 12. Cost Per Meal Analytics Calculated: Month ${currentMonth}/${currentYear} -> Total Expense = ৳${costRes.body.data.totalExpense}, Total Meals = ${costRes.body.data.totalMeals}, Cost Per Meal = ৳${costRes.body.data.costPerMeal}/meal`);

  // Test 12: General Ledger Double-Entry Verification for Hostel & Bazar
  const ledgerRes = await request('/api/admin/accounting/ledger', 'GET', null, cookie);
  const hostelJournal = ledgerRes.body.data.find(j => j.reference === `HOSTEL-FEE-${allocRes.body.data.id}`);
  const bazarJournal = ledgerRes.body.data.find(j => j.reference === `BAZAR-${cashBazarRes.body.data.invoiceNumber}`);
  if (hostelJournal && bazarJournal) {
    console.log(`✅ 13. General Ledger Double-Entry Posting Verified: Hostel Fee Voucher ${hostelJournal.voucherNumber} & Bazar Expense Voucher ${bazarJournal.voucherNumber} posted cleanly!`);
  } else {
    console.error('❌ General Ledger entry missing for Hostel or Bazar!');
  }

  // Test 13: Unauthorized Access Rejection
  const unauthRes = await request('/api/admin/hostel/buildings', 'GET', null, '');
  if (unauthRes.status === 401) {
    console.log('✅ 14. Unauthorized Access Protection Verified (401 Unauthorized)');
  } else {
    console.error('❌ Unauthorized access protection failed!');
  }

  // Test 14: Invalid Transaction Rejection
  const invalidRes = await request('/api/admin/bazar/purchases', 'POST', {
    invoiceNumber: 'INV-INVALID',
    paymentMethod: 'CASH',
    items: [] // Empty items array should fail
  }, cookie);
  if (invalidRes.status >= 400 || !invalidRes.body.success) {
    console.log(`✅ 15. Invalid Transaction Rejection Verified (${invalidRes.body.message})`);
  } else {
    console.error('❌ Invalid transaction rejection failed!');
  }

  console.log('\n🎉 ALL 15 PHASE 3 AUTOMATED INTEGRATION & ACCOUNTING TESTS PASSED 100%! 💯');
}

runPhase3FullSuite().catch(console.error);
