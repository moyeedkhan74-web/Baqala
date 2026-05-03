const App = require('../models/App');
const { uploadToB2, deleteFromB2, getDownloadUrl } = require('../utils/b2Storage');

// Helper to upload assets directly to cloud (no compression to maintain original quality)
const uploadAsset = async (file, folder = 'icons') => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.originalname.replace(/\s+/g, '_')}`;
    const filePath = `${folder}/${fileName}`;

    // Upload original buffer and mimetype (No compression)
    const result = await uploadToB2(filePath, file.buffer, file.mimetype, false);
    return result.success ? result.url : null;
  } catch (err) {
    console.error(`Upload error [${folder}]:`, err);
    return null;
  }
};

// Helper to delete any file from B2 (detects bucket automatically)
const deleteFileFromB2 = async (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return;
  
  try {
    const b2Path = exports.extractB2Key(rawUrl);
    if (!b2Path) return;

    // Detect which bucket based on the subdomain or path (bucket name)
    // Note: This logic assumes the account swap where binaries are in PUBLIC and images in PRIVATE
    const isPrivate = rawUrl.includes('baqalaaa') || !rawUrl.includes('/apps/');
    
    console.log(`[B2 DELETE] Path: "${b2Path}" | Private: ${isPrivate}`);
    await deleteFromB2(b2Path, isPrivate);
  } catch (err) {
    console.error('B2 Surgical Delete Error:', err);
  }
};

exports.getAppDownloadLink = async (req, res, next) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found.' });
    
    // Support both B2 and legacy (Supabase) URLs
    if (!app.fileUrl.includes('.backblazeb2.com/')) {
      console.log(`[DOWNLOAD] Serving legacy URL: ${app.fileUrl}`);
      app.totalDownloads += 1;
      await app.save();
      return res.json({ downloadUrl: app.fileUrl });
    }

    console.log(`[DOWNLOAD] Generating link for URL: ${app.fileUrl}`);
    const result = await getDownloadUrl(app.fileUrl);
    
    if (!result.success) {
      return res.status(500).json({ message: 'Failed to generate download link.' });
    }

    app.totalDownloads += 1;
    await app.save();

    res.json({ downloadUrl: result.url });
  } catch (error) {
    next(error);
  }
};

exports.createApp = async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    const shortDescription = req.body.shortDescription 
      ? String(req.body.shortDescription).substring(0, 200) 
      : description.substring(0, 200);
      
    const category = req.body.category || 'Other';
    const version = req.body.version || '1.0.0';
    const platform = req.body.platform || 'Cross-platform';
    const developerName = req.body.developerName || (req.user ? req.user.name : 'Unknown');
    const tagline = req.body.tagline ? String(req.body.tagline).substring(0, 100) : '';

    let fileUrl = req.body.fileUrl;
    let fileName = req.body.fileName || 'unknown';
    let fileSize = req.body.fileSize || 0;

    const appFile = req.files && req.files.appFile ? req.files.appFile[0] : null;
    if (appFile && !fileUrl) {
      const timestamp = Date.now();
      const path = `apps/${timestamp}_${appFile.originalname.replace(/\s+/g, '_')}`;
      const result = await uploadToB2(path, appFile.buffer, appFile.mimetype, true);
      if (result.success) {
        fileUrl = result.url;
        fileName = appFile.originalname;
        fileSize = appFile.size;
      }
    }

    if (!fileUrl) {
      return res.status(400).json({ message: 'App file is required.' });
    }

    let iconUrl = req.body.icon || '';
    if (req.files && req.files.icon) {
      iconUrl = await uploadAsset(req.files.icon[0], 'icons');
    }

    const screenshots = req.body.screenshots || [];
    if (req.files && req.files.screenshots) {
      for (const f of req.files.screenshots) {
        const url = await uploadAsset(f, 'screenshots');
        if (url) screenshots.push(url);
      }
    }

    // Global Scrubbing on Creation
    const { extractB2Key } = require('../utils/b2Storage');
    let scrubbedFileUrl = fileUrl;
    let scrubbedFileName = fileName;
    
    if (fileUrl) {
      const key = extractB2Key(fileUrl);
      if (key) {
        scrubbedFileUrl = `https://${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${key}`;
      }
    }
    if (fileName) {
      scrubbedFileName = fileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    }

    const app = await App.create({
      title,
      description,
      shortDescription,
      tagline,
      category,
      developer: req.user._id,
      developerName,
      fileUrl: scrubbedFileUrl,
      fileName: scrubbedFileName,
      fileSize,
      icon: iconUrl,
      screenshots,
      version,
      platform,
      tags: req.body.tags ? (typeof req.body.tags === 'string' ? req.body.tags.split(',').map(t => t.trim()) : req.body.tags) : []
    });

    await app.populate('developer', 'name email avatar');
    res.status(201).json({ app });
  } catch (error) {
    next(error);
  }
};

