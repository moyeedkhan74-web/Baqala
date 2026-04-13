const App = require('../models/App');
const { uploadToB2, deleteFromB2, getDownloadUrl } = require('../utils/b2Storage');
const sharp = require('sharp');

// Helper to optimize and upload images directly to cloud
const optimizeAndUpload = async (file, folder = 'icons') => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.originalname.replace(/\s+/g, '_')}.webp`;
    const filePath = `${folder}/${fileName}`;

    // Optimization: WebP, 80% quality, max 1080p width
    const buffer = await sharp(file.buffer)
      .resize({ width: 1080, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Default to Public bucket for photos
    const result = await uploadToB2(filePath, buffer, 'image/webp', false);
    return result.success ? result.url : null;
  } catch (err) {
    console.error(`Optimization error [${folder}]:`, err);
    return null;
  }
};

exports.getAppDownloadLink = async (req, res, next) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found.' });
    
    // Extract path from B2 URL
    // e.g. https://baqalaaa.s3.us-east-005.backblazeb2.com/apps/123_app.zip
    const urlParts = app.fileUrl.split('.backblazeb2.com/');
    if (urlParts.length !== 2) {
      return res.status(400).json({ message: 'Invalid file URL format.' });
    }
    const b2Path = urlParts[1].startsWith('/') ? urlParts[1].substring(1) : urlParts[1];
    
    const result = await getDownloadUrl(b2Path);
    if (!result.success) {
      return res.status(500).json({ message: 'Failed to generate download link.' });
    }

    // Increment download count
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

    // If appFile is uploaded (non-chunked), upload to PRIVATE B2 directly from memory
    const appFile = req.files && req.files.appFile ? req.files.appFile[0] : null;
    if (appFile && !fileUrl) {
      const timestamp = Date.now();
      const path = `apps/${timestamp}_${appFile.originalname.replace(/\s+/g, '_')}`;
      const result = await uploadToB2(path, appFile.buffer, appFile.mimetype, true); // isPrivate = true
      if (result.success) {
        fileUrl = result.url;
        fileName = appFile.originalname;
        fileSize = appFile.size;
      }
    }

    if (!fileUrl) {
      return res.status(400).json({ message: 'App file is required.' });
    }

    // Optimization for Icon (Public)
    let iconUrl = req.body.icon || '';
    if (req.files && req.files.icon) {
      iconUrl = await optimizeAndUpload(req.files.icon[0], 'icons');
    }

    // Optimization for Screenshots (Public)
    const screenshots = req.body.screenshots || [];
    if (req.files && req.files.screenshots) {
      for (const f of req.files.screenshots) {
        const url = await optimizeAndUpload(f, 'screenshots');
        if (url) screenshots.push(url);
      }
    }

    const app = await App.create({
      title,
      description,
      shortDescription,
      tagline,
      category,
      developer: req.user._id,
      developerName,
      fileUrl,
      fileName,
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

    const updates = {};
    if (req.files && req.files.icon && req.files.icon[0]) {
      const url = await optimizeAndUpload(req.files.icon[0], 'icons');
      if (url) updates.icon = url;
    }

    if (req.files && req.files.screenshots) {
      const screenshotUrls = [];
      for (const f of req.files.screenshots) {
        const url = await optimizeAndUpload(f, 'screenshots');
        if (url) screenshotUrls.push(url);
      }
      updates.screenshots = screenshotUrls;
    }

    const updatedApp = await App.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('developer', 'name email avatar');

    res.json({ app: updatedApp });
  } catch (error) {
    next(error);
  }
};

exports.uploadPlaceholderImages = async (req, res, next) => {
  try {
    const result = { icon: '', screenshots: [] };

    if (req.files && req.files.icon && req.files.icon[0]) {
      result.icon = await optimizeAndUpload(req.files.icon[0], 'icons');
    }

    if (req.files && req.files.screenshots) {
      for (const f of req.files.screenshots) {
        const url = await optimizeAndUpload(f, 'screenshots');
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

    const { title, description, shortDescription, category, version, platform, tags } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (shortDescription) updates.shortDescription = shortDescription;
    if (category) updates.category = category;
    if (version) updates.version = version;
    if (platform) updates.platform = platform;
    if (tags) updates.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;

    const updatedApp = await App.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate('developer', 'name email avatar');

    res.json({ app: updatedApp });
  } catch (error) {
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

    const deleteFile = async (fileUrl) => {
      if (!fileUrl || typeof fileUrl !== 'string') return;
      if (fileUrl.includes('.backblazeb2.com/')) {
        try {
          const urlParts = fileUrl.split('.backblazeb2.com/');
          if (urlParts?.length === 2) {
            const b2Path = urlParts[1].startsWith('/') ? urlParts[1].substring(1) : urlParts[1];
            
            // Detect which bucket based on the subdomain (bucket name)
            // Public: baqala | Private: baqalaaa
            const isPrivate = fileUrl.includes('baqalaaa.');
            await deleteFromB2(b2Path, isPrivate);
          }
        } catch (err) {
          console.error('B2 Delete Error:', err);
        }
      } 
    };

    await deleteFile(app.fileUrl);
    await deleteFile(app.icon);
    if (app.screenshots) {
      for (const screenUrl of app.screenshots) await deleteFile(screenUrl);
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
