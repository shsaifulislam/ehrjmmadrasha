const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { institution } = require('./config/settings');
const db = require('./services/fileDb');

// --- ENV ---
try { require('dotenv').config(); } catch(e) {
  // dotenv optional — read .env manually if missing
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const [k, ...v] = line.split('=');
      if (k && k.trim() && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
    });
  }
}

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';
const root = path.join(__dirname, '..');
const dist = path.join(root, 'frontend', 'dist');

// --- HELPERS ---
function send(res, code, data, type = 'application/json; charset=utf-8') {
  res.writeHead(code, {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'no-referrer-when-downgrade'
  });
  res.end(type.includes('json') ? JSON.stringify(data) : data);
}

function body(req) {
  return new Promise(resolve => {
    let b = '';
    req.on('data', c => b += c);
    req.on('end', () => {
      try { resolve(b ? JSON.parse(b) : {}); }
      catch(e) { resolve({}); }
    });
  });
}

// --- PASSWORD HASHING UTILS ---
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Automatically seed users in db.json if they don't exist
function seedUsersIfNeeded() {
  try {
    const data = db.readDb();
    if (!data.users || data.users.length === 0) {
      data.users = [
        {
          username: 'admin',
          passwordHash: hashPassword('admin123'),
          role: 'admin',
          userId: 'admin'
        },
        {
          username: 'teacher',
          passwordHash: hashPassword('teacher123'),
          role: 'teacher',
          userId: 'T-001'
        },
        {
          username: 'student',
          passwordHash: hashPassword('student123'),
          role: 'student',
          userId: 'S-001'
        }
      ];
      db.writeDb(data);
    }
  } catch (e) {
    console.error('Error seeding users:', e);
  }
}
seedUsersIfNeeded();

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const pay = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${pay}`).digest('base64url');
  return `${header}.${pay}.${signature}`;
}

function verifyToken(tokenStr) {
  if (!tokenStr) return null;
  const parts = tokenStr.split('.');
  if (parts.length === 3) {
    const [header, pay, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${pay}`).digest('base64url');
    if (signature === expectedSig) {
      try {
        return JSON.parse(Buffer.from(pay, 'base64url').toString());
      } catch(e) {
        return null;
      }
    }
  }
  // Fallback for .demo tokens (non-production only)
  if (process.env.NODE_ENV !== 'production' && tokenStr.endsWith('.demo')) {
    try {
      const payloadB64 = tokenStr.split('.')[0];
      return JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    } catch(e) {
      return null;
    }
  }
  return null;
}

function token(role, userId) {
  return signToken({ role, userId: userId || role });
}

function parseToken(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  return verifyToken(h.slice(7));
}

function roleFrom(req) {
  const t = parseToken(req);
  return t ? t.role : null;
}

function need(req, res, roles) {
  const t = parseToken(req);
  if (!t) { send(res, 401, { error: 'No token — টোকেন দেওয়া হয়নি' }); return false; }
  if (!roles.includes(t.role)) { send(res, 403, { error: 'Wrong role — এই কাজের অনুমতি নেই' }); return false; }
  return true;
}

function genId(prefix) {
  return prefix + '-' + crypto.randomUUID().slice(0, 8);
}

