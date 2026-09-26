const http = require('http');

const routes = [
  '/',
  '/about',
  '/academic',
  '/admission',
  '/notices',
  '/results',
  '/gallery',
  '/downloads',
  '/verify',
  '/contact',
  '/login',
  '/portal',
  '/teacher',
  '/principal',
  '/admin'
];

async function checkRoute(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      console.log(`[STATUS ${res.statusCode}] http://localhost:3000${path}`);
      resolve({ path, status: res.statusCode });
    }).on('error', (err) => {
      console.error(`[ERROR] http://localhost:3000${path} : ${err.message}`);
      resolve({ path, error: err.message });
    });
  });
}

async function run() {
  console.log("Checking all 15 EHRJ Digital Campus routes...");
  for (const r of routes) {
    await checkRoute(r);
  }
  console.log("Done checking routes.");
}

run();
