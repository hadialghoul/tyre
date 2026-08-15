const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ override: true });

if (!process.env.JWT_SECRET) {
  if (process.env.VERCEL) {
    console.error('Missing JWT_SECRET. Set it in the Vercel project environment variables.');
  } else {
    console.error('Missing JWT_SECRET. Create backend/.env from backend/.env.example and restart.');
    process.exit(1);
  }
}

const store = require('./store');

const app = express();
const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(uploadDir));

app.use('/api/businesses', require('./routes/businessRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend server is running' });
});

async function start() {
  const { seedAll, ensureAdmin } = require('./seed');
  if (store.isEmpty()) {
    await seedAll();
  } else {
    await ensureAdmin();
  }

  if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Admin login: wenbsour@gmail.com / wenbsour123');
    });
  }
}

start().catch((err) => {
  console.error('Failed to start backend:', err);
  if (!process.env.VERCEL) process.exit(1);
});

module.exports = app;
