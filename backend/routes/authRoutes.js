const express = require('express');
const jwt = require('jsonwebtoken');
const store = require('../store');

const router = express.Router();

router.get('/register', (req, res) => {
  res.status(405).json({
    message: 'Use POST /api/auth/register with JSON body: username, email, password, role',
  });
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existing = store.users.findByEmailOrUsername(email, username);
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await store.users.create({
      username,
      email,
      password,
      role: role || 'moderator',
    });

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = store.users.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await store.users.comparePassword(user, password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/login', (req, res) => {
  res.status(405).json({
    message: 'Use POST /api/auth/login with JSON body: email, password',
  });
});

module.exports = router;