exports.uploadAppImages = async (req, res, next) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found.' });
    if (app.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    if (req.files && req.files.icon && req.files.icon[0]) {
      // Delete old icon
      if (app.icon) await deleteFileFromB2(app.icon);
      const url = await uploadAsset(req.files.icon[0], 'icons');
      if (url) app.icon = url;
    }

    if (req.files && req.files.screenshots) {
      for (const f of req.files.screenshots) {
        const url = await uploadAsset(f, 'screenshots');
        if (url) app.screenshots.push(url);
      }
    }

    await app.save();
    const updatedApp = await App.findById(app._id).populate('developer', 'name email avatar');
    res.json({ app: updatedApp });
  } catch (error) {
    next(error);
  }
};

exports.removeScreenshot = async (req, res, next) => {
  try {
    const { screenshotUrl } = req.body;
    const appId = req.params.id;
    
    if (!screenshotUrl) {
      return res.status(400).json({ message: 'Target asset URL is missing in request.' });
    }

    const app = await App.findById(appId);
    if (!app) return res.status(404).json({ message: 'Project synchronization lost: App not found.' });

    // Authorization: Must be developer OR Admin
    const isDeveloper = app.developer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isDeveloper && !isAdmin) {
      console.warn(`[AUTH REJECTION] User ${req.user._id} attempted to delete asset for App ${appId} (Developer: ${app.developer})`);
      return res.status(403).json({ message: `Access Denied: You are not authorized to manage this project. (Role: ${req.user.role})` });
    }

    // Surgical match: strip query params
    const cleanTarget = screenshotUrl.split('?')[0].split('#')[0];
    
    console.log(`[ASSET REMOVAL] Initiating for: ${cleanTarget}`);
    await deleteFileFromB2(screenshotUrl);
    
    const originalCount = app.screenshots.length;
    app.screenshots = app.screenshots.filter(s => {
      const cleanS = s.split('?')[0].split('#')[0];
      return cleanS !== cleanTarget;
    });
    
    if (app.screenshots.length === originalCount) {
      console.warn(`[SYNC WARNING] Target URL not found in gallery array: ${cleanTarget}`);
    }

    await app.save();
    console.log(`[ASSET REMOVAL] Success. Remaining: ${app.screenshots.length}`);

    res.json({ success: true, screenshots: app.screenshots });
  } catch (error) {
    console.error('[ASSET REMOVAL ERROR]:', error);
    res.status(500).json({ message: `Internal Removal Error: ${error.message}` });
  }
};

exports.removeAllScreenshots = async (req, res, next) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found.' });
    
    const isDeveloper = app.developer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isDeveloper && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to clear this gallery.' });
    }

    if (app.screenshots && app.screenshots.length > 0) {
      console.log(`[GALLERY WIPE] Clearing ${app.screenshots.length} assets for App: ${app._id}`);
      for (const url of app.screenshots) {
        await deleteFileFromB2(url);
      }
    }

    app.screenshots = [];
    await app.save();

    res.json({ success: true, screenshots: [] });
  } catch (error) {
    console.error('[GALLERY WIPE ERROR]:', error);
    res.status(500).json({ message: 'Mass removal failed.' });
  }
};

