const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../../database/db.json');

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    return {};
  }
}

function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

function getCollection(name) {
  const db = readDb();
  return db[name] || [];
}

function add(collection, item) {
  const db = readDb();
  db[collection] = db[collection] || [];
  item.createdAt = item.createdAt || new Date().toISOString();
  db[collection].push(item);
  writeDb(db);
  return item;
}

function findById(collection, id) {
  const items = getCollection(collection);
  return items.find(x => x.id === id) || null;
}

function findByField(collection, field, value) {
  const items = getCollection(collection);
  return items.filter(x => x[field] === value);
}

function update(collection, id, updates) {
  const db = readDb();
  db[collection] = db[collection] || [];
  const idx = db[collection].findIndex(x => x.id === id);
  if (idx === -1) return null;
  db[collection][idx] = { ...db[collection][idx], ...updates, updatedAt: new Date().toISOString() };
  writeDb(db);
  return db[collection][idx];
}

function softDelete(collection, id) {
  return update(collection, id, { deleted: true, deletedAt: new Date().toISOString() });
}

function voidTransaction(id, reason) {
  const db = readDb();
  const txns = db.financeTransactions || db.transactions || [];
  const idx = txns.findIndex(x => x.id === id);
  if (idx === -1) return null;
  txns[idx].status = 'voided';
  txns[idx].voidedAt = new Date().toISOString();
  txns[idx].voidReason = reason || 'Voided by admin';
  if (db.financeTransactions) db.financeTransactions = txns;
  else db.transactions = txns;
  writeDb(db);
  return txns[idx];
}

function search(collection, query) {
  if (!query) return getCollection(collection);
  const q = query.toLowerCase();
  return getCollection(collection).filter(item => {
    return Object.values(item).some(v =>
      typeof v === 'string' && v.toLowerCase().includes(q)
    );
  });
}

function addActivity(action, details, user) {
  add('activityLog', {
    id: 'ACT-' + Date.now(),
    action,
    details: details || '',
    user: user || 'admin',
    timestamp: new Date().toISOString()
  });
}

module.exports = { readDb, writeDb, getCollection, add, findById, findByField, update, softDelete, voidTransaction, search, addActivity };
