const fs = require('fs');
const multer = require('multer');
const path = require('path');

const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '../uploads/');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ];
    const isPdf = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname || '');
    if (allowedMimes.includes(file.mimetype) || isPdf) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Use an image or a PDF logo.'));
    }
  }
});

module.exports = upload;
