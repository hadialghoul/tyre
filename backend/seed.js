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

async function ensureCategoryVisuals() {
  for (const categoryData of catalog.categories) {
    const existing = store.categories.findByName(categoryData.name);
    if (!existing) {
      await store.categories.create({
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon,
        iconImage: categoryData.iconImage,
        cover: categoryData.cover,
      });
      continue;
    }
    const updates = {};
    const cover = String(existing.cover || '');
    const usesSharedPhoto = !cover || /\/img\/(port|hero|coast|beach|hippodrome)\.jpg$/i.test(cover);
    const usesOldIllustration = /\/img\/categories\/covers\/.+\.svg$/i.test(cover);
    if ((usesSharedPhoto || usesOldIllustration) && categoryData.cover && categoryData.cover !== cover) {
      updates.cover = categoryData.cover;
    }
    if (!existing.iconImage && categoryData.iconImage) updates.iconImage = categoryData.iconImage;
    if (categoryData.icon && !existing.icon) updates.icon = categoryData.icon;
    if (Object.keys(updates).length) {
      await store.categories.update(existing._id, updates);
    }
  }
}

async function seedAll() {
  const user = await ensureAdmin();
  await ensureCategoryVisuals();

  const categoryMap = new Map();
  for (const categoryData of catalog.categories) {
    const category = await store.categories.upsertByName({
      name: categoryData.name,
      description: categoryData.description,
      icon: categoryData.icon,
      iconImage: categoryData.iconImage,
      cover: categoryData.cover,
    });
    categoryMap.set(categoryData.key, category);
  }

  if (process.env.VERCEL) {
    console.log(`Admin ready: ${user.email}. Sample businesses are not auto-loaded on the live site.`);
    return user;
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

module.exports = { seedAll, ensureAdmin, ensureCategoryVisuals, sampleAdmin };
