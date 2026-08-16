const STORE_KEY = 'tyre-store';
const BLOB_PATH = 'tyre-store.json';

function fromParsed(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  return {
    users: parsed.users || [],
    categories: parsed.categories || [],
    businesses: parsed.businesses || [],
    deletedIds: parsed.deletedIds || [],
    deletedNames: parsed.deletedNames || [],
  };
}

function mongoUri() {
  const uri = String(process.env.MONGODB_URI || '').trim();
  if (!uri) return '';
  if (process.env.VERCEL && /localhost|127\.0\.0\.1/i.test(uri)) return '';
  return uri;
}

function hasRemoteStore() {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      process.env.BLOB_READ_WRITE_TOKEN ||
      mongoUri()
  );
}

async function readKv() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['GET', STORE_KEY]),
  });
  if (!res.ok) return null;
  const body = await res.json();
  if (!body.result) return null;
  return fromParsed(typeof body.result === 'string' ? JSON.parse(body.result) : body.result);
}

async function writeKv(db) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', STORE_KEY, JSON.stringify(db)]),
  });
  return res.ok;
}

async function readBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  let list;
  try {
    ({ list } = require('@vercel/blob'));
  } catch (err) {
    return null;
  }
  const { blobs } = await list({ prefix: BLOB_PATH, token });
  const match =
    blobs.find((item) => item.pathname === BLOB_PATH) ||
    blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
  if (!match) return null;
  const res = await fetch(match.url);
  if (!res.ok) return null;
  return fromParsed(await res.json());
}

async function writeBlob(db) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return false;
  let put;
  try {
    ({ put } = require('@vercel/blob'));
  } catch (err) {
    return false;
  }
  const payload = JSON.stringify(db);
  try {
    await put(BLOB_PATH, payload, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      token,
      contentType: 'application/json',
    });
    return true;
  } catch (err) {
    await put(BLOB_PATH, payload, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      token,
      contentType: 'application/json',
    });
    return true;
  }
}

let mongoModel = null;

async function getMongoModel() {
  const uri = mongoUri();
  if (!uri) return null;
  if (mongoModel) return mongoModel;
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
  mongoModel =
    mongoose.models.TyreStore ||
    mongoose.model(
      'TyreStore',
      new mongoose.Schema(
        {
          _id: { type: String, default: 'tyre' },
          users: Array,
          categories: Array,
          businesses: Array,
          updatedAt: Date,
        },
        { collection: 'tyre_store' }
      )
    );
  return mongoModel;
}

async function readMongo() {
  try {
    const Model = await getMongoModel();
    if (!Model) return null;
    const doc = await Model.findById('tyre').lean();
    return fromParsed(doc);
  } catch (err) {
    console.error('Mongo read failed:', err.message);
    return null;
  }
}

async function writeMongo(db) {
  try {
    const Model = await getMongoModel();
    if (!Model) return false;
    await Model.findByIdAndUpdate(
      'tyre',
      { ...db, updatedAt: new Date() },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.error('Mongo write failed:', err.message);
    return false;
  }
}

async function read() {
  return (await readKv()) || (await readBlob()) || (await readMongo()) || null;
}

async function write(db) {
  const payload = {
    users: db.users || [],
    categories: db.categories || [],
    businesses: db.businesses || [],
    deletedIds: db.deletedIds || [],
    deletedNames: db.deletedNames || [],
  };
  const results = await Promise.allSettled([
    writeKv(payload),
    writeBlob(payload),
    writeMongo(payload),
  ]);
  return results.some((item) => item.status === 'fulfilled' && item.value);
}

module.exports = { read, write, fromParsed, hasRemoteStore };