exports.uploadPlaceholderImages = async (req, res, next) => {
  try {
    const result = { icon: '', screenshots: [] };

    if (req.files && req.files.icon && req.files.icon[0]) {
      result.icon = await uploadAsset(req.files.icon[0], 'icons');
    }

    if (req.files && req.files.screenshots) {
      for (const f of req.files.screenshots) {
        const url = await uploadAsset(f, 'screenshots');
        if (url) result.screenshots.push(url);
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getApps = async (req, res) => {
  try {
    const {
      search,
      category,
      platform,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const query = { status: { $in: ['approved', 'pending'] } };
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (platform) query.platform = platform;

    let sortOption = {};
    switch (sort) {
      case 'rating': sortOption = { averageRating: -1 }; break;
      case 'downloads': sortOption = { totalDownloads: -1 }; break;
      case 'oldest': sortOption = { createdAt: 1 }; break;
      case 'newest': 
      default: sortOption = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [apps, total] = await Promise.all([
      App.find(query)
        .populate('developer', 'name avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      App.countDocuments(query)
    ]);

    res.json({
      apps,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id)
      .populate('developer', 'name email avatar bio');
    if (!app) return res.status(404).json({ message: 'App not found.' });
    res.json({ app });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found.' });
    if (app.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const { 
      title, description, shortDescription, category, 
      version, platform, tags, fileUrl, fileName, fileSize,
      developerName, tagline
    } = req.body;

    // Handle binary replacement cleanup
    if (fileUrl && fileUrl !== app.fileUrl) {
      await deleteFileFromB2(app.fileUrl);
      app.fileUrl = fileUrl;
      app.fileName = fileName || 'updated_file';
      app.fileSize = fileSize || 0;
    }
    
    // Global Scrubbing on Update: Ensure DB stays clean
    if (app.fileUrl) {
      const { extractB2Key } = require('../utils/b2Storage');
      const key = extractB2Key(app.fileUrl);
      if (key) {
        // Force the URL to use the scrubbed key and direct B2 link
        const urlParts = app.fileUrl.split('.backblazeb2.com/');
        if (urlParts.length === 2) {
          app.fileUrl = `${urlParts[0]}.backblazeb2.com/${process.env.B2_BUCKET_NAME}/${key}`;
        } else if (app.fileUrl.includes('/api/assets/')) {
          // If it was a proxy URL, convert it to a direct B2 URL for the DB
          app.fileUrl = `https://${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${key}`;
        }
      }
      if (app.fileName) {
        // Aggressive filename scrubbing for the DB record
        app.fileName = app.fileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      }
    }

    if (title) app.title = title;
    if (description) app.description = description;
    if (shortDescription !== undefined) app.shortDescription = shortDescription;
    if (tagline !== undefined) app.tagline = tagline;
    if (category) app.category = category;
    if (version) app.version = version;
    if (platform) app.platform = platform;
    if (developerName) app.developerName = developerName;
    if (tags) app.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;

    await app.save();
    const updatedApp = await App.findById(app._id).populate('developer', 'name email avatar');

    res.json({ app: updatedApp });
  } catch (error) {
    console.error('Update App Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found.' });
    if (app.developer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    await deleteFileFromB2(app.fileUrl);
    await deleteFileFromB2(app.icon);
    if (app.screenshots) {
      for (const screenUrl of app.screenshots) await deleteFileFromB2(screenUrl);
    }

    await App.findByIdAndDelete(req.params.id);
    res.json({ message: 'App deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getMyApps = async (req, res) => {
  try {
    const apps = await App.find({ developer: req.user._id }).sort({ createdAt: -1 });
    res.json({ apps });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getCategories = async (req, res) => {
  const categories = [
    'Games', 'Social', 'Productivity', 'Education',
    'Entertainment', 'Tools', 'Finance', 'Health',
    'Music', 'Photography', 'Shopping', 'Travel',
    'Food', 'Sports', 'News', 'Developer Tools', 'Other'
  ];
  res.json({ categories });
};
