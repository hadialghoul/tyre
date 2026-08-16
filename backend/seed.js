const store = require('./store');
const catalog = require('../frontend/src/data/catalog.json');

const sampleAdmin = {
  username: 'admin',
  email: 'wenbsour@gmail.com',
  password: 'wenbsour123',
  role: 'admin',
};

async function ensureAdmin() {
  const existing =
    store.users.findByEmail(sampleAdmin.email) ||
    store.users.findByEmailOrUsername(sampleAdmin.email, sampleAdmin.username);

  if (!existing) {
    return store.users.create(sampleAdmin);
  }

  if (
    String(existing.email).toLowerCase() === sampleAdmin.email &&
    existing.role === 'admin' &&
    existing.isActive !== false
  ) {
    return existing;
  }

  return store.users.update(existing._id, {
    email: sampleAdmin.email,
    password: sampleAdmin.password,
    role: 'admin',
    isActive: true,
  });
}

async function seedAll() {
  const user = await ensureAdmin();

  const categoryMap = new Map();
  for (const categoryData of catalog.categories) {
    const category = await store.categories.upsertByName({
      name: categoryData.name,
      description: categoryData.description,
      icon: categoryData.icon,
      cover: categoryData.cover,
    });
    categoryMap.set(categoryData.key, category);
  }

  for (const item of catalog.businesses) {
    const category = categoryMap.get(item.categoryKey);
    if (!category) {
      throw new Error(`Missing category for ${item.name}`);
    }
    if (store.businesses.findByName(item.name)) continue;
    if (store.businesses.wasDeleted(item.name)) continue;
    const { key, categoryKey, ...rest } = item;
    await store.businesses.create({
      ...rest,
      category: category._id,
    });
  }

  console.log(`Seed complete. Admin: ${user.email} / ${sampleAdmin.password}`);
  return user;
}

if (require.main === module) {
  seedAll().catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { seedAll, ensureAdmin, sampleAdmin };
