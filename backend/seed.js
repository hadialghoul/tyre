const store = require('./store');
const catalog = require('../frontend/src/data/catalog.json');

const sampleAdmin = {
  username: 'admin',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin',
};

async function seedAll() {
  let user = store.users.findByEmail(sampleAdmin.email);
  if (!user) {
    user = await store.users.create(sampleAdmin);
  }

  const categoryMap = new Map();
  for (const categoryData of catalog.categories) {
    const category = store.categories.upsertByName({
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
    const { key, categoryKey, ...rest } = item;
    store.businesses.create({
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

module.exports = { seedAll, sampleAdmin };
