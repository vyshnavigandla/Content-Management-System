// middleware/uploadMiddleware.js
// Configures Multer to save uploaded files to a local "uploads/" folder
// with unique filenames, and restricts file types/size for security.

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Make sure the uploads folder exists (create it if not)
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Where and how to save files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Example result: "notes-1718000000000.pdf"
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, '_')   // replace spaces with underscores
      .toLowerCase();
    cb(null, `${baseName}-${Date.now()}${ext}`);
  },
});

// Only allow these file extensions
const allowedTypes = /pdf|doc|docx|ppt|pptx|jpg|jpeg|png/;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  if (allowedTypes.test(ext)) {
    cb(null, true); // accept file
  } else {
    cb(new Error('Unsupported file type. Allowed: pdf, doc, docx, ppt, pptx, jpg, png'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max per file
});

module.exports = upload;