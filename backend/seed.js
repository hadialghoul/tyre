const store = require('./store');
const catalog = require('../frontend/src/data/catalog.json');

const sampleAdmin = {
  username: 'admin',
  email: 'wenbsour@gmail.com',
  password: 'wenbsour123',
  role: 'admin',
};

const TECH_PHOTO = '/img/categories/covers/tech.jpg';
const TECH_ICON = '/img/categories/icons/tech.svg';

const COVER_BY_NAME = [
  { match: /^(tech|teck)\s*stores$/i, cover: TECH_PHOTO, iconImage: TECH_ICON, icon: '📱' },
  { match: /clothing|clothes|fashion|boutique/i, cover: '/img/categories/covers/clothing.jpg', iconImage: '/img/categories/icons/clothing.svg' },
  { match: /barber|salon/i, cover: '/img/categories/covers/barber.jpg', iconImage: '/img/categories/icons/barber.svg' },
];

const isSingularTechStore = (name = '') => /^(tech|teck)\s*store$/i.test(String(name).trim());
const isPluralTechStores = (name = '') => /^(tech|teck)\s*stores$/i.test(String(name).trim());
const categoryId = (value) => String(value?._id || value || '');
const isRealPhoto = (cover = '') => Boolean(cover) && !/\.svg$/i.test(String(cover));

async function mergeTechStoreIntoTechStores() {
  const categories = store.categories.findAll();
  const singular = categories.find((item) => isSingularTechStore(item.name));
  const plural = categories.find((item) => isPluralTechStores(item.name));
  const photo = isRealPhoto(singular?.cover)
    ? singular.cover
    : isRealPhoto(plural?.cover)
      ? plural.cover
      : TECH_PHOTO;

  if (singular && !plural) {
    await store.categories.update(singular._id, {
      name: 'Tech Stores',
      cover: photo,
      iconImage: singular.iconImage || TECH_ICON,
    });
    await store.categories.rememberDeleted('Tech Store');
    return;
  }

  if (plural) {
    const updates = { cover: photo };
    if (!plural.iconImage) updates.iconImage = singular?.iconImage || TECH_ICON;
    if (singular?.description && !plural.description) updates.description = singular.description;
    await store.categories.update(plural._id, updates);
  }

  if (singular && plural) {
    const businesses = store.businesses.findAll();
    for (const business of businesses) {
      if (categoryId(business.category) === categoryId(singular._id)) {
        await store.businesses.update(business._id, { category: plural._id });
      }
    }
    await store.categories.remove(singular._id);
  }
}

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

async function applyCoversToExistingCategories() {
  const categories = store.categories.findAll();
  for (const existing of categories) {
    const preset = COVER_BY_NAME.find((item) => item.match.test(String(existing.name || '').trim()));
    const catalogMatch = catalog.categories.find(
      (item) => String(item.name).toLowerCase() === String(existing.name || '').toLowerCase()
    );
    const updates = {};
    if (preset) {
      if (existing.cover !== preset.cover) updates.cover = preset.cover;
      if (!existing.iconImage && preset.iconImage) updates.iconImage = preset.iconImage;
      if (preset.icon && !existing.icon) updates.icon = preset.icon;
    } else if (catalogMatch) {
      const cover = String(existing.cover || '');
      const usesSharedPhoto = !cover || /\/img\/(port|hero|coast|beach|hippodrome)\.jpg$/i.test(cover);
      const usesOldIllustration = /\/img\/categories\/covers\/.+\.svg$/i.test(cover);
      if ((usesSharedPhoto || usesOldIllustration) && catalogMatch.cover && catalogMatch.cover !== cover) {
        updates.cover = catalogMatch.cover;
      }
      if (!existing.iconImage && catalogMatch.iconImage) updates.iconImage = catalogMatch.iconImage;
      if (catalogMatch.icon && !existing.icon) updates.icon = catalogMatch.icon;
    }
    if (Object.keys(updates).length) {
      await store.categories.update(existing._id, updates);
    }
  }
}

async function seedAll() {
  const user = await ensureAdmin();
  await mergeTechStoreIntoTechStores();
  await applyCoversToExistingCategories();

  const categoryMap = new Map();
  for (const categoryData of catalog.categories) {
    if (/^tech store$/i.test(categoryData.name || '')) continue;
    if (store.categories.wasDeleted(categoryData.name)) continue;
    const category = await store.categories.upsertByName({
      name: categoryData.name,
      description: categoryData.description,
      icon: categoryData.icon,
      iconImage: categoryData.iconImage,
      cover: categoryData.cover,
    });
    if (!category) continue;
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

module.exports = {
  seedAll,
  ensureAdmin,
  applyCoversToExistingCategories,
  mergeTechStoreIntoTechStores,
  sampleAdmin,
};
