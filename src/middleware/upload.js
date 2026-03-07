const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Media } = require('../models'); // Ajout

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    if (req.baseUrl && req.baseUrl.includes('users')) {
      uploadPath = path.join(__dirname, '../../uploads/avatars');
    } else {
      uploadPath = path.join(__dirname, '../../uploads/events');
    }
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) return cb(null, true);
  cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Augmenté à 10 Mo (ajustez selon besoin)
  fileFilter
});

// Middleware pour enregistrer les infos du fichier dans la base
upload.record = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const { filename, originalname, mimetype, size, path: filePath } = req.file;
    const url = `/uploads/${req.file.destination.includes('avatars') ? 'avatars' : 'events'}/${filename}`;
    await Media.create({
      filename,
      originalname,
      mimetype,
      size,
      path: filePath,
      url,
      uploaded_by: req.user ? req.user.id : null,
      related_type: req.body.related_type || null,
      related_id: req.body.related_id || null
    });
  } catch (error) {
    console.error('Erreur enregistrement média:', error);
  }
  next();
};

module.exports = upload;