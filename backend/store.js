const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const bundled = require('./data/store.json');
const persist = require('./persist');
const bundledDeleted = require('./data/deleted.json');

const emptyStats = () => ({
  totalViews: 0,
  uniqueVisitors: 0,
  knownIds: [],
  byDay: {},
});

const emptyDb = () => ({
  users: [],
  categories: [],
  businesses: [],
  deletedIds: [],
  deletedNames: [],
  deletedCategoryNames: [],
  stats: emptyStats(),
});
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const FILE = isServerless
  ? path.join('/tmp', 'tyre-store.json')
  : path.join(__dirname, 'data', 'store.json');

function fromParsed(parsed) {
  return {
    users: parsed.users || [],
    categories: parsed.categories || [],
    businesses: parsed.businesses || [],
    deletedIds: parsed.deletedIds || [],
    deletedNames: parsed.deletedNames || [],
    deletedCategoryNames: parsed.deletedCategoryNames || [],
    stats: {
      ...emptyStats(),
      ...(parsed.stats || {}),
      knownIds: Array.isArray(parsed.stats?.knownIds) ? parsed.stats.knownIds : [],
      byDay: parsed.stats?.byDay && typeof parsed.stats.byDay === 'object' ? parsed.stats.byDay : {},
    },
  };
}

const DELETED_FILE = path.join(__dirname, 'data', 'deleted.json');

function readDeletedFile() {
  try {
    if (fs.existsSync(DELETED_FILE)) {
      return JSON.parse(fs.readFileSync(DELETED_FILE, 'utf8'));
    }
  } catch (err) {
    // Use bundled tombstones.
  }
  return bundledDeleted || { ids: [], names: [] };
}

function writeDeletedFile(db) {
  try {
    fs.writeFileSync(
      DELETED_FILE,
      JSON.stringify(
        { ids: db.deletedIds || [], names: db.deletedNames || [] },
        null,
        2
      )
    );
  } catch (err) {
    // Read-only on Vercel; remote persist still saves tombstones.
  }
}

function applyTombstones(db) {
  const file = readDeletedFile();
  const ids = new Set(
    [...(db.deletedIds || []), ...(file.ids || [])].map(String).filter(Boolean)
  );
  const names = new Set(
    [...(db.deletedNames || []), ...(file.names || [])]
      .map((item) => String(item).trim())
      .filter(Boolean)
  );
  const namesLower = new Set([...names].map((item) => item.toLowerCase()));
  db.deletedIds = [...ids];
  db.deletedNames = [...names];
  db.businesses = (db.businesses || []).filter(
    (item) =>
      !ids.has(String(item._id)) &&
      !namesLower.has(String(item.name || '').toLowerCase())
  );
  return db;
}

let cache = null;

function loadFromDiskOrBundled() {
  try {
    if (fs.existsSync(FILE)) {
      return applyTombstones(fromParsed(JSON.parse(fs.readFileSync(FILE, 'utf8'))));
    }
  } catch (err) {
    // Fall through to bundled catalog.
  }
  if (bundled && (bundled.users?.length || bundled.categories?.length)) {
    return applyTombstones(fromParsed(bundled));
  }
  return emptyDb();
}

function writeDisk(db) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    if (!isServerless) {
      console.error('Failed to write store file:', err.message);
    }
  }
}

async function hydrate() {
  try {
    const remote = await persist.read();
    if (remote && (remote.users.length || remote.categories.length || Array.isArray(remote.businesses))) {
      cache = applyTombstones(remote);
      globalThis.__tyreStore = cache;
      writeDisk(cache);
      return;
    }
  } catch (err) {
    console.error('Remote store read failed:', err.message);
  }
  cache = loadFromDiskOrBundled();
  globalThis.__tyreStore = cache;
}

let lastRefresh = 0;

async function refresh() {
  if (!isServerless || !persist.hasGitHub()) {
    return load();
  }
  if (cache && Date.now() - lastRefresh < 2000) {
    return cache;
  }
  try {
    const remote = await persist.read();
    if (remote && (remote.users.length || remote.categories.length || Array.isArray(remote.businesses))) {
      cache = applyTombstones(remote);
      globalThis.__tyreStore = cache;
      writeDisk(cache);
    }
  } catch (err) {
    console.error('Store refresh failed:', err.message);
  }
  lastRefresh = Date.now();
  return load();
}

