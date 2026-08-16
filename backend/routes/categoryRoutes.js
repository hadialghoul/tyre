const express = require('express');
const store = require('../store');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.json(store.categories.findAll());
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

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, icon, cover } = req.body;
    if (store.categories.findByName(name)) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    const category = await store.categories.create({ name, description, icon, cover });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, icon, cover } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (icon) updates.icon = icon;
    if (cover) updates.cover = cover;
    const category = await store.categories.update(req.params.id, updates);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
