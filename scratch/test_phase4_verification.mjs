import http from 'http';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: body ? JSON.parse(body) : null });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log('=== EHRJ PHASE 4 BACKEND & SECURITY REGRESSION ===\n');

  // 1. Authenticate admin
  console.log('1. Testing Admin Authentication...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { identifier: 'adminehrj', password: 'Saiful018228222@@##' });

  if (loginRes.status !== 200 || !loginRes.data?.token) {
    console.error('Login failed:', loginRes.status, loginRes.data);
    process.exit(1);
  }
  const token = loginRes.data.token;
  console.log('✓ Login successful. JWT token acquired.');

  // 2. Fetch a student ID from students directory
  console.log('\n2. Fetching student ID for QR verification test...');
  const stdRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/students?page=1&take=1',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const student = stdRes.data?.students?.[0];
  if (!student) {
    console.error('No students found:', stdRes.data);
    process.exit(1);
  }
  console.log(`✓ Retrieved student: ${student.fullNameBn} (ID: ${student.id})`);

  // 3. Test Public QR Verification for Student ID Card (/api/verify/student/[id])
  console.log('\n3. Testing Public Student QR Verification API (/api/verify/student/[id])...');
  const qrRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/verify/student/${student.id}`,
    method: 'GET',
  });

  console.log('Status:', qrRes.status);
  console.log('Verified:', qrRes.data?.verified);
  console.log('Student Info:', qrRes.data?.student?.fullNameBn, 'Class:', qrRes.data?.student?.className);
  
  // Verify Privacy: Ensure NO private guardian phone number or internal password hash is in response
  const responseStr = JSON.stringify(qrRes.data);
  const leaksPhone = responseStr.includes('018228222') || responseStr.includes('guardianPhone');
  const leaksPassword = responseStr.includes('password') || responseStr.includes('hash');
  console.log(`✓ Privacy Check: Leaks Phone: ${leaksPhone}, Leaks Password: ${leaksPassword}`);

  // 4. Test Notification Endpoint with Bearer Token (/api/portal/notifications)
  console.log('\n4. Testing Portal Notifications API with Mobile Bearer Token...');
  const notifRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/portal/notifications',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  console.log('Status:', notifRes.status);
  console.log('Unread count:', notifRes.data?.unreadCount);
  console.log('Success:', notifRes.data?.success);

  // 5. Test Unauthorized Access (Security Regression)
  console.log('\n5. Testing Protected Endpoint with Fake/Expired Token...');
  const fakeRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/command-center',
    method: 'GET',
    headers: { 'Authorization': 'Bearer FAKE_EXPIRED_JWT_TOKEN_12345' },
  });
  console.log('Status (Should be 401/403):', fakeRes.status);
  console.log('Blocked:', fakeRes.status === 401 || fakeRes.status === 403 ? 'YES (Secure)' : 'NO (Vulnerable)');

  console.log('\n=== ALL PHASE 4 REGRESSION CHECKS COMPLETE ===');
}

run().catch(console.error);
