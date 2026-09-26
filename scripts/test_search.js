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

async function run() {
  const byId = await postJSON('/api/students/search', { rollOrId: 'EHRJ-2026-0001' });
  console.log("Search by Student ID result:", byId.status, byId.body.student?.fullNameBn, "Class:", byId.body.student?.enrollment?.className);

  const byRoll = await postJSON('/api/students/search', {
    classId: byId.body.student?.enrollment?.classId,
    rollNumber: 1
  });
  console.log("Search by Class + Roll result:", byRoll.status, byRoll.body.student?.fullNameBn);
}

run();
