const App = require('../models/App');
const { uploadToB2 } = require('../utils/b2Storage');
const { runBackgroundScan } = require('../services/backgroundScan');
const { v4: uuidv4 } = require('uuid');

/**
 * Stage 2 — Server-side API route: /api/apps/upload-apk (POST)
 */
exports.uploadApkSecure = async (req, res, next) => {
  try {
    const file = req.files && req.files['appFile'] ? req.files['appFile'][0] : req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // 1. Magic Bytes Check (PK\x03\x04 for ZIP/APK)
    const magicBytes = file.buffer.slice(0, 4).toString('hex');
    const ZIP_MAGIC = '504b0304'; // PK\x03\x04 in hex
    
    if (magicBytes !== ZIP_MAGIC) {
      return res.status(400).json({ message: 'Invalid file type. Not a valid APK/ZIP signature.' });
    }

    // 2. Upload to Storage (Using B2 to bypass Supabase RLS limits)
    const uuid = uuidv4();
    const safeName = file.originalname.replace(/\s+/g, '_');
    const storagePath = `apps/pending/${uuid}-${safeName}`;
    
    const uploadResult = await uploadToB2(storagePath, file.buffer, file.mimetype, true);
    if (!uploadResult.success) {
      return res.status(500).json({ message: 'Storage upload failed.', error: uploadResult.error });
    }

    // 3. Create record in apps table (MongoDB in this project)
    const app = await App.create({
      title: req.body.title || safeName,
      description: req.body.description || 'No description provided.',
      category: req.body.category || ['Other'],
      developer: req.user._id,
      developerName: req.user.name,
      fileUrl: uploadResult.url,
      fileName: safeName,
      fileSize: file.size,
      status: 'pending_scan',
      vtResult: null
    });

    // 4. Trigger VirusTotal scan asynchronously
    runBackgroundScan(app._id, file.buffer, file.originalname)
      .catch(err => console.error('[SCAN_TRIGGER_ERROR]:', err.message));

    // 5. Success response
    res.status(201).json({ 
      message: 'App submitted for security scanning.', 
      appId: app._id,
      status: 'pending_scan'
    });

  } catch (error) {
    console.error('[SECURE_UPLOAD_ERROR]:', error);
    next(error);
  }
};
