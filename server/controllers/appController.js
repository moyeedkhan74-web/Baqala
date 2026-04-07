const App = require('../models/App');
const fs = require('fs');
const path = require('path');
const { uploadToB2 } = require('../utils/b2Storage');

exports.createApp = async (req, res, next) => {
  try {
    // Ensure we have strings for description to prevent .substring() crashes
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    const shortDescription = req.body.shortDescription 
      ? String(req.body.shortDescription).substring(0, 200) 
      : description.substring(0, 200);
      
    const category = req.body.category || 'Other';
    const version = req.body.version || '1.0.0';
    const platform = req.body.platform || 'Cross-platform';
    const developerName = req.body.developerName || (req.user ? req.user.name : 'Unknown');
    const tags = req.body.tags;
    const tagline = req.body.tagline ? String(req.body.tagline).substring(0, 100) : '';

    const serverUrl = req.protocol + '://' + req.get('host');
    const appFile = req.files && req.files.appFile ? req.files.appFile[0] : null;
    const fileUrl = req.body.fileUrl || (appFile ? `${serverUrl}/uploads/apps/${appFile.filename}` : null);
    const fileName = req.body.fileName || (appFile ? appFile.originalname : 'unknown');
    const fileSize = req.body.fileSize || (appFile ? appFile.size : 0);

    if (!fileUrl) {
      return res.status(400).json({ message: 'App file is required.' });
    }

    let icon = req.body.icon || '';
    if (req.files && req.files.icon) {
      icon = `${serverUrl}/uploads/icons/${req.files.icon[0].filename}`;
    }

    const screenshots = req.body.screenshots || [];
    if (req.files && req.files.screenshots) {
      req.files.screenshots.forEach(f => {
        screenshots.push(`${serverUrl}/uploads/screenshots/${f.filename}`);
      });
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
      icon,
      screenshots,
      version,
      platform,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : []
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
    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    if (app.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this app.' });
    }

    const updates = {};
    if (req.files && req.files.icon && req.files.icon[0]) {
      const iconFile = req.files.icon[0];
      const iconBuffer = fs.readFileSync(iconFile.path);
      const iconRes = await uploadToB2(`icons/${Date.now()}_${iconFile.filename}`, iconBuffer, iconFile.mimetype);
      if (iconRes.success) updates.icon = iconRes.url;
      fs.unlinkSync(iconFile.path);
    }

    if (req.files && req.files.screenshots) {
      const screenshotUrls = [];
      for (const f of req.files.screenshots) {
        const buf = fs.readFileSync(f.path);
        const res = await uploadToB2(`screenshots/${Date.now()}_${f.filename}`, buf, f.mimetype);
        if (res.success) screenshotUrls.push(res.url);
        fs.unlinkSync(f.path);
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
      const f = req.files.icon[0];
      const buf = fs.readFileSync(f.path);
      const sup = await uploadToB2(`icons/${Date.now()}_${f.filename}`, buf, f.mimetype);
      if (sup.success) result.icon = sup.url;
      fs.unlinkSync(f.path);
    }

    if (req.files && req.files.screenshots) {
      for (const f of req.files.screenshots) {
        const buf = fs.readFileSync(f.path);
        const sup = await uploadToB2(`screenshots/${Date.now()}_${f.filename}`, buf, f.mimetype);
        if (sup.success) result.screenshots.push(sup.url);
        fs.unlinkSync(f.path);
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

    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }
    if (platform) {
      query.platform = platform;
    }

    let sortOption = {};
    switch (sort) {
      case 'rating':
        sortOption = { averageRating: -1 };
        break;
      case 'downloads':
        sortOption = { totalDownloads: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
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
    console.error('Get apps error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id)
      .populate('developer', 'name email avatar bio');

    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    res.json({ app });
  } catch (error) {
    console.error('Get app error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    if (app.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this app.' });
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
    console.error('Update app error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    if (app.developer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this app.' });
    }

    const deleteFile = async (fileUrl) => {
      if (!fileUrl || typeof fileUrl !== 'string') return;
      
      // If B2 URL
      if (fileUrl.includes('.backblazeb2.com/')) {
        try {
          const urlParts = fileUrl.split('.backblazeb2.com/');
          if (urlParts.length === 2) {
            const b2Path = urlParts[1];
            // If the URL has the bucket name prepended to the subdomain, handle it
            // e.g. https://bucket.s3.region.backblazeb2.com/path
            const cleanPath = b2Path.startsWith('/') ? b2Path.substring(1) : b2Path;
            const { deleteFromB2 } = require('../utils/b2Storage');
            await deleteFromB2(cleanPath);
          }
        } catch (err) {
          console.error('Error deleting B2 file:', fileUrl, err);
        }
      } 
      // If Local URL
      else if (fileUrl.includes('/uploads/')) {
        try {
          const urlParts = fileUrl.split('/uploads/');
          if (urlParts.length === 2) {
            const localPath = path.join(__dirname, '..', 'uploads', urlParts[1]);
            if (fs.existsSync(localPath)) {
              fs.unlinkSync(localPath);
            }
          }
        } catch (err) {
          console.error('Error deleting local file:', fileUrl, err);
        }
      }
    };

    // Delete app payload, icon, and all screenshots
    await deleteFile(app.fileUrl);
    await deleteFile(app.icon);
    if (app.screenshots && Array.isArray(app.screenshots)) {
      for (const screenUrl of app.screenshots) {
        await deleteFile(screenUrl);
      }
    }

    await App.findByIdAndDelete(req.params.id);
    res.json({ message: 'App deleted successfully.' });
  } catch (error) {
    console.error('Delete app error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getMyApps = async (req, res) => {
  try {
    const apps = await App.find({ developer: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ apps });
  } catch (error) {
    console.error('Get my apps error:', error);
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
