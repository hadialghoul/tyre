const express = require('express');
const store = require('../store');
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { storedPath } = require('../media');

const router = express.Router();

const businessFilesUpload = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'logo2', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
  { name: 'menuQrImage', maxCount: 1 },
]);

const isRestaurantOrCafe = (categoryName = '') => {
  const normalized = categoryName.trim().toLowerCase();
  return normalized.includes('restaurant') || normalized.includes('cafe') || normalized.includes('coffee');
};

const toBool = (value) => value === true || value === 'true';

const buildMenuFromRequest = async (req) => {
  const menuType = req.body.menuType;
  const menuLink = req.body.menuLink;
  const menuName = req.body.menuName || 'Main Menu';
  const menuDescription = req.body.menuDescription || '';
  const menuQrImageFile = req.files?.menuQrImage?.[0];

  if (!menuType && !menuLink && !menuQrImageFile) {
    return null;
  }

  const menu = {
    name: menuName,
    description: menuDescription,
    type: menuType === 'link' ? 'link' : 'image',
    link: menuType === 'link' ? menuLink : '',
    image: menuType === 'image' && menuQrImageFile ? await storedPath(menuQrImageFile) : '',
    items: [],
  };

  if (menu.type === 'link' && !menu.link) return null;
  if (menu.type === 'image' && !menu.image) return null;
  return menu;
};

router.get('/', async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    res.json(store.businesses.findAll({ category, search, featured }));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/tombstones', auth, adminOnly, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const names = Array.isArray(req.body?.names) ? req.body.names : [];
    const result = await store.businesses.rememberDeleted(ids, names);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const business = store.businesses.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    res.json(business);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', auth, adminOnly, businessFilesUpload, async (req, res) => {
  try {
    const {
      name, secondName, category, description, phone, alternatePhone, email, address, website,
      openingHours, hasDelivery, deliveryPhone, latitude, longitude, featured,
      starRating, serviceType, mapsUrl,
    } = req.body;

    const categoryDoc = store.categories.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Invalid category selected' });
    }

    const menu = isRestaurantOrCafe(categoryDoc.name) ? await buildMenuFromRequest(req) : null;
    const logoFile = req.files?.logo?.[0];
    const logo2File = req.files?.logo2?.[0];
    const coverFile = req.files?.coverImage?.[0];

    const business = await store.businesses.create({
      name,
      secondName: secondName || '',
      category,
      description,
      phone,
      alternatePhone,
      email,
      address,
      website,
      logo: await storedPath(logoFile),
      logo2: await storedPath(logo2File),
      coverImage: await storedPath(coverFile),
      openingHours,
      hasDelivery: toBool(hasDelivery),
      deliveryPhone,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      featured: toBool(featured),
      starRating: starRating ? Number(starRating) : undefined,
      serviceType,
      mapsUrl,
      menus: menu ? [menu] : [],
    });

    res.status(201).json(business);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:id', auth, adminOnly, businessFilesUpload, async (req, res) => {
  try {
    const existing = store.businesses.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const {
      name, secondName, category, description, phone, alternatePhone, email, address, website,
      openingHours, hasDelivery, deliveryPhone, latitude, longitude, featured,
      starRating, serviceType, mapsUrl,
    } = req.body;

    const categoryId = category || existing.category?._id || existing.category;
    const categoryDoc = store.categories.findById(categoryId);
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Invalid category selected' });
    }

    const menu = isRestaurantOrCafe(categoryDoc.name) ? await buildMenuFromRequest(req) : null;
    const logoFile = req.files?.logo?.[0];
    const logo2File = req.files?.logo2?.[0];
    const coverFile = req.files?.coverImage?.[0];
    const updates = { category: categoryId };

    if (name) updates.name = name;
    if (secondName !== undefined) updates.secondName = secondName;
    if (description) updates.description = description;
    if (phone) updates.phone = phone;
    if (alternatePhone) updates.alternatePhone = alternatePhone;
    if (email) updates.email = email;
    if (address) updates.address = address;
    if (website) updates.website = website;
    if (openingHours) updates.openingHours = openingHours;
    if (hasDelivery !== undefined) updates.hasDelivery = toBool(hasDelivery);
    if (deliveryPhone) updates.deliveryPhone = deliveryPhone;
    if (latitude) updates.latitude = Number(latitude);
    if (longitude) updates.longitude = Number(longitude);
    if (featured !== undefined) updates.featured = toBool(featured);
    if (starRating !== undefined) updates.starRating = starRating === '' ? undefined : Number(starRating);
    if (serviceType !== undefined) updates.serviceType = serviceType;
    if (mapsUrl !== undefined) updates.mapsUrl = mapsUrl;
    if (logoFile) updates.logo = await storedPath(logoFile);
    if (logo2File) updates.logo2 = await storedPath(logo2File);
    if (coverFile) updates.coverImage = await storedPath(coverFile);

    if (isRestaurantOrCafe(categoryDoc.name)) {
      if (menu) updates.menus = [menu];
    } else {
      updates.menus = [];
    }

    const business = await store.businesses.update(req.params.id, updates);
    res.json(business);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/menus', auth, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const business = store.businesses.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const menus = [...(business.menus || []), {
      name: req.body.name,
      description: req.body.description,
      image: req.file ? await storedPath(req.file) : '',
      items: [],
    }];

    res.status(201).json(await store.businesses.update(req.params.id, { menus }));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const business = await store.businesses.remove(req.params.id);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    res.json({ message: 'Business deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