function load() {
  if (globalThis.__tyreStore) {
    cache = globalThis.__tyreStore;
    return cache;
  }
  if (!cache) {
    cache = loadFromDiskOrBundled();
    globalThis.__tyreStore = cache;
  }
  return cache;
}

async function save(db) {
  const next = applyTombstones(db);
  cache = next;
  globalThis.__tyreStore = next;
  writeDisk(next);
  writeDeletedFile(next);
  if (isServerless && !persist.hasRemoteStore()) {
    const info = persist.status();
    const hint = info.repo
      ? 'Add GITHUB_TOKEN in Vercel (GitHub → Settings → Developer settings → Personal access tokens, repo scope), then redeploy.'
      : 'Add GITHUB_TOKEN and GITHUB_REPO (like owner/repo-name) in Vercel, then redeploy.';
    const err = new Error(`Changes are not saving on the live site. ${hint}`);
    err.code = 'NO_PERSISTENCE';
    throw err;
  }
  try {
    const saved = await persist.write(next);
    if (isServerless && !saved) {
      throw new Error('Could not save changes. Check GITHUB_TOKEN in Vercel.');
    }
  } catch (err) {
    console.error('Remote store persist failed:', err.message);
    if (isServerless) throw err;
  }
  lastRefresh = Date.now();
  return next;
}

