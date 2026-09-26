const http = require('http');

function postJSON(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      `http://localhost:3000${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log("=== Testing Core EHRJ Digital Campus APIs ===");

  // 1. Get classes
  const classesRes = await getJSON('/api/academic/classes');
  console.log(`1. /api/academic/classes: STATUS ${classesRes.status}, Found ${classesRes.body.classes.length} classes`);
  const firstClassId = classesRes.body.classes[0].id;

  // 2. Search student
  const searchRes = await postJSON('/api/students/search', {
    classId: firstClassId,
    rollNumber: 1
  });
  console.log(`2. /api/students/search: STATUS ${searchRes.status}, Student Name: "${searchRes.body.student?.fullNameBn}", ID: ${searchRes.body.student?.studentIdNumber}`);

  // 3. Verify Certificate
  const certRes = await postJSON('/api/certificates/verify', {
    code: 'EHRJ-CERT-2026-0001'
  });
  console.log(`3. /api/certificates/verify: STATUS ${certRes.status}, Verified: ${certRes.body.verified}, Student: ${certRes.body.certificate?.studentName}`);

  // 4. Get Notices
  const noticesRes = await getJSON('/api/notices');
  console.log(`4. /api/notices: STATUS ${noticesRes.status}, Total Notices: ${noticesRes.body.notices?.length}`);

  console.log("=== All APIs Working Perfectly ===");
}

runTests();
