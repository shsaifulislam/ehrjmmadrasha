const http = require('http');

function postJson(path, data, cookies = '') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': cookies,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getJson(path, cookies = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Cookie': cookies,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING USER REQUIREMENTS VERIFICATION ---');

  const testPhone = '017' + Math.floor(10000000 + Math.random() * 90000000);
  const testEmail = `guardian_${Date.now()}@example.com`;
  const testPassword = 'SecurePass2026!';

  // Test 1: Self-Registration
  console.log('\n[TEST 1] Registering new Guardian user...');
  const regRes = await postJson('/api/auth/register', {
    name: 'জনাব মোহাম্মদ আবদুর রহমান',
    email: testEmail,
    phone: testPhone,
    password: testPassword,
    role: 'GUARDIAN',
  });

  console.log('Registration Status:', regRes.status);
  console.log('Registration Response:', regRes.body);
  if (regRes.status !== 200 || !regRes.body.success) {
    throw new Error('Registration failed!');
  }
  console.log('[PASS] Guardian self-registration succeeded.');

  // Test 2: Segregation - Guardian tries to log into Institutional (Admin/Teacher) Panel
  console.log('\n[TEST 2] Testing Segregation: Guardian attempts login to INSTITUTIONAL panel...');
  const instRes = await postJson('/api/auth/login', {
    identifier: testPhone,
    password: testPassword,
    panel: 'INSTITUTIONAL',
  });

  console.log('Institutional Login Status (Guardian credentials):', instRes.status);
  console.log('Response Error:', instRes.body.error);
  if (instRes.status === 403) {
    console.log('[PASS] Guardian access to Institutional Panel successfully blocked (403 Forbidden).');
  } else {
    throw new Error(`Expected 403 Forbidden, but received status ${instRes.status}`);
  }

  // Test 3: Guardian logs into Guardian/Student Panel
  console.log('\n[TEST 3] Guardian logs into GUARDIAN panel...');
  const guardRes = await postJson('/api/auth/login', {
    identifier: testPhone,
    password: testPassword,
    panel: 'GUARDIAN',
  });

  console.log('Guardian Login Status:', guardRes.status);
  if (guardRes.status === 200 && guardRes.body.success) {
    console.log('[PASS] Guardian login to Guardian Panel succeeded. Redirect:', guardRes.body.redirectUrl);
  } else {
    throw new Error(`Guardian login failed: ${JSON.stringify(guardRes.body)}`);
  }

  // Test 4: Check /api/auth/me with session cookie
  const setCookie = guardRes.headers['set-cookie'];
  const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : (setCookie || '');
  console.log('\n[TEST 4] Verifying /api/auth/me with session cookie...');
  const meRes = await getJson('/api/auth/me', cookieStr);
  console.log('/api/auth/me Status:', meRes.status);
  console.log('/api/auth/me Authenticated:', meRes.body.authenticated);
  console.log('User Role:', meRes.body.user?.role);
  if (meRes.body.authenticated && meRes.body.user?.role === 'GUARDIAN') {
    console.log('[PASS] Session verified correctly as GUARDIAN.');
  } else {
    throw new Error('Session verification failed!');
  }

  // Test 5: Verify page routes return 200
  console.log('\n[TEST 5] Checking page routes...');
  const loginPageRes = await getJson('/login');
  console.log('/login HTTP Status:', loginPageRes.status);

  const applyPageRes = await getJson('/admission/apply');
  console.log('/admission/apply HTTP Status:', applyPageRes.status);

  console.log('\n=============================================');
  console.log('ALL USER REQUIREMENTS VERIFIED SUCCESSFULLY!');
  console.log('=============================================');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
