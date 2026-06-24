const App = require('../models/App');
const { uploadBinary, uploadImage } = require('../utils/b2Storage');
const { runBackgroundScan } = require('../services/backgroundScan');
const { v4: uuidv4 } = require('uuid');

/**
 * Stage 2 — Server-side API route: /api/apps/upload-apk (POST)
 */
exports.uploadApkSecure = async (req, res, next) => {
  try {
    const file = req.files && req.files['appFile'] ? req.files['appFile'][0] : req.file;
    if (!file) {
      return res.status(400).json({ message: 'No payload file uploaded.' });
    }

    // 1. Magic Bytes Check (PK\x03\x04 for ZIP/APK, MZ for EXE)
    const magicBytes = file.buffer.slice(0, 4).toString('hex');
    const ZIP_MAGIC = '504b0304';
    const EXE_MAGIC = '4d5a'; // MZ in hex
    
    const isZipBased = magicBytes === ZIP_MAGIC;
    const isExe = magicBytes.startsWith(EXE_MAGIC);

    if (!isZipBased && !isExe) {
      return res.status(400).json({ 
        message: 'Invalid file format signature. Supported: APK (ZIP-based) and EXE.',
        detectedSignature: magicBytes.substring(0, 8)
      });
    }

    // 2. Upload Binary to Storage (Using B2)
    const uuid = uuidv4();
    const safeName = file.originalname.replace(/\s+/g, '_');
    const storagePath = `apps/pending/${uuid}-${safeName}`;
    
    const uploadResult = await uploadBinary(storagePath, file.buffer, file.mimetype);
    if (!uploadResult.success) {
      return res.status(500).json({ message: `Binary storage upload failed: ${uploadResult.error}` });
    }

    // 3. Handle Visual Assets (Icon, Banner & Screenshots)
    let iconUrl = '';
    let bannerUrl = '';
    let screenshotUrls = [];

    // Upload Icon if present
    if (req.files && req.files['icon'] && req.files['icon'][0]) {
      const iconFile = req.files['icon'][0];
      const iconPath = `icons/${uuid}-${iconFile.originalname.replace(/\s+/g, '_')}`;
      const iconUpload = await uploadImage(iconPath, iconFile.buffer, iconFile.mimetype);
      if (iconUpload.success) iconUrl = iconUpload.url;
    }

    // Upload Banner if present
    if (req.files && req.files['banner'] && req.files['banner'][0]) {
      const bannerFile = req.files['banner'][0];
      const bannerPath = `banners/${uuid}-${bannerFile.originalname.replace(/\s+/g, '_')}`;
      const bannerUpload = await uploadImage(bannerPath, bannerFile.buffer, bannerFile.mimetype);
      if (bannerUpload.success) bannerUrl = bannerUpload.url;
    }

    // Upload Screenshots if present
    if (req.files && req.files['screenshots']) {
      for (const [index, ssFile] of req.files['screenshots'].entries()) {
        const ssPath = `apps/screenshots/${uuid}/ss-${index}-${ssFile.originalname.replace(/\s+/g, '_')}`;
        const ssUpload = await uploadImage(ssPath, ssFile.buffer, ssFile.mimetype);
        if (ssUpload.success) screenshotUrls.push(ssUpload.url);
      }
    }

    // 4. Create record in apps table
    const app = await App.create({
      title: req.body.title || safeName,
      description: req.body.description || 'No description provided.',
      tagline: req.body.tagline || '',
      category: req.body.category || ['Other'],
      platform: req.body.platform || 'Android',
      version: req.body.version || '1.0.0',
      developer: req.user._id,
      developerName: req.body.developerName || req.user.name,
      fileUrl: uploadResult.url,
      fileName: safeName,
      fileSize: file.size,
      icon: iconUrl,
      banner: bannerUrl,
      screenshots: screenshotUrls,
      status: 'pending_scan',
      vtResult: null
    });

    // 5. Trigger VirusTotal scan asynchronously
    setImmediate(() => {
      runBackgroundScan(app._id, file.buffer, file.originalname)
        .catch(err => console.error('[SCAN_TRIGGER_ERROR]:', err.message));
    });

    // ─── AI + DEEP APK ANALYSIS (Auto-scan for new pending submission) ───
    setImmediate(async () => {
      try {
        const { extractApkMetadata } = require('../services/apkAnalyzer');
        const { runGeminiApkAnalysis } = require('../services/aiModerationService');
        
        console.log(`[ANALYSIS] Starting new upload AI analysis for ${app._id}`);
        const apkMeta = await extractApkMetadata(file.buffer, app._id.toString());
        await App.findByIdAndUpdate(app._id, { apkMetadata: apkMeta });

        const aiResult = await runGeminiApkAnalysis(
          { title: app.title, category: app.category, description: app.description, tagline: app.tagline },
          apkMeta
        );

        await App.findByIdAndUpdate(app._id, {
          aiModeration: { ...aiResult, analysedAt: new Date() }
        });
        console.log(`[ANALYSIS] ✅ Initial scan complete for ${app.title}`);
      } catch (err) {
        console.error('[INITIAL_ANALYSIS_ERR]:', err.message);
      }
    });

    // 6. Send Notifications
    const { sendUploadConfirmationEmail } = require('../services/emailService');
    const { sendNotification } = require('../services/notificationService');
    if (req.user && req.user.email) {
       setImmediate(async () => {
         try {
           await sendUploadConfirmationEmail(req.user.email, app.title);
           await sendNotification({
             recipient: req.user._id,
             title: '📦 Upload Received',
             message: `We've received your application "${app.title}". It's now in the queue for security scanning and moderation.`,
             type: 'info',
             link: `/developer/apps/${app._id}`
           });
         } catch (err) {
           console.error('[NOTIFY_SECURE_UPLOAD_ERROR]:', err.message);
         }
       });
    }

    // 6. Success response
    res.status(202).json({ 
      message: 'App submitted successfully. Security scanning in progress.', 
      appId: app._id,
      status: 'pending_scan'
    });

  } catch (error) {
    console.error('[SECURE_UPLOAD_ERROR]:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'An unexpected error occurred during deployment.',
      error: error.message 
    });
  }
};
