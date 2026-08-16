const path = require('path');

const STORE_KEY = 'tyre-store';
const BLOB_PATH = 'tyre-store.json';
const GITHUB_STORE_PATH = 'backend/data/store.json';
const GITHUB_MEDIA_DIR = 'backend/data/media';

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

function hasMongo() {
  return Boolean(mongoUri());
}

const DATA_BRANCH = 'tyre-data';

let dataBranchCache = '';
let lastGithubError = '';

function githubToken() {
  return String(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

function githubRepo() {
  const explicit = String(process.env.GITHUB_REPO || '').trim();
  if (explicit) return explicit.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const name = process.env.VERCEL_GIT_REPO_SLUG;
  if (owner && name) return `${owner}/${name}`;
  return '';
}

function hasGitHub() {
  return Boolean(githubToken() && githubRepo());
}

function hasRemoteStore() {
  return Boolean(
    hasGitHub() ||
      (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      process.env.BLOB_READ_WRITE_TOKEN ||
      hasMongo()
  );
}

function encodeGithubPath(filePath) {
  return String(filePath)
    .split('/')
    .map(encodeURIComponent)
    .join('/');
}

async function githubRequest(pathname, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.github.com/repos/${githubRepo()}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${githubToken()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'tyre-site',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (err) {
    json = null;
  }
  return { ok: res.ok, status: res.status, json };
}

function githubWriteError(result) {
  const detail = result?.json?.message || `GitHub write failed (${result?.status || '?'})`;
  lastGithubError = detail;
  if (result?.status === 401) {
    return 'GitHub token is invalid. Create a new classic token with the repo box checked, replace GITHUB_TOKEN in Vercel, then redeploy.';
  }
  if (result?.status === 403) {
    return 'GitHub token cannot write to the repo. Create a classic token at github.com/settings/tokens, check the repo box, replace GITHUB_TOKEN in Vercel, then redeploy.';
  }
  if (result?.status === 404) {
    return 'GitHub repo not found. Add GITHUB_REPO as hadialghoul/tyre in Vercel, then redeploy.';
  }
  return detail;
}

async function ensureDataBranch() {
  const wanted = String(process.env.GITHUB_BRANCH || DATA_BRANCH).trim() || DATA_BRANCH;
  if (dataBranchCache === wanted) return wanted;
  const existing = await githubRequest(`/git/ref/heads/${encodeURIComponent(wanted)}`);
  if (existing.ok) {
    dataBranchCache = wanted;
    return wanted;
  }
  const repoInfo = await githubRequest('');
  const base = repoInfo.json?.default_branch || 'main';
  const baseRef = await githubRequest(`/git/ref/heads/${encodeURIComponent(base)}`);
  if (!baseRef.ok) {
    throw new Error(githubWriteError(baseRef));
  }
  const created = await githubRequest('/git/refs', {
    method: 'POST',
    body: { ref: `refs/heads/${wanted}`, sha: baseRef.json.object.sha },
  });
  if (!created.ok && created.status !== 422) {
    throw new Error(githubWriteError(created));
  }
  dataBranchCache = wanted;
  return wanted;
}

async function githubGetFileOnBranch(filePath, branch) {
  const { ok, status, json } = await githubRequest(
    `/contents/${encodeGithubPath(filePath)}?ref=${encodeURIComponent(branch)}`
  );
  if (status === 404) return null;
  if (!ok) throw new Error(json?.message || 'GitHub read failed');
  if (json.encoding === 'base64' && json.content) {
    return {
      sha: json.sha,
      buffer: Buffer.from(String(json.content).replace(/\n/g, ''), 'base64'),
      branch,
    };
  }
  if (json.download_url) {
    const res = await fetch(json.download_url, {
      headers: {
        Authorization: `Bearer ${githubToken()}`,
        'User-Agent': 'tyre-site',
      },
    });
    if (!res.ok) throw new Error('GitHub download failed');
    return { sha: json.sha, buffer: Buffer.from(await res.arrayBuffer()), branch };
  }
  return null;
}

async function githubGetFile(filePath) {
  const branches = [...new Set([process.env.GITHUB_BRANCH || DATA_BRANCH, 'main', 'master'])];
  let lastError = null;
  for (const branch of branches) {
    try {
      const file = await githubGetFileOnBranch(filePath, branch);
      if (file) return file;
    } catch (err) {
      lastError = err;
    }
  }
  if (lastError) throw lastError;
  return null;
}

async function githubPutFile(filePath, buffer, message) {
  const branch = await ensureDataBranch();
  let sha;
  try {
    sha = (await githubGetFileOnBranch(filePath, branch))?.sha;
  } catch (err) {
    sha = undefined;
  }
  const body = {
    message,
    content: Buffer.from(buffer).toString('base64'),
    branch,
    committer: { name: 'tyre-site', email: 'noreply@github.com' },
    ...(sha ? { sha } : {}),
  };
  let result = await githubRequest(`/contents/${encodeGithubPath(filePath)}`, {
    method: 'PUT',
    body,
  });
  if (!result.ok && (result.status === 409 || result.status === 422)) {
    const latest = await githubGetFileOnBranch(filePath, branch);
    result = await githubRequest(`/contents/${encodeGithubPath(filePath)}`, {
      method: 'PUT',
      body: { ...body, ...(latest?.sha ? { sha: latest.sha } : {}) },
    });
  }
  if (!result.ok) {
    throw new Error(githubWriteError(result));
  }
  lastGithubError = '';
  return true;
}

async function readGithub() {
  if (!hasGitHub()) return null;
  try {
    const file = await githubGetFile(GITHUB_STORE_PATH);
    if (!file) return null;
    return fromParsed(JSON.parse(file.buffer.toString('utf8')));
  } catch (err) {
    lastGithubError = err.message;
    console.error('GitHub store read failed:', err.message);
    return null;
  }
}

async function writeGithub(db) {
  if (!hasGitHub()) return false;
  const payload = `${JSON.stringify(db, null, 2)}\n`;
  await githubPutFile(
    GITHUB_STORE_PATH,
    Buffer.from(payload),
    '[skip vercel] Update businesses and categories'
  );
  return true;
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
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
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
          deletedIds: Array,
          deletedNames: Array,
          updatedAt: Date,
        },
        { collection: 'tyre_store', strict: false }
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

let fileModel = null;

async function getFileModel() {
  if (!hasMongo()) return null;
  await getMongoModel();
  if (fileModel) return fileModel;
  const mongoose = require('mongoose');
  fileModel =
    mongoose.models.TyreFile ||
    mongoose.model(
      'TyreFile',
      new mongoose.Schema(
        {
          mime: String,
          name: String,
          data: Buffer,
        },
        { collection: 'tyre_files' }
      )
    );
  return fileModel;
}

function mediaExt(mime, name) {
  const fromName = name ? path.extname(name).toLowerCase() : '';
  if (fromName) return fromName;
  return (
    {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    }[mime] || '.bin'
  );
}

function mediaMime(id) {
  return (
    {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    }[path.extname(String(id)).toLowerCase()] || 'application/octet-stream'
  );
}

async function saveFile({ mime, name, data }) {
  if (!data) return null;
  if (hasGitHub()) {
    const id = `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}${mediaExt(mime, name)}`;
    await githubPutFile(
      `${GITHUB_MEDIA_DIR}/${id}`,
      Buffer.from(data),
      `[skip vercel] Add uploaded image ${id}`
    );
    return id;
  }
  const Model = await getFileModel();
  if (!Model) return null;
  const doc = await Model.create({ mime, name, data });
  return String(doc._id);
}

async function readFile(id) {
  if (!id) return null;
  if (hasGitHub()) {
    try {
      const file = await githubGetFile(`${GITHUB_MEDIA_DIR}/${id}`);
      if (file) return { mime: mediaMime(id), data: file.buffer };
    } catch (err) {
      console.error('GitHub file read failed:', err.message);
    }
  }
  try {
    const Model = await getFileModel();
    if (!Model) return null;
    const doc = await Model.findById(id).lean();
    if (!doc) return null;
    const raw = doc.data;
    const data = Buffer.isBuffer(raw)
      ? raw
      : Buffer.from(raw?.buffer || raw || []);
    return { mime: doc.mime || 'application/octet-stream', data };
  } catch (err) {
    console.error('Mongo file read failed:', err.message);
    return null;
  }
}

async function read() {
  return (await readGithub()) || (await readKv()) || (await readBlob()) || (await readMongo()) || null;
}

async function write(db) {
  const payload = {
    users: db.users || [],
    categories: db.categories || [],
    businesses: db.businesses || [],
    deletedIds: db.deletedIds || [],
    deletedNames: db.deletedNames || [],
  };
  if (hasGitHub()) {
    await writeGithub(payload);
    return true;
  }
  const results = await Promise.allSettled([
    writeKv(payload),
    writeBlob(payload),
    writeMongo(payload),
  ]);
  return results.some((item) => item.status === 'fulfilled' && item.value);
}

function status() {
  return {
    persistent: hasRemoteStore(),
    github: hasGitHub(),
    repo: githubRepo() || null,
    lastError: lastGithubError || null,
  };
}

module.exports = {
  read,
  write,
  fromParsed,
  hasRemoteStore,
  hasMongo,
  hasGitHub,
  saveFile,
  readFile,
  status,
};
