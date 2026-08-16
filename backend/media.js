const fs = require('fs');
const persist = require('./persist');

async function storedPath(file) {
  if (!file) return '';
  if ((persist.hasGitHub() || persist.hasMongo()) && file.path && fs.existsSync(file.path)) {
    const id = await persist.saveFile({
      mime: file.mimetype || 'application/octet-stream',
      name: file.originalname || file.filename,
      data: fs.readFileSync(file.path),
    });
    if (id) return `/api/media/${id}`;
  }
  return `/uploads/${file.filename}`;
}

module.exports = { storedPath };
