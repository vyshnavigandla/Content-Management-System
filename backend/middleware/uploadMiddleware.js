// middleware/uploadMiddleware.js
// FIX: upload.fields() stores files as req.files[fieldName] object,
// NOT a flat array. contentController now reads req.files correctly.
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, '_')
      .toLowerCase();
    cb(null, `${baseName}-${Date.now()}${ext}`);
  },
});

const allowedTypes = /pdf|doc|docx|ppt|pptx|jpg|jpeg|png/;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: pdf, doc, docx, ppt, pptx, jpg, png'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadAttachments = upload.array('attachments', 5);
const uploadFeaturedImage = upload.single('featuredImage');

const uploadContentFiles = (req, res, next) => {
  const multerMiddleware = upload.fields([
    { name: 'attachments', maxCount: 5 },
    { name: 'featuredImage', maxCount: 1 },
  ]);
  multerMiddleware(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

module.exports = { upload, uploadAttachments, uploadFeaturedImage, uploadContentFiles };