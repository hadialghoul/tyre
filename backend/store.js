const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const bundled = require('./data/store.json');
const persist = require('./persist');

const emptyDb = () => ({ users: [], categories: [], businesses: [] });
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const FILE = isServerless
  ? path.join('/tmp', 'tyre-store.json')
  : path.join(__dirname, 'data', 'store.json');

function fromParsed(parsed) {
  return {
    users: parsed.users || [],
    categories: parsed.categories || [],
    businesses: parsed.businesses || [],
  };
}

let cache = null;

function loadFromDiskOrBundled() {
  try {
    if (fs.existsSync(FILE)) {
      return fromParsed(JSON.parse(fs.readFileSync(FILE, 'utf8')));
    }
  } catch (err) {
    // Fall through to bundled catalog.
  }
  if (bundled && (bundled.users?.length || bundled.categories?.length)) {
    return fromParsed(bundled);
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
    if (remote && (remote.users.length || remote.categories.length || remote.businesses.length)) {
      cache = remote;
      writeDisk(remote);
      return;
    }
  } catch (err) {
    console.error('Remote store read failed:', err.message);
  }
  cache = loadFromDiskOrBundled();
  if (isServerless && !persist.hasRemoteStore()) {
    console.warn(
      'No persistent store configured (Vercel KV, Blob, or MongoDB). Admin add/edit/delete will reset after restart.'
    );
  }
}

function load() {
  if (!cache) {
    cache = loadFromDiskOrBundled();
  }
  return cache;
}

async function save(db) {
  cache = db;
  writeDisk(db);
  try {
    await persist.write(db);
  } catch (err) {
    console.error('Remote store persist failed:', err.message);
  }
  return db;
}

const categoryNamesAr = {
  Restaurants: 'مطاعم',
  'Coffee Shops': 'مقاهي',
  Hotels: 'فنادق',
  Pools: 'مسابح',
  Hospitals: 'مستشفيات',
  Pharmacies: 'صيدليات',
  Supermarkets: 'سوبرماركت',
  Services: 'خدمات',
};

const serviceTypesAr = {
  Electricity: 'كهرباء',
  'Washing machines': 'غسالات',
  'Air conditioning': 'تكييف',
  Plumbing: 'سباكة',
  Laundry: 'غسيل ملابس',
  Painting: 'دهان',
  'Refrigerator repair': 'تصليح برادات',
};

function matchesSearch(item, category, search) {
  if (!search) return true;
  const q = String(search).trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    item.name,
    item.description,
    item.address,
    item.serviceType,
    item.phone,
    category?.name,
    categoryNamesAr[category?.name],
    serviceTypesAr[item.serviceType],
  ]
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

function populateBusiness(db, business) {
  if (!business) return null;
  const category = db.categories.find((item) => sameId(item._id, business.category)) || null;
  return { ...business, category };
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
      return load().categories.find((item) => item.name === name) || null;
    },
    async create(data) {
      const db = load();
      const category = {
        _id: makeId('cat'),
        name: data.name,
        description: data.description || '',
        icon: data.icon || '',
        cover: data.cover || '',
        createdAt: new Date().toISOString(),
      };
      db.categories.push(category);
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
      const existing = store.categories.findByName(data.name);
      if (existing) return store.categories.update(existing._id, data);
      return store.categories.create(data);
    },
    async remove(id) {
      const db = load();
      const category = db.categories.find((item) => sameId(item._id, id));
      if (!category) return null;
      db.categories = db.categories.filter((item) => !sameId(item._id, id));
      await save(db);
      return category;
    },
  },

  businesses: {
    findAll({ category, search, featured } = {}) {
      const db = load();
      return db.businesses
        .filter((item) => {
          if (category && !sameId(item.category, category)) return false;
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
    async create(data) {
      const db = load();
      const business = {
        _id: makeId('biz'),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.businesses.push(business);
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
      if (!business) return null;
      db.businesses = db.businesses.filter((item) => !sameId(item._id, id));
      await save(db);
      return business;
    },
  },
};

store.ready = hydrate();

module.exports = store;
