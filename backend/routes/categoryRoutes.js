const express = require('express');
const store = require('../store');
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { storedPath } = require('../media');

const router = express.Router();

const categoryFilesUpload = upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'iconImage', maxCount: 1 },
]);

const firstFile = (files, field) => files?.[field]?.[0] || null;

router.get('/', async (req, res) => {
  try {
    const isSingularTechStore = (name = '') => /^(tech|teck)\s*store$/i.test(String(name).trim());
    res.json(store.categories.findAll().filter((item) => !isSingularTechStore(item.name)));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const category = store.categories.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', auth, adminOnly, categoryFilesUpload, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (store.categories.findByName(name)) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    const coverFile = firstFile(req.files, 'cover');
    const iconFile = firstFile(req.files, 'iconImage');
    const category = await store.categories.create({
      name,
      description,
      icon,
      iconImage: iconFile ? await storedPath(iconFile) : req.body.iconImage || '',
      cover: coverFile ? await storedPath(coverFile) : req.body.cover || '',
    });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

router.put('/:id', auth, adminOnly, categoryFilesUpload, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    const coverFile = firstFile(req.files, 'cover');
    const iconFile = firstFile(req.files, 'iconImage');
    if (coverFile) updates.cover = await storedPath(coverFile);
    if (iconFile) updates.iconImage = await storedPath(iconFile);
    const category = await store.categories.update(req.params.id, updates);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const category = await store.categories.remove(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
