const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const dirs = ['uploads/apps', 'uploads/icons', 'uploads/screenshots'];
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const appFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads/apps'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'icon' ? 'uploads/icons' : 'uploads/screenshots';
    cb(null, path.join(__dirname, '..', folder));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const allowedAppExtensions = ['.apk', '.zip', '.rar', '.tar', '.gz', '.exe', '.msi', '.dmg', '.deb', '.rpm', '.appimage'];
const allowedImageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

const appFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.fieldname === 'appFile') {
    if (allowedAppExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedAppExtensions.join(', ')}`), false);
    }
  } else if (file.fieldname === 'icon' || file.fieldname === 'screenshots') {
    if (allowedImageExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image type. Allowed: ${allowedImageExtensions.join(', ')}`), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

const uploadApp = multer({
  storage: appFileStorage,
  fileFilter: appFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 209715200 // 200MB
  }
}).single('appFile');

const uploadImages = multer({
  storage: imageStorage,
  fileFilter: appFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB for images
  }
}).fields([
  { name: 'icon', maxCount: 1 },
  { name: 'screenshots', maxCount: 5 }
]);

const uploadAll = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let folder = 'uploads/apps';
      if (file.fieldname === 'icon') folder = 'uploads/icons';
      if (file.fieldname === 'screenshots') folder = 'uploads/screenshots';
      cb(null, path.join(__dirname, '..', folder));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: appFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 209715200 // 200MB
  }
}).fields([
  { name: 'appFile', maxCount: 1 },
  { name: 'icon', maxCount: 1 },
  { name: 'screenshots', maxCount: 5 }
]);

const handleUploadError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 200MB for apps, 10MB for images.' });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

module.exports = {
  uploadApp: handleUploadError(uploadApp),
  uploadImages: handleUploadError(uploadImages),
  uploadAll: handleUploadError(uploadAll)
};
