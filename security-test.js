const http = require('http');

function token(role, userId) {
  const payload = { role, userId: userId || role, iat: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString('base64url') + '.demo';
}

function request(url, tokenVal) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const headers = { 'Content-Type': 'application/json' };
    if (tokenVal) headers['Authorization'] = 'Bearer ' + tokenVal;

    http.get({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname + parsed.search,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data
        });
      });
    }).on('error', (e) => {
      resolve({
        status: 'ERROR',
        body: e.message
      });
    });
  });
}

async function check(name, url, expectedStatus, tokenVal) {
  const result = await request(url, tokenVal);
  if (result.status === expectedStatus) {
    console.log(`✅ ${name} returned ${expectedStatus}`);
  } else {
    console.log(`❌ ${name} expected ${expectedStatus}, got ${result.status}`);
    console.log(`   Body: ${result.body}`);
  }
}

async function main() {
  console.log('Starting security verification tests...');

  const studentToken = token('student', 'S-001');
  const teacherToken = token('teacher', 'T-001');
  const adminToken = token('admin', 'A-001');

  await check(
    'No token /api/students',
    'http://localhost:3001/api/students',
    401
  );

  await check(
    'No token /api/finance/transactions',
    'http://localhost:3001/api/finance/transactions',
    401
  );

  await check(
    'Student role /api/students',
    'http://localhost:3001/api/students',
    403,
    studentToken
  );

  await check(
    'Student role /api/finance/transactions',
    'http://localhost:3001/api/finance/transactions',
    403,
    studentToken
  );

  await check(
    'Teacher role /api/finance/transactions',
    'http://localhost:3001/api/finance/transactions',
    403,
    teacherToken
  );

  await check(
    'Admin role /api/students',
    'http://localhost:3001/api/students',
    200,
    adminToken
  );

  await check(
    'Admin role /api/finance/transactions',
    'http://localhost:3001/api/finance/transactions',
    200,
    adminToken
  );
}

main();