function matchesSearch(item, category, search) {
  if (!search) return true;
  const q = String(search).trim().toLowerCase();
  if (!q) return true;
  const haystack = [item.name, item.secondName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

function makeId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`;
}

function sameId(a, b) {
  return String(a || '') === String(b || '');
}

function withReviewSummary(business) {
  if (!business) return null;
  const reviews = Array.isArray(business.reviews) ? business.reviews : [];
  const count = reviews.length;
  const rating = count
    ? Math.round((reviews.reduce((sum, item) => sum + Number(item.stars || 0), 0) / count) * 10) / 10
    : 0;
  return {
    ...business,
    rating,
    reviewCount: count,
    reviews: reviews.map(({ visitorId, ...rest }) => rest),
  };
}

function populateBusiness(db, business) {
  if (!business) return null;
  const category = db.categories.find((item) => sameId(item._id, business.category)) || null;
  return withReviewSummary({ ...business, category });
}

const store = {
  isEmpty() {
    const db = load();
    return db.users.length === 0 && db.categories.length === 0;
  },

  users: {
    findByEmail(email) {
      const needle = String(email || '').trim().toLowerCase();
      return load().users.find((user) => String(user.email).toLowerCase() === needle) || null;
    },
    findByEmailOrUsername(email, username) {
      const needleEmail = String(email || '').trim().toLowerCase();
      const needleUsername = String(username || '').trim().toLowerCase();
      return (
        load().users.find(
          (user) =>
            String(user.email).toLowerCase() === needleEmail ||
            String(user.username).toLowerCase() === needleUsername
        ) || null
      );
    },
    async create(data) {
      const db = load();
      const password = await bcrypt.hash(data.password, 10);
      const user = {
        _id: makeId('user'),
        username: data.username,
        email: data.email,
        password,
        role: data.role || 'moderator',
        isActive: data.isActive !== false,
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
      await save(db);
      return user;
    },
    async update(id, data) {
      const db = load();
      const index = db.users.findIndex((user) => sameId(user._id, id));
      if (index === -1) return null;
      const next = { ...db.users[index], ...data };
      if (data.password && data.password !== db.users[index].password) {
        next.password = await bcrypt.hash(data.password, 10);
      }
      db.users[index] = next;
      await save(db);
      return next;
    },
    async comparePassword(user, password) {
      return bcrypt.compare(password, user.password);
    },
  },

  categories: {
    findAll() {
      return load().categories;
    },
    findById(id) {
      return load().categories.find((item) => sameId(item._id, id)) || null;
    },
    findByName(name) {
      const needle = String(name || '').toLowerCase();
      return load().categories.find((item) => String(item.name).toLowerCase() === needle) || null;
    },
    async create(data) {
      const requestedName = String(data.name || '').trim();
      if (/^(tech|teck)\s*store$/i.test(requestedName)) {
        const existingPlural = load().categories.find((item) =>
          /^(tech|teck)\s*stores$/i.test(String(item.name || '').trim())
        );
        if (existingPlural) return existingPlural;
        data = {
          ...data,
          name: 'Tech Stores',
          cover: data.cover || '/img/categories/covers/tech.jpg',
          iconImage: data.iconImage || '/img/categories/icons/tech.svg',
        };
      }
      const db = load();
      const category = {
        _id: makeId('cat'),
        name: data.name,
        description: data.description || '',
        icon: data.icon || '',
        iconImage: data.iconImage || '',
        cover: data.cover || '',
        createdAt: new Date().toISOString(),
      };
      db.categories.push(category);
      const createdName = String(category.name || '').toLowerCase();
      db.deletedCategoryNames = (db.deletedCategoryNames || []).filter(
        (item) => String(item).toLowerCase() !== createdName
      );
      await save(db);
      return category;
    },
    async update(id, data) {
      const db = load();
      const index = db.categories.findIndex((item) => sameId(item._id, id));
      if (index === -1) return null;
      db.categories[index] = { ...db.categories[index], ...data };
      await save(db);
      return db.categories[index];
    },
    async upsertByName(data) {
      if (store.categories.wasDeleted(data.name)) return null;
      const existing = store.categories.findByName(data.name);
      if (existing) return store.categories.update(existing._id, data);
      return store.categories.create(data);
    },
    wasDeleted(name) {
      const needle = String(name || '').toLowerCase();
      return (load().deletedCategoryNames || []).some((item) => String(item).toLowerCase() === needle);
    },
    async rememberDeleted(name) {
      if (!name) return;
      const db = load();
      db.deletedCategoryNames = [...new Set([...(db.deletedCategoryNames || []), String(name)])];
      await save(db);
    },
    async remove(id) {
      const db = load();
      const category = db.categories.find((item) => sameId(item._id, id));
      if (!category) return null;
      const fallback = db.categories.find(
        (item) => !sameId(item._id, id) && String(item.name).toLowerCase() === 'services'
      ) || db.categories.find((item) => !sameId(item._id, id));
      if (fallback) {
        db.businesses = db.businesses.map((item) =>
          sameId(item.category, category._id) ? { ...item, category: fallback._id } : item
        );
      }
      db.categories = db.categories.filter((item) => !sameId(item._id, id));
      if (category.name) {
        db.deletedCategoryNames = [...new Set([...(db.deletedCategoryNames || []), category.name])];
      }
      await save(db);
      return category;
    },
  },

  businesses: {
    findAll({ category, search, featured } = {}) {
      const db = load();
      const categoryDoc = category
        ? db.categories.find(
            (entry) =>
              sameId(entry._id, category) ||
              String(entry.name || '').toLowerCase() === String(category).toLowerCase() ||
              String(entry.name || '').toLowerCase().replace(/\s+/g, '-') === String(category).toLowerCase()
          )
        : null;
      return db.businesses
        .filter((item) => {
          if (category) {
            if (!categoryDoc || !sameId(item.category, categoryDoc._id)) return false;
          }
          if (featured === 'true' && !item.featured) return false;
          const cat = db.categories.find((entry) => sameId(entry._id, item.category));
          if (!matchesSearch(item, cat, search)) return false;
          return true;
        })
        .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
        .map((item) => populateBusiness(db, item));
    },
    findById(id) {
      const db = load();
      return populateBusiness(db, db.businesses.find((item) => sameId(item._id, id)));
    },
    findByName(name) {
      const db = load();
      return db.businesses.find((item) => item.name === name) || null;
    },
    wasDeleted(name) {
      const db = load();
      const needle = String(name || '').toLowerCase();
      return (db.deletedNames || []).some((item) => String(item).toLowerCase() === needle);
    },
    async create(data) {
      const db = load();
      const business = {
        _id: makeId('biz'),
        ...data,
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.businesses.push(business);
      const name = String(business.name || '').toLowerCase();
      db.deletedNames = (db.deletedNames || []).filter((item) => String(item).toLowerCase() !== name);
      db.deletedIds = (db.deletedIds || []).filter((item) => !sameId(item, business._id));
      await save(db);
      return populateBusiness(db, business);
    },
    async update(id, data) {
      const db = load();
      const index = db.businesses.findIndex((item) => sameId(item._id, id));
      if (index === -1) return null;
      db.businesses[index] = {
        ...db.businesses[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await save(db);
      return populateBusiness(db, db.businesses[index]);
    },
    async upsertByName(data) {
      const existing = store.businesses.findByName(data.name);
      if (existing) return store.businesses.update(existing._id, data);
      return store.businesses.create(data);
    },
    async remove(id) {
      const db = load();
      const business = db.businesses.find((item) => sameId(item._id, id));
      if (!business) {
        db.deletedIds = [...new Set([...(db.deletedIds || []), String(id)])];
        await save(db);
        return null;
      }
      db.businesses = db.businesses.filter((item) => !sameId(item._id, id));
      db.deletedIds = [...new Set([...(db.deletedIds || []), String(business._id)])];
      if (business.name) {
        db.deletedNames = [...new Set([...(db.deletedNames || []), business.name])];
      }
      await save(db);
      return business;
    },
    async rememberDeleted(ids = [], names = []) {
      const db = load();
      db.deletedIds = [...new Set([...(db.deletedIds || []), ...ids.map(String)])];
      db.deletedNames = [...new Set([...(db.deletedNames || []), ...names.map(String).filter(Boolean)])];
      await save(db);
      return {
        deletedIds: db.deletedIds,
        remaining: db.businesses.length,
      };
    },
    async addReview(id, { stars, visitorId, name } = {}) {
      const value = Number(stars);
      const visitor = String(visitorId || '').trim().slice(0, 80);
      if (!visitor || !Number.isFinite(value) || value < 1 || value > 5) {
        return { error: 'Choose a rating from 1 to 5 stars.' };
      }
      const db = load();
      const index = db.businesses.findIndex((item) => sameId(item._id, id));
      if (index === -1) return null;
      const reviews = [...(db.businesses[index].reviews || [])];
      const existing = reviews.findIndex((item) => item.visitorId === visitor);
      const now = new Date().toISOString();
      const entry = {
        _id: existing >= 0 ? reviews[existing]._id : makeId('rev'),
        stars: Math.round(value),
        name: String(name || '').trim().slice(0, 80),
        visitorId: visitor,
        createdAt: existing >= 0 ? reviews[existing].createdAt : now,
        updatedAt: now,
      };
      if (existing >= 0) reviews[existing] = entry;
      else reviews.push(entry);
      db.businesses[index] = {
        ...db.businesses[index],
        reviews,
        updatedAt: now,
      };
      await save(db);
      return populateBusiness(db, db.businesses[index]);
    },
  },

  stats: {
    summary() {
      const stats = load().stats || emptyStats();
      const today = new Date().toISOString().slice(0, 10);
      const last7Days = [];
      for (let i = 6; i >= 0; i -= 1) {
        const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const row = stats.byDay?.[day] || { views: 0, uniques: 0 };
        last7Days.push({ date: day, views: row.views || 0, uniques: row.uniques || 0 });
      }
      const todayRow = stats.byDay?.[today] || { views: 0, uniques: 0 };
      return {
        totalViews: stats.totalViews || 0,
        uniqueVisitors: stats.uniqueVisitors || 0,
        todayViews: todayRow.views || 0,
        todayUniques: todayRow.uniques || 0,
        last7Days,
        measurementId: 'G-929FC0LLN1',
      };
    },
    async trackView(visitorId) {
      const visitor = String(visitorId || '').trim().slice(0, 80);
      if (!visitor) return store.stats.summary();
      const db = load();
      const stats = { ...emptyStats(), ...(db.stats || {}) };
      stats.knownIds = Array.isArray(stats.knownIds) ? stats.knownIds : [];
      stats.byDay = stats.byDay && typeof stats.byDay === 'object' ? { ...stats.byDay } : {};
      const today = new Date().toISOString().slice(0, 10);
      const day = { views: 0, uniques: 0, ...(stats.byDay[today] || {}) };
      stats.totalViews = (stats.totalViews || 0) + 1;
      day.views = (day.views || 0) + 1;
      if (!stats.knownIds.includes(visitor)) {
        stats.uniqueVisitors = (stats.uniqueVisitors || 0) + 1;
        stats.knownIds.push(visitor);
        day.uniques = (day.uniques || 0) + 1;
        if (stats.knownIds.length > 50000) {
          stats.knownIds = stats.knownIds.slice(-40000);
        }
      }
      const dayKeys = Object.keys(stats.byDay).sort();
      if (dayKeys.length > 90) {
        dayKeys.slice(0, dayKeys.length - 90).forEach((key) => {
          delete stats.byDay[key];
        });
      }
      stats.byDay[today] = day;
      db.stats = stats;
      await save(db);
      return store.stats.summary();
    },
  },
};

store.ready = hydrate();
store.refresh = refresh;
store.persistenceEnabled = () => persist.hasRemoteStore();
store.persistInfo = () => persist.status();

module.exports = store;
