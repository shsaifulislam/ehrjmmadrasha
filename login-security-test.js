const http = require('http');

function post(url, data) {
return new Promise((resolve) => {
const parsed = new URL(url);
const postData = JSON.stringify(data);
const req = http.request({
hostname: parsed.hostname,
port: parsed.port || 80,
path: parsed.pathname,
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Content-Length': Buffer.byteLength(postData)
}
}, (res) => {
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
req.on('error', (e) => resolve({ status: 'ERROR', body: e.message }));
req.write(postData);
req.end();
});
}

function get(url, token) {
return new Promise((resolve) => {
const parsed = new URL(url);
const headers = { 'Content-Type': 'application/json' };
if (token) headers['Authorization'] = 'Bearer ' + token;
http.get({
hostname: parsed.hostname,
port: parsed.port || 80,
path: parsed.pathname + parsed.search,
headers
}, (res) => {
let body = '';
res.on('data', chunk => body += chunk);
res.on('end', () => {
try {
resolve({ status: res.statusCode, body: JSON.parse(body) });
} catch(e) {
resolve({ status: res.statusCode, body });
}
});
}).on('error', (e) => resolve({ status: 'ERROR', body: e.message }));
});
}

async function main() {
console.log('Testing secure login and API access...');

const loginFail = await post('http://localhost:3001/api/login', {
username: 'admin',
password: 'wrongpassword'
});
console.log(loginFail.status === 401
? '✅ Invalid password rejected with 401'
: `❌ Invalid password returned ${loginFail.status}`);

const loginAdmin = await post('http://localhost:3001/api/login', {
username: 'admin',
password: 'admin123'
});
console.log(loginAdmin.status === 200
? '✅ Admin password login successful'
: `❌ Admin password login returned ${loginAdmin.status}`);

const adminToken = loginAdmin.body && loginAdmin.body.token;
if (!adminToken) {
console.log('❌ Admin token missing. Stop test.');
return;
}
console.log(`   Admin Token: ${adminToken.slice(0, 30)}...`);

const fetchStudents = await get('http://localhost:3001/api/students', adminToken);
console.log(fetchStudents.status === 200
? '✅ Admin fetched students successfully'
: `❌ Admin fetch students returned ${fetchStudents.status}`);

const loginStudent = await post('http://localhost:3001/api/login', {
username: 'student',
password: 'student123'
});
console.log(loginStudent.status === 200
? '✅ Student password login successful'
: `❌ Student password login returned ${loginStudent.status}`);

const studentToken = loginStudent.body && loginStudent.body.token;
if (!studentToken) {
console.log('❌ Student token missing. Stop test.');
return;
}
console.log(`   Student Token: ${studentToken.slice(0, 30)}...`);

const fetchProfile = await get('http://localhost:3001/api/student/me', studentToken);
console.log(fetchProfile.status === 200 && fetchProfile.body.id === 'S-001'
? '✅ Student fetched own profile successfully'
: `❌ Student fetch profile returned ${fetchProfile.status}`);

const fetchAllStudents = await get('http://localhost:3001/api/students', studentToken);
console.log(fetchAllStudents.status === 403
? '✅ Student fetching all students rejected with 403'
: `❌ Student fetching all students returned ${fetchAllStudents.status}`);
}

main();
