const multer = require('multer');
const path = require('path');

// Storage in memory to ensure "NOTHING ON PC" requirement
const storage = multer.memoryStorage();

const allowedAppExtensions = ['.apk', '.zip', '.rar', '.tar', '.gz', '.exe', '.msi', '.dmg', '.deb', '.rpm', '.appimage', '.ipa', '.7z'];
const allowedImageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

const appFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'appFile' || file.fieldname === 'chunk') {
    // For chunks, we're more lenient as they might be named 'blob' or have no extension
    if (file.fieldname === 'chunk' || allowedAppExtensions.includes(ext)) {
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
  storage: storage,
  fileFilter: appFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 209715200 // 200MB
  }
}).single('appFile');

const uploadChunked = multer({
  storage: storage,
  fileFilter: appFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB max per chunk
  }
}).single('chunk');

const uploadImages = multer({
  storage: storage,
  fileFilter: appFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB for images
  }
}).fields([
  { name: 'icon', maxCount: 1 },
  { name: 'screenshots', maxCount: 5 }
]);

const uploadAll = multer({
  storage: storage,
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
  uploadChunked: handleUploadError(uploadChunked),
  uploadImages: handleUploadError(uploadImages),
  uploadAll: handleUploadError(uploadAll)
};
