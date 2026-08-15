const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const bundled = require('./data/store.json');

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

function load() {
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

function save(db) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

function makeId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`;
}

function populateBusiness(db, business) {
  if (!business) return null;
  const category = db.categories.find((item) => item._id === business.category) || null;
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
      save(db);
      return user;
    },
    async update(id, data) {
      const db = load();
      const index = db.users.findIndex((user) => user._id === id);
      if (index === -1) return null;
      const next = { ...db.users[index], ...data };
      if (data.password && data.password !== db.users[index].password) {
        next.password = await bcrypt.hash(data.password, 10);
      }
      db.users[index] = next;
      save(db);
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
      return load().categories.find((item) => item._id === id) || null;
    },
    findByName(name) {
      return load().categories.find((item) => item.name === name) || null;
    },
    create(data) {
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
      save(db);
      return category;
    },
    update(id, data) {
      const db = load();
      const index = db.categories.findIndex((item) => item._id === id);
      if (index === -1) return null;
      db.categories[index] = { ...db.categories[index], ...data };
      save(db);
      return db.categories[index];
    },
    upsertByName(data) {
      const existing = store.categories.findByName(data.name);
      if (existing) return store.categories.update(existing._id, data);
      return store.categories.create(data);
    },
    remove(id) {
      const db = load();
      const category = db.categories.find((item) => item._id === id);
      if (!category) return null;
      db.categories = db.categories.filter((item) => item._id !== id);
      save(db);
      return category;
    },
  },

  businesses: {
    findAll({ category, search, featured } = {}) {
      const db = load();
      return db.businesses
        .filter((item) => {
          if (category && item.category !== category) return false;
          if (featured === 'true' && !item.featured) return false;
          const cat = db.categories.find((entry) => entry._id === item.category);
          if (!matchesSearch(item, cat, search)) return false;
          return true;
        })
        .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
        .map((item) => populateBusiness(db, item));
    },
    findById(id) {
      const db = load();
      return populateBusiness(db, db.businesses.find((item) => item._id === id));
    },
    findByName(name) {
      const db = load();
      return db.businesses.find((item) => item.name === name) || null;
    },
    create(data) {
      const db = load();
      const business = {
        _id: makeId('biz'),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.businesses.push(business);
      save(db);
      return populateBusiness(db, business);
    },
    update(id, data) {
      const db = load();
      const index = db.businesses.findIndex((item) => item._id === id);
      if (index === -1) return null;
      db.businesses[index] = {
        ...db.businesses[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      save(db);
      return populateBusiness(db, db.businesses[index]);
    },
    upsertByName(data) {
      const existing = store.businesses.findByName(data.name);
      if (existing) return store.businesses.update(existing._id, data);
      return store.businesses.create(data);
    },
    remove(id) {
      const db = load();
      const business = db.businesses.find((item) => item._id === id);
      if (!business) return null;
      db.businesses = db.businesses.filter((item) => item._id !== id);
      save(db);
      return business;
    },
  },
};

module.exports = store;
