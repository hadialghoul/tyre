const express = require('express');
const store = require('../store');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    res.json(store.stats.summary());
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/view', async (req, res) => {
  try {
    const summary = await store.stats.trackView(req.body?.visitorId);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