function money(n) {
  return (n || 0);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseUrl(url) {
  const [pathname, qs] = url.split('?');
  const params = {};
  if (qs) qs.split('&').forEach(p => {
    const [k, v] = p.split('=');
    params[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return { pathname, params };
}

// --- STATIC FILE SERVING ---
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf'
};

// Route map: clean URL → file in dist
const routeMap = {
  '/': 'index.html',
  '/about': 'about.html',
  '/departments': 'departments.html',
  '/admission': 'admission.html',
  '/results': 'results.html',
  '/notices': 'notices.html',
  '/gallery': 'gallery.html',
  '/downloads': 'downloads.html',
  '/donation': 'donation.html',
  '/contact': 'contact.html',
  '/faq': 'faq.html',
  '/privacy': 'privacy.html',
  // Admin
  '/admin/dashboard': 'admin/dashboard.html',
  '/admin/students': 'admin/students.html',
  '/admin/teachers': 'admin/teachers.html',
  '/admin/guardians': 'admin/guardians.html',
  '/admin/staff': 'admin/staff.html',
  '/admin/admissions': 'admin/admissions.html',
  '/admin/classes': 'admin/classes.html',
  '/admin/departments': 'admin/departments.html',
  '/admin/sessions': 'admin/sessions.html',
  '/admin/attendance': 'admin/attendance.html',
  '/admin/results': 'admin/results.html',
  '/admin/notices': 'admin/notices.html',
  '/admin/gallery': 'admin/gallery.html',
  '/admin/downloads': 'admin/downloads.html',
  '/admin/finance': 'admin/finance.html',
  '/admin/donations': 'admin/donations.html',
  '/admin/expenses': 'admin/expenses.html',
  '/admin/ledger': 'admin/ledger.html',
  '/admin/receipts': 'admin/receipts.html',
  '/admin/reports': 'admin/reports.html',
  '/admin/analytics': 'admin/analytics.html',
  '/admin/id-cards': 'admin/id-cards.html',
  '/admin/certificates': 'admin/certificates.html',
  '/admin/documents': 'admin/documents.html',
  '/admin/settings': 'admin/settings.html',
  '/admin/theme-branding': 'admin/theme-branding.html',
  '/admin/whatsapp-help': 'admin/whatsapp-help.html',
  '/admin/ai-assistant': 'admin/ai-assistant.html',
  '/admin/roles-permissions': 'admin/roles-permissions.html',
  '/admin/activity-log': 'admin/activity-log.html',
  '/admin/backup-restore': 'admin/backup-restore.html',
  '/admin/control-center': 'admin/control-center.html',
  '/admin/data-entry': 'admin/data-entry.html',
  // Student
  '/student/dashboard': 'student/dashboard.html',
  '/student/profile': 'student/profile.html',
  '/student/attendance': 'student/attendance.html',
  '/student/routine': 'student/routine.html',
  '/student/results': 'student/results.html',
  '/student/fees': 'student/fees.html',
  '/student/receipts': 'student/receipts.html',
  '/student/notices': 'student/notices.html',
  '/student/downloads': 'student/downloads.html',
  '/student/id-card': 'student/id-card.html',
  '/student/support': 'student/support.html',
  // Teacher
  '/teacher/dashboard': 'teacher/dashboard.html',
  '/teacher/assigned-classes': 'teacher/assigned-classes.html',
  '/teacher/routine': 'teacher/routine.html',
  '/teacher/attendance-entry': 'teacher/attendance-entry.html',
  '/teacher/attendance': 'teacher/attendance-entry.html',
  '/teacher/marks-entry': 'teacher/marks-entry.html',
  '/teacher/students': 'teacher/students.html',
  '/teacher/notices': 'teacher/notices.html',
  '/teacher/performance': 'teacher/performance.html'
};

function serveFile(filePath, res) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  const ext = path.extname(filePath).toLowerCase();
  const type = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function servePage(url, res) {
  const { pathname } = parseUrl(url);

  // 1. Route map
  if (routeMap[pathname]) {
    const f = path.join(dist, routeMap[pathname]);
    if (serveFile(f, res)) return true;
  }

  // 2. Direct file in dist
  const clean = path.normalize(pathname).replace(/^([.][.][\\/])+/, '').replace(/^[\\/]+/, '');
  const candidates = [
    path.join(dist, clean),
    path.join(root, clean),
    path.join(dist, clean + '.html')
  ];
  for (const f of candidates) {
    if (serveFile(f, res)) return true;
  }

  return false;
}

// --- RATE LIMITER ---
const ipLimits = {};
setInterval(() => {
  for (const ip in ipLimits) delete ipLimits[ip];
}, 60000);

function checkRateLimit(req, res) {
  const ip = req.socket.remoteAddress || 'unknown';
  ipLimits[ip] = (ipLimits[ip] || 0) + 1;
  if (ipLimits[ip] > 180) {
    send(res, 429, { error: 'Too many requests — অনুগ্রহ করে একটু অপেক্ষা করুন' });
    return false;
  }
  return true;
}

// ==========================================
// API ROUTER
// ==========================================
const server = http.createServer(async (req, res) => {
  if (!checkRateLimit(req, res)) return;
  const { pathname, params } = parseUrl(req.url);
  const method = req.method;

  // --- HEALTH ---
  if (pathname === '/health' || pathname === '/api/health') {
    return send(res, 200, {
      ok: true,
      status: 'healthy',
      service: 'EHRJ Madrasha ERP',
      institution: 'ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা',
      time: new Date().toISOString(),
      uptime: process.uptime()
    });
  }

  // --- AUTH ---
  if (pathname === '/api/login' && method === 'POST') {
    const b = await body(req);
    const username = b.username || b.role || 'admin';
    const password = b.password;
    
    let role = b.role || 'admin';
    let userId = b.userId || role;

    const data = db.readDb();
    const user = (data.users || []).find(u => u.username === username);

    if (password) {
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return send(res, 401, { error: 'Invalid username or password — ভুল ইউজারনেম বা পাসওয়ার্ড' });
      }
      role = user.role;
      userId = user.userId;
    } else {
      if (process.env.NODE_ENV === 'production') {
        return send(res, 401, { error: 'Password required in production environment — প্রোডাকশনে পাসওয়ার্ড প্রয়োজন' });
      }
      if (b.userId) {
        userId = b.userId;
        role = b.role || role;
      } else if (user) {
        role = user.role;
        userId = user.userId;
      }
    }

    db.addActivity('Login', `${role} login`, role);
    return send(res, 200, {
      token: token(role, userId),
      role,
      userId,
      message: password ? 'Logged in successfully with secure password — পাসওয়ার্ড দিয়ে লগইন সফল হয়েছে' : 'Demo login. Production এ real hashed password লাগবে.'
    });
  }

  // --- SETTINGS ---
  if (pathname === '/api/settings') {
    if (method === 'GET') {
      const s = db.readDb().settings || {};
      return send(res, 200, { institution, settings: s });
    }
    if (method === 'PUT' || method === 'POST') {
      if (!need(req, res, ['admin'])) return;
      const b = await body(req);
      const data = db.readDb();
      data.settings = { ...data.settings, ...b };
      db.writeDb(data);
      db.addActivity('Settings updated', JSON.stringify(Object.keys(b)));
      return send(res, 200, { success: true, settings: data.settings });
    }
  }

  // --- ADMIN DASHBOARD ---
  if (pathname === '/api/admin/dashboard') {
    if (!need(req, res, ['admin'])) return;
    const data = db.readDb();
    const txns = data.financeTransactions || [];
    const activeTxns = txns.filter(t => t.status !== 'voided');
    const totalIncome = activeTxns.filter(t => t.type === 'fee' || t.type === 'donation').reduce((s, t) => s + (t.amount || 0), 0);
    const totalExpense = activeTxns.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const totalDue = (data.students || []).reduce((s, st) => s + (st.due || 0), 0);
    return send(res, 200, {
      counts: {
        students: (data.students || []).length,
        teachers: (data.teachers || []).length,
        staff: (data.staff || []).length,
        notices: (data.notices || []).length,
        transactions: txns.length,
        donations: (data.donations || []).length,
        expenses: (data.expenses || []).length
      },
      finance: { totalIncome, totalExpense, totalDue, balance: totalIncome - totalExpense },
      recentActivity: (data.activityLog || []).slice(-10).reverse(),
      recentNotices: (data.notices || []).slice(-5).reverse()
    });
  }

  // --- STUDENTS ---
  if (pathname === '/api/students') {
    if (!need(req, res, ['admin', 'teacher'])) return;
    if (method === 'GET') {
      const q = params.q || '';
      const t = parseToken(req);
      let list = db.search('students', q).filter(s => !s.deleted);
      if (t && t.role === 'teacher') {
        const teacher = db.getCollection('teachers').find(tc => tc.id === t.userId);
        const assignedClasses = teacher ? (teacher.assignedClasses || []) : [];
        list = list.filter(s => assignedClasses.includes(s.classId));
      }
      return send(res, 200, list);
    }
    if (method === 'POST') {
      if (!need(req, res, ['admin'])) return;
      const b = await body(req);
      const item = db.add('students', { id: genId('S'), status: 'active', ...b });
      db.addActivity('Student added', `${item.name} (${item.id})`);
      return send(res, 201, item);
    }
  }

  if (pathname.startsWith('/api/students/') && pathname.split('/').length === 4) {
    const id = pathname.split('/')[3];
    if (method === 'GET') {
      if (!need(req, res, ['admin', 'teacher'])) return;
      const t = parseToken(req);
      const s = db.findById('students', id);
      if (!s || s.deleted) return send(res, 404, { error: 'Student not found' });
      if (t && t.role === 'teacher') {
        const teacher = db.getCollection('teachers').find(tc => tc.id === t.userId);
        const assignedClasses = teacher ? (teacher.assignedClasses || []) : [];
        if (!assignedClasses.includes(s.classId)) {
          return send(res, 403, { error: 'Wrong role — এই কাজের অনুমতি নেই' });
        }
      }
      return send(res, 200, s);
    }
    if (method === 'PUT') {
      if (!need(req, res, ['admin'])) return;
      const b = await body(req);
      const updated = db.update('students', id, b);
      if (!updated) return send(res, 404, { error: 'Student not found' });
      db.addActivity('Student updated', `${updated.name} (${id})`);
      return send(res, 200, updated);
    }
    if (method === 'DELETE') {
      if (!need(req, res, ['admin'])) return;
      const deleted = db.softDelete('students', id);
      if (!deleted) return send(res, 404, { error: 'Student not found' });
      db.addActivity('Student removed', id);
      return send(res, 200, { success: true });
    }
  }

  // --- GUARDIANS ---
  if (pathname === '/api/guardians') {
    if (!need(req, res, ['admin'])) return;
    if (method === 'GET') return send(res, 200, db.getCollection('guardians'));
    if (method === 'POST') {
      const b = await body(req);
      return send(res, 201, db.add('guardians', { id: genId('G'), ...b }));
    }
  }

  // --- TEACHERS ---
  if (pathname === '/api/teachers') {
    if (!need(req, res, ['admin'])) return;
    if (method === 'GET') return send(res, 200, db.getCollection('teachers').filter(t => !t.deleted));
    if (method === 'POST') {
      const b = await body(req);
      const item = db.add('teachers', { id: genId('T'), status: 'active', ...b });
      db.addActivity('Teacher added', `${item.name} (${item.id})`);
      return send(res, 201, item);
    }
  }

  // --- STAFF ---
  if (pathname === '/api/staff') {
    if (!need(req, res, ['admin'])) return;
    if (method === 'GET') return send(res, 200, db.getCollection('staff'));
    if (method === 'POST') {
      const b = await body(req);
      return send(res, 201, db.add('staff', { id: genId('ST'), status: 'active', ...b }));
    }
  }

  // --- CLASSES ---
  if (pathname === '/api/classes') {
    if (method === 'GET') return send(res, 200, db.getCollection('classes').filter(c => !c.deleted));
    if (method === 'POST') {
      if (!need(req, res, ['admin'])) return;
      const b = await body(req);
      return send(res, 201, db.add('classes', { id: genId('C'), ...b }));
    }
  }

  if (pathname.startsWith('/api/classes/') && pathname.split('/').length === 4) {
    const id = pathname.split('/')[3];
    if (method === 'GET') {
      const c = db.findById('classes', id);
      return c && !c.deleted ? send(res, 200, c) : send(res, 404, { error: 'Class not found' });
    }
    if (method === 'PUT') {
      if (!need(req, res, ['admin'])) return;
      const b = await body(req);
      const updated = db.update('classes', id, b);
      if (!updated) return send(res, 404, { error: 'Class not found' });
      db.addActivity('Class updated', `${updated.name} (${id})`);
      return send(res, 200, updated);
    }
    if (method === 'DELETE') {
      if (!need(req, res, ['admin'])) return;
      const deleted = db.softDelete('classes', id);
      if (!deleted) return send(res, 404, { error: 'Class not found' });
      db.addActivity('Class removed', id);
      return send(res, 200, { success: true });
    }
  }

  // --- DEPARTMENTS ---
  if (pathname === '/api/departments') {
    if (method === 'GET') return send(res, 200, db.getCollection('departments').filter(d => !d.deleted));
    if (method === 'POST') {
      if (!need(req, res, ['admin'])) return;
      const b = await body(req);
      return send(res, 201, db.add('departments', { id: genId('D'), ...b }));
    }
  }

  if (pathname.startsWith('/api/departments/') && pathname.split('/').length === 4) {
    const id = pathname.split('/')[3];
    if (method === 'GET') {
      const d = db.findById('departments', id);
      return d && !d.deleted ? send(res, 200, d) : send(res, 404, { error: 'Department not found' });
    }
    if (method === 'PUT') {
      if (!need(req, res, ['admin'])) return;
      const b = await body(req);
      const updated = db.update('departments', id, b);
      if (!updated) return send(res, 404, { error: 'Department not found' });
      db.addActivity('Department updated', `${updated.name} (${id})`);
      return send(res, 200, updated);
    }
    if (method === 'DELETE') {
      if (!need(req, res, ['admin'])) return;
      const deleted = db.softDelete('departments', id);
      if (!deleted) return send(res, 404, { error: 'Department not found' });
      db.addActivity('Department removed', id);
      return send(res, 200, { success: true });
    }
  }

  // --- SESSIONS ---
  if (pathname === '/api/sessions') {
    if (method === 'GET') return send(res, 200, db.getCollection('sessions').filter(s => !s.deleted));
    if (method === 'POST') {
      if (!need(req, res, ['admin'])) return;
      const b = await body(req);
      return send(res, 201, db.add('sessions', { id: genId('SES'), ...b }));
    }
  }

  if (pathname.startsWith('/api/sessions/') && pathname.split('/').length === 4) {
    const id = pathname.split('/')[3];
    if (method === 'GET') {
      const s = db.findById('sessions', id);
      return s && !s.deleted ? send(res, 200, s) : send(res, 404, { error: 'Session not found' });
    }
    if (method === 'PUT') {
      if (!need(req, res, ['admin'])) return;
      const b = await body(req);
      const updated = db.update('sessions', id, b);
      if (!updated) return send(res, 404, { error: 'Session not found' });
      db.addActivity('Session updated', `${updated.name} (${id})`);
      return send(res, 200, updated);
    }
    if (method === 'DELETE') {
      if (!need(req, res, ['admin'])) return;
      const deleted = db.softDelete('sessions', id);
      if (!deleted) return send(res, 404, { error: 'Session not found' });
      db.addActivity('Session removed', id);
      return send(res, 200, { success: true });
    }
  }

  // --- NOTICES ---
  if (pathname === '/api/notices') {
    if (method === 'GET') {
      return send(res, 200, db.getCollection('notices').filter(n => n.active !== false));
    }
    if (method === 'POST') {
      if (!need(req, res, ['admin'])) return;
      const b = await body(req);
      const item = db.add('notices', { id: genId('N'), date: today(), active: true, ...b });
      db.addActivity('Notice added', item.title);
      return send(res, 201, item);
    }
  }

  // --- GALLERY ---
  if (pathname === '/api/gallery') {
    if (method === 'GET') return send(res, 200, db.getCollection('gallery').filter(g => !g.deleted));
    if (method === 'POST') {
      if (!need(req, res, ['admin'])) return;
      const b = await body(req);
      const item = db.add('gallery', { id: genId('GAL'), ...b });
      db.addActivity('Gallery item added', item.title || 'Photo');
      return send(res, 201, item);
    }
  }

  if (pathname.startsWith('/api/gallery/') && pathname.split('/').length === 4) {
    const id = pathname.split('/')[3];
    if (method === 'DELETE') {
      if (!need(req, res, ['admin'])) return;
      const deleted = db.softDelete('gallery', id);
      if (!deleted) return send(res, 404, { error: 'Gallery item not found' });
      db.addActivity('Gallery item removed', id);
      return send(res, 200, { success: true });
    }
  }

  // --- DOWNLOADS ---
  if (pathname === '/api/downloads') {
    if (method === 'GET') return send(res, 200, db.getCollection('downloads').filter(d => !d.deleted));
    if (method === 'POST') {
      if (!need(req, res, ['admin'])) return;
      const b = await body(req);
      const item = db.add('downloads', { id: genId('DWN'), ...b });
      db.addActivity('Download file added', item.title || 'File');
      return send(res, 201, item);
    }
  }

  if (pathname.startsWith('/api/downloads/') && pathname.split('/').length === 4) {
    const id = pathname.split('/')[3];
    if (method === 'DELETE') {
      if (!need(req, res, ['admin'])) return;
      const deleted = db.softDelete('downloads', id);
      if (!deleted) return send(res, 404, { error: 'Download item not found' });
      db.addActivity('Download file removed', id);
      return send(res, 200, { success: true });
    }
  }

  // --- ATTENDANCE ---
  if (pathname === '/api/attendance') {
    if (method === 'GET') {
      if (!need(req, res, ['admin', 'teacher'])) return;
      const dateFilter = params.date || '';
      const classFilter = params.classId || '';
      let records = db.getCollection('attendance');
      if (dateFilter) records = records.filter(r => r.date === dateFilter);
      if (classFilter) records = records.filter(r => r.classId === classFilter);

      const t = parseToken(req);
      if (t && t.role === 'teacher') {
        const teacher = db.getCollection('teachers').find(tc => tc.id === t.userId);
        const assignedClasses = teacher ? (teacher.assignedClasses || []) : [];
        records = records.filter(r => assignedClasses.includes(r.classId));
      }
      return send(res, 200, records);
    }
    if (method === 'POST') {
      if (!need(req, res, ['admin', 'teacher'])) return;
      const b = await body(req);
      const t = parseToken(req);
      if (t && t.role === 'teacher') {
        const teacher = db.getCollection('teachers').find(tc => tc.id === t.userId);
        const assignedClasses = teacher ? (teacher.assignedClasses || []) : [];
        if (!assignedClasses.includes(b.classId)) {
          return send(res, 403, { error: 'Wrong role — এই কাজের অনুমতি নেই' });
        }
      }
      const item = db.add('attendance', { id: genId('ATT'), date: today(), ...b });
      db.addActivity('Attendance recorded', `${b.classId} - ${b.date || today()}`);
      return send(res, 201, item);
    }
  }

  // --- RESULTS ---
  if (pathname === '/api/results') {
    if (method === 'GET') {
      // Public can search by roll + class
      const roll = params.roll || '';
      const className = params.className || '';
      let results = db.getCollection('results');
      if (roll || className) {
        const students = db.getCollection('students');
        results = results.filter(r => {
          const st = students.find(s => s.id === r.studentId);
          if (!st) return false;
          if (roll && st.roll !== roll) return false;
          if (className && st.className !== className) return false;
          return true;
        });
      } else {
        // If listing all, must be authenticated as admin or teacher
        const t = parseToken(req);
        if (!t) {
          return send(res, 400, { error: 'roll and className are required for public search' });
        }
        if (t.role === 'teacher') {
          const teacher = db.getCollection('teachers').find(tc => tc.id === t.userId);
          const assignedClasses = teacher ? (teacher.assignedClasses || []) : [];
          const students = db.getCollection('students');
          results = results.filter(r => {
            const st = students.find(s => s.id === r.studentId);
            return st && assignedClasses.includes(st.classId);
          });
        } else if (t.role === 'student') {
          results = results.filter(r => r.studentId === t.userId);
        }
      }
      return send(res, 200, results);
    }
    if (method === 'POST') {
      if (!need(req, res, ['admin', 'teacher'])) return;
      const b = await body(req);
      const t = parseToken(req);
      if (t && t.role === 'teacher') {
        const teacher = db.getCollection('teachers').find(tc => tc.id === t.userId);
        const assignedClasses = teacher ? (teacher.assignedClasses || []) : [];
        const student = db.findById('students', b.studentId);
        if (!student || !assignedClasses.includes(student.classId)) {
          return send(res, 403, { error: 'Wrong role — এই কাজের অনুমতি নেই' });
        }
      }
      const item = db.add('results', { id: genId('R'), ...b });
      db.addActivity('Result added', `${b.studentId} - ${b.exam}`);
      return send(res, 201, item);
    }
  }

  // --- ADMISSIONS ---
  if (pathname === '/api/admissions') {
    if (!need(req, res, ['admin'])) return;
    if (method === 'GET') return send(res, 200, db.getCollection('admissions'));
    if (method === 'POST') {
      const b = await body(req);
      const item = db.add('admissions', { id: genId('ADM'), date: today(), status: 'pending', ...b });
      db.addActivity('Admission recorded', `${item.studentId}`);
      return send(res, 201, item);
    }
  }

  // --- DONATIONS ---
  if (pathname === '/api/donations') {
    if (!need(req, res, ['admin'])) return;
    if (method === 'GET') return send(res, 200, db.getCollection('donations'));
    if (method === 'POST') {
      const b = await body(req);
      const txnId = genId('TX');
      const donId = genId('DON');
      const rcpId = genId('RCP');
      // Create transaction
      db.add('financeTransactions', {
        id: txnId, type: 'donation', category: b.category || 'general',
        title: b.purpose || 'দান', amount: b.amount || 0,
        donorName: b.donorName || 'অজ্ঞাত দাতা',
        date: today(), status: 'offline-confirmed',
        recordedBy: 'admin', receiptId: rcpId
      });
      // Create receipt
      db.add('receipts', {
        id: rcpId, transactionId: txnId,
        donorName: b.donorName || 'অজ্ঞাত দাতা',
        amount: b.amount || 0, type: 'donation',
        title: b.purpose || 'দান', date: today(), printCount: 0
      });
      // Create donation record
      const don = db.add('donations', {
        id: donId, transactionId: txnId,
        donorName: b.donorName || 'অজ্ঞাত দাতা',
        amount: b.amount || 0, purpose: b.purpose || 'সাধারণ দান',
        date: today(), status: 'offline-confirmed'
      });
      db.addActivity('Donation received', `${b.donorName} - ${b.amount} টাকা`);
      return send(res, 201, don);
    }
  }

  // --- EXPENSES ---
  if (pathname === '/api/expenses') {
    if (!need(req, res, ['admin'])) return;
    if (method === 'GET') return send(res, 200, db.getCollection('expenses'));
    if (method === 'POST') {
      const b = await body(req);
      const txnId = genId('TX');
      const expId = genId('EXP');
      db.add('financeTransactions', {
        id: txnId, type: 'expense', category: b.category || 'other',
        title: b.title || 'খরচ', amount: b.amount || 0,
        date: today(), status: 'offline-confirmed',
        recordedBy: 'admin', note: b.note || ''
      });
      const exp = db.add('expenses', {
        id: expId, transactionId: txnId,
        title: b.title || 'খরচ', category: b.category || 'other',
        amount: b.amount || 0, date: today(),
        status: 'offline-confirmed', approvedBy: 'admin', note: b.note || ''
      });
      db.addActivity('Expense recorded', `${b.title} - ${b.amount} টাকা`);
      return send(res, 201, exp);
    }
  }

  // --- FINANCE: TRANSACTIONS ---
  if (pathname === '/api/finance/transactions') {
    if (!need(req, res, ['admin'])) return;
    const txns = db.getCollection('financeTransactions');
    if (method === 'GET') {
      const typeFilter = params.type || '';
      const statusFilter = params.status || '';
      let filtered = txns;
      if (typeFilter) filtered = filtered.filter(t => t.type === typeFilter);
      if (statusFilter) filtered = filtered.filter(t => t.status === statusFilter);
      return send(res, 200, filtered);
    }
  }

  // --- FINANCE: COLLECT FEE ---
  if (pathname === '/api/finance/collect-fee' && method === 'POST') {
    if (!need(req, res, ['admin'])) return;
    const b = await body(req);
    if (!b.studentId || !b.amount) {
      return send(res, 400, { error: 'studentId এবং amount দিতে হবে' });
    }
    const txnId = genId('TX');
    const rcpId = genId('RCP');
    const student = db.findById('students', b.studentId);
    const studentName = student ? student.name : b.studentName || 'Unknown';
    const className = student ? student.className : b.className || '';

    // Create transaction
    db.add('financeTransactions', {
      id: txnId, type: 'fee', category: b.category || 'monthly',
      title: b.title || 'মাসিক ফি', amount: b.amount,
      studentId: b.studentId, studentName,
      className, date: today(),
      month: b.month || '', status: 'offline-confirmed',
      recordedBy: 'admin', receiptId: rcpId
    });

    // Create receipt
    db.add('receipts', {
      id: rcpId, transactionId: txnId,
      studentId: b.studentId, studentName,
      amount: b.amount, type: 'fee',
      title: b.title || 'মাসিক ফি' + (b.month ? ' - ' + b.month : ''),
      date: today(), printCount: 0
    });

    // Update student due
    if (student) {
      const newDue = Math.max(0, (student.due || 0) - b.amount);
      db.update('students', b.studentId, { due: newDue });
    }

    db.addActivity('Fee collected', `${studentName} - ${b.amount} টাকা (${txnId})`);
    return send(res, 201, { transactionId: txnId, receiptId: rcpId, amount: b.amount, studentName });
  }

  // --- FINANCE: ADD DONATION (shortcut) ---
  if (pathname === '/api/finance/donation' && method === 'POST') {
    if (!need(req, res, ['admin'])) return;
    const b = await body(req);
    const txnId = genId('TX');
    const rcpId = genId('RCP');
    db.add('financeTransactions', {
      id: txnId, type: 'donation', category: b.category || 'general',
      title: b.purpose || 'দান', amount: b.amount || 0,
      donorName: b.donorName || 'অজ্ঞাত', date: today(),
      status: 'offline-confirmed', recordedBy: 'admin', receiptId: rcpId
    });
    db.add('receipts', {
      id: rcpId, transactionId: txnId,
      donorName: b.donorName || 'অজ্ঞাত',
      amount: b.amount || 0, type: 'donation',
      title: b.purpose || 'দান', date: today(), printCount: 0
    });
    db.addActivity('Donation recorded', `${b.donorName} - ${b.amount} টাকা`);
    return send(res, 201, { transactionId: txnId, receiptId: rcpId });
  }

  // --- FINANCE: ADD EXPENSE (shortcut) ---
  if (pathname === '/api/finance/expense' && method === 'POST') {
    if (!need(req, res, ['admin'])) return;
    const b = await body(req);
    const txnId = genId('TX');
    db.add('financeTransactions', {
      id: txnId, type: 'expense', category: b.category || 'other',
      title: b.title || 'খরচ', amount: b.amount || 0,
      date: today(), status: 'offline-confirmed',
      recordedBy: 'admin', note: b.note || ''
    });
    db.addActivity('Expense recorded', `${b.title} - ${b.amount} টাকা`);
    return send(res, 201, { transactionId: txnId });
  }

  // --- FINANCE: VOID ---
  if (pathname === '/api/finance/void' && method === 'POST') {
    if (!need(req, res, ['admin'])) return;
    const b = await body(req);
    if (!b.transactionId) return send(res, 400, { error: 'transactionId দিতে হবে' });
    const voided = db.voidTransaction(b.transactionId, b.reason || 'Admin voided');
    if (!voided) return send(res, 404, { error: 'Transaction not found' });
    db.addActivity('Transaction voided', `${b.transactionId} — ${b.reason || 'No reason'}`);
    return send(res, 200, voided);
  }

  // --- FINANCE: SUMMARY ---
  if (pathname === '/api/finance/summary') {
    if (!need(req, res, ['admin'])) return;
    const txns = db.getCollection('financeTransactions').filter(t => t.status !== 'voided');
    const totalFees = txns.filter(t => t.type === 'fee').reduce((s, t) => s + (t.amount || 0), 0);
    const totalDonations = txns.filter(t => t.type === 'donation').reduce((s, t) => s + (t.amount || 0), 0);
    const totalExpenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const totalDue = db.getCollection('students').reduce((s, st) => s + (st.due || 0), 0);

    // Monthly breakdown
    const monthly = {};
    txns.forEach(t => {
      const m = (t.date || '').slice(0, 7);
      if (!monthly[m]) monthly[m] = { income: 0, expense: 0 };
      if (t.type === 'expense') monthly[m].expense += t.amount || 0;
      else monthly[m].income += t.amount || 0;
    });

    // Class-wise due
    const students = db.getCollection('students');
    const classDue = {};
    students.forEach(s => {
      const cn = s.className || 'Unknown';
      classDue[cn] = (classDue[cn] || 0) + (s.due || 0);
    });

    return send(res, 200, {
      totalFees, totalDonations, totalExpenses,
      totalIncome: totalFees + totalDonations,
      totalDue, balance: totalFees + totalDonations - totalExpenses,
      monthly, classDue,
      transactionCount: txns.length
    });
  }

  // --- RECEIPTS ---
  if (pathname === '/api/receipts') {
    if (!need(req, res, ['admin'])) return;
    return send(res, 200, db.getCollection('receipts'));
  }

  if (pathname.startsWith('/api/finance/receipt/') && method === 'GET') {
    if (!need(req, res, ['admin', 'student'])) return;
    const id = pathname.split('/').pop();
    const receipt = db.findById('receipts', id);
    if (!receipt) return send(res, 404, { error: 'Receipt not found' });
    const t = parseToken(req);
    if (t && t.role === 'student' && receipt.studentId !== t.userId) {
      return send(res, 403, { error: 'Wrong role — এই কাজের অনুমতি নেই' });
    }
    // Update print count
    db.update('receipts', id, { printCount: (receipt.printCount || 0) + 1 });
    return send(res, 200, { ...receipt, institution });
  }

  // --- DOCUMENT: ID CARD PRINT LAYOUT ---
  if (pathname === '/api/documents/id-card' && method === 'GET') {
    const studentId = params.studentId;
    if (!studentId) return send(res, 400, { error: 'studentId required' });
    
    // Check authorization
    const t = parseToken(req);
    if (!t) return send(res, 401, { error: 'No token — টোকেন দেওয়া হয়নি' });
    if (t.role === 'student' && t.userId !== studentId) {
      return send(res, 403, { error: 'Wrong role — এই কাজের অনুমতি নেই' });
    }
    if (t.role === 'teacher') {
      const teacher = db.getCollection('teachers').find(tc => tc.id === t.userId);
      const assignedClasses = teacher ? (teacher.assignedClasses || []) : [];
      const student = db.findById('students', studentId);
      if (!student || !assignedClasses.includes(student.classId)) {
        return send(res, 403, { error: 'Wrong role — এই কাজের অনুমতি নেই' });
      }
    }
    
    const student = db.findById('students', studentId);
    if (!student) return send(res, 404, { error: 'Student not found' });
    
    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>আইডি কার্ড - ${student.name}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; margin: 0; padding: 20px; display: flex; justify-content: center; }
    .id-card {
      width: 320px; height: 480px; border: 4px solid #0F5C4D; border-radius: 12px; padding: 15px; box-sizing: border-box; position: relative; background: #FFF; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    }
    .id-card-header { border-bottom: 2px solid #C79A2B; padding-bottom: 8px; margin-bottom: 12px; }
    .id-card-header h3 { margin: 0; font-size: 13px; color: #0A3F36; }
    .id-card-header p { margin: 2px 0 0; font-size: 10px; color: #667874; }
    .id-card-title { background: #0F5C4D; color: #fff; padding: 4px 0; font-size: 14px; font-weight: bold; border-radius: 4px; margin-bottom: 15px; }
    .id-card-photo { width: 90px; height: 100px; border: 2px solid #D9E1DD; margin: 0 auto 12px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .id-card-photo img { width: 100%; height: 100%; object-fit: cover; }
    .id-card-details { text-align: left; font-size: 12px; line-height: 1.8; margin-bottom: 20px; padding: 0 10px; width: 100%; border-collapse: collapse; }
    .id-card-details tr td:first-child { font-weight: bold; color: #667874; width: 90px; }
    .id-card-footer { display: flex; justify-content: space-between; align-items: flex-end; position: absolute; bottom: 15px; left: 25px; right: 25px; font-size: 10px; }
    .id-card-sig { text-align: center; border-top: 1px solid #999; width: 90px; padding-top: 4px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="id-card">
    <div class="id-card-header">
      <h3>ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা</h3>
      <p>Eliotganj, Daudkandi, Comilla</p>
    </div>
    <div class="id-card-title">ছাত্র পরিচয়পত্র</div>
    <div class="id-card-photo">
      <img src="${student.photo || '/assets/img/logo.png'}" onerror="this.src='/assets/img/logo.png'">
    </div>
    <table class="id-card-details">
      <tr><td>নাম:</td><td>${student.name}</td></tr>
      <tr><td>আইডি নং:</td><td>${student.id}</td></tr>
      <tr><td>শ্রেণী:</td><td>${student.className || '-'}</td></tr>
      <tr><td>রোল নং:</td><td>${student.roll || '-'}</td></tr>
      <tr><td>অভিভাবক:</td><td>${student.guardian || '-'}</td></tr>
      <tr><td>ফোন:</td><td>${student.phone || '-'}</td></tr>
    </table>
    <div class="id-card-footer">
      <div class="id-card-sig">ছাত্রের স্বাক্ষর</div>
      <div class="id-card-sig" style="font-weight:bold;">অধ্যক্ষের স্বাক্ষর</div>
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
    `;
    return send(res, 200, html, 'text/html; charset=utf-8');
  }

  // --- DOCUMENT: RECEIPT PRINT LAYOUT ---
  if (pathname.startsWith('/api/documents/receipt/') && method === 'GET') {
    const id = pathname.split('/').pop();
    const receipt = db.findById('receipts', id);
    if (!receipt) return send(res, 404, { error: 'Receipt not found' });
    
    // Check authorization
    const t = parseToken(req);
    if (!t) return send(res, 401, { error: 'No token — টোকেন দেওয়া হয়নি' });
    if (t.role === 'student' && receipt.studentId !== t.userId) {
      return send(res, 403, { error: 'Wrong role — এই কাজের অনুমতি নেই' });
    }
    
    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>রসিদ - ${receipt.id}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; margin: 0; padding: 20px; display: flex; justify-content: center; }
    .receipt-box { width: 500px; padding: 20px; border: 2px solid #0F5C4D; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); position: relative; }
    .header { text-align: center; border-bottom: 2px solid #0F5C4D; padding-bottom: 10px; margin-bottom: 20px; }
    .header h2 { margin: 0; color: #0A3F36; font-size: 20px; }
    .header p { margin: 5px 0 0; font-size: 12px; color: #667874; }
    .title-badge { display: inline-block; background: #C79A2B; color: #fff; padding: 4px 12px; font-weight: bold; border-radius: 4px; font-size: 14px; margin-top: 10px; }
    .meta-info { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 20px; color: #444; }
    .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
    .receipt-table th, .receipt-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    .receipt-table th { background: #f0f5f4; color: #0A3F36; }
    .receipt-table td.amount { text-align: right; font-weight: bold; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; font-size: 12px; }
    .sig-line { text-align: center; border-top: 1px solid #999; width: 130px; padding-top: 5px; color: #555; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="header">
      <h2>ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা</h2>
      <p>Eliotganj, Daudkandi, Comilla | ফোন: 01845-162664</p>
      <div class="title-badge">টাকা প্রাপ্তি রসিদ</div>
    </div>
    <div class="meta-info">
      <div><b>রসিদ নং:</b> ${receipt.id}</div>
      <div><b>তারিখ:</b> ${receipt.date}</div>
    </div>
    <table class="receipt-table">
      <thead>
        <tr>
          <th>বিবরণ</th>
          <th style="text-align: right; width: 120px;">পরিমাণ</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            ${receipt.type === 'fee' ? '<b>শিক্ষार्थियों নাম:</b> ' + (receipt.studentName || '') + '<br>' + receipt.title : receipt.title}
          </td>
          <td class="amount">${receipt.amount} ৳</td>
        </tr>
        <tr style="background: #fcfcfc;">
          <td style="text-align: right; font-weight: bold; color: #0A3F36;">মোট আদায়:</td>
          <td class="amount" style="color: #0F5C4D;">${receipt.amount} ৳</td>
        </tr>
      </tbody>
    </table>
    <div class="footer">
      <div class="sig-line">আদায়কারীর স্বাক্ষর</div>
      <div class="sig-line" style="font-weight: bold; color: #0A3F36;">অধ্যক্ষের স্বাক্ষর</div>
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
    `;
    db.update('receipts', id, { printCount: (receipt.printCount || 0) + 1 });
    return send(res, 200, html, 'text/html; charset=utf-8');
  }

  // --- ACTIVITY LOG ---
  if (pathname === '/api/admin/activity-log') {
    if (!need(req, res, ['admin'])) return;
    const logs = db.getCollection('activityLog');
    return send(res, 200, logs.slice().reverse().slice(0, 100));
  }

  // --- BACKUP ---
  if (pathname === '/api/backup/logs') {
    if (!need(req, res, ['admin'])) return;
    return send(res, 200, db.getCollection('backupLog').slice().reverse().slice(0, 50));
  }

  if (pathname === '/api/backup') {
    if (!need(req, res, ['admin'])) return;
    if (method === 'GET') {
      const data = db.readDb();
      db.addActivity('Backup created', 'Manual backup');
      db.add('backupLog', { id: genId('BK'), date: today(), type: 'manual', status: 'success' });
      return send(res, 200, { createdAt: new Date().toISOString(), data });
    }
    if (method === 'POST') {
      const b = await body(req);
      if (!b.data || typeof b.data !== 'object') {
        return send(res, 400, { error: 'Invalid backup data — ভুল ব্যাকআপ ফাইল' });
      }
      db.writeDb(b.data);
      db.addActivity('System restored', 'From backup file');
      db.add('backupLog', { id: genId('BK'), date: today(), type: 'restore', status: 'success' });
      return send(res, 200, { success: true, message: 'Database restored successfully — ডাটাবেজ রিস্টোর সফল হয়েছে' });
    }
  }

  // --- AI CHAT ---
  if (pathname === '/api/ai/chat' && method === 'POST') {
    const b = await body(req);
    const q = (b.message || '').toLowerCase();
    const data = db.readDb();
    const students = data.students || [];
    const txns = (data.financeTransactions || []).filter(t => t.status !== 'voided');
    let answer = '';

    if (q.includes('ভর্তি') || q.includes('admission')) {
      answer = 'ভর্তি কার্যক্রম চলছে। যোগাযোগ: 01845-162664। অথবা WhatsApp এ মেসেজ করুন।';
    } else if (q.includes('ফি') || q.includes('fee') || q.includes('বেতন')) {
      answer = `নূরানী বিভাগ: ৬০০ টাকা/মাস। হিফজ বিভাগ: ৮০০ টাকা/মাস। কিতাব বিভাগ: ৭০০ টাকা/মাস।`;
    } else if (q.includes('বকেয়া') || q.includes('due')) {
      const totalDue = students.reduce((s, st) => s + (st.due || 0), 0);
      answer = `মোট বকেয়া: ${totalDue} টাকা। ${students.filter(s => s.due > 0).map(s => s.name + ': ' + s.due + ' টাকা').join(', ')}।`;
    } else if (q.includes('ফলাফল') || q.includes('result')) {
      answer = 'ফলাফল দেখতে ওয়েবসাইটের "ফলাফল" পেজে যান বা রোল নম্বর দিয়ে সার্চ করুন।';
    } else if (q.includes('নোটিশ') || q.includes('notice')) {
      const notices = (data.notices || []).slice(-3);
      answer = notices.map(n => `📌 ${n.title} (${n.date})`).join('\n') || 'কোনো নোটিশ নেই।';
    } else if (q.includes('দান') || q.includes('donation')) {
      const totalDon = txns.filter(t => t.type === 'donation').reduce((s, t) => s + t.amount, 0);
      answer = `মোট প্রাপ্ত দান: ${totalDon} টাকা। দান করতে মাদ্রাসা অফিসে যোগাযোগ করুন: 01845-162664।`;
    } else if (q.includes('খরচ') || q.includes('expense')) {
      const totalExp = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      answer = `মোট খরচ: ${totalExp} টাকা।`;
    } else if (q.includes('ছাত্র') || q.includes('student') || q.includes('মোট')) {
      answer = `মোট ছাত্র: ${students.length} জন।`;
    } else if (q.includes('আয়') || q.includes('income') || q.includes('মাসিক')) {
      const totalIncome = txns.filter(t => t.type !== 'expense').reduce((s, t) => s + t.amount, 0);
      answer = `মোট আয়: ${totalIncome} টাকা।`;
    } else if (q.includes('whatsapp') || q.includes('সাহায্য') || q.includes('help')) {
      answer = 'WhatsApp এ যোগাযোগ করুন: https://wa.me/8801845162664';
    } else {
      answer = 'আমি এই প্রশ্নের উত্তর দিতে পারছি না। অনুগ্রহ করে WhatsApp এ যোগাযোগ করুন: https://wa.me/8801845162664?text=আমি%20মাদ্রাসার%20ওয়েবসাইট%20থেকে%20সহায়তা%20চাই';
    }

    return send(res, 200, { answer, timestamp: new Date().toISOString() });
  }

  // --- STUDENT PORTAL APIs ---
  if (pathname === '/api/student/me') {
    if (!need(req, res, ['student', 'admin'])) return;
    const t = parseToken(req);
    if (!t || !t.userId) return send(res, 401, { error: 'Invalid token payload' });
    const student = db.findById('students', t.userId);
    if (!student) return send(res, 404, { error: 'Student profile not found' });
    return send(res, 200, student);
  }

  if (pathname === '/api/student/fees') {
    if (!need(req, res, ['student', 'admin'])) return;
    const t = parseToken(req);
    const sid = (t.role === 'admin' && params.studentId) ? params.studentId : t.userId;
    if (!sid) return send(res, 400, { error: 'studentId missing' });
    const txns = db.getCollection('financeTransactions').filter(tx => tx.studentId === sid && tx.type === 'fee' && tx.status !== 'voided');
    const student = db.findById('students', sid);
    return send(res, 200, { transactions: txns, due: student ? student.due : 0 });
  }

  if (pathname === '/api/student/receipts') {
    if (!need(req, res, ['student', 'admin'])) return;
    const t = parseToken(req);
    const sid = (t.role === 'admin' && params.studentId) ? params.studentId : t.userId;
    if (!sid) return send(res, 400, { error: 'studentId missing' });
    return send(res, 200, db.getCollection('receipts').filter(r => r.studentId === sid));
  }

  if (pathname === '/api/student/results') {
    if (!need(req, res, ['student', 'admin'])) return;
    const t = parseToken(req);
    const sid = (t.role === 'admin' && params.studentId) ? params.studentId : t.userId;
    if (!sid) return send(res, 400, { error: 'studentId missing' });
    return send(res, 200, db.getCollection('results').filter(r => r.studentId === sid));
  }

  if (pathname === '/api/student/attendance') {
    if (!need(req, res, ['student', 'admin'])) return;
    const t = parseToken(req);
    const sid = (t.role === 'admin' && params.studentId) ? params.studentId : t.userId;
    if (!sid) return send(res, 400, { error: 'studentId missing' });
    const student = db.findById('students', sid);
    if (!student) return send(res, 404, { error: 'Student not found' });
    const records = db.getCollection('attendance').filter(r => r.classId === student.classId);
    const studentAttendance = records.map(r => {
      const rec = r.records.find(x => x.studentId === sid);
      return {
        date: r.date,
        status: rec ? rec.status : 'N/A'
      };
    });
    return send(res, 200, studentAttendance);
  }

  // --- TEACHER PORTAL APIs ---
  if (pathname === '/api/teacher/me') {
    if (!need(req, res, ['teacher', 'admin'])) return;
    const t = parseToken(req);
    if (!t || !t.userId) return send(res, 401, { error: 'Invalid token payload' });
    const teacher = db.getCollection('teachers').find(tc => tc.id === t.userId);
    if (!teacher) return send(res, 404, { error: 'Teacher profile not found' });
    return send(res, 200, teacher);
  }

  if (pathname === '/api/teacher/students') {
    if (!need(req, res, ['teacher', 'admin'])) return;
    const t = parseToken(req);
    if (!t || !t.userId) return send(res, 401, { error: 'Invalid token payload' });
    const teacher = db.getCollection('teachers').find(tc => tc.id === t.userId);
    const assignedClasses = teacher ? (teacher.assignedClasses || []) : [];
    const students = db.getCollection('students').filter(s => assignedClasses.includes(s.classId));
    return send(res, 200, students);
  }

  // --- STATIC FILES ---
  if (servePage(req.url, res)) return;

  // --- 404 ---
  send(res, 404, { error: 'Not found — পেজ পাওয়া যায়নি' });
});

server.listen(PORT, HOST, () => {
  console.log(`✅ EHRJ Madrasha ERP running on http://${HOST}:${PORT}`);
  console.log(`   ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা`);
  console.log(`   Eliotganj Hazi Rohmatollah Jamiria Madrasha`);
  console.log(`   مدرسة إليوتغانج حاجي رحمة الله زميرية`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
