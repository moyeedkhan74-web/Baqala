const App = require('../models/App');
const fs = require('fs');
const path = require('path');

exports.createApp = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'App file is required.' });
    }

    const { title, description, shortDescription, category, version, platform, tags } = req.body;

    const app = await App.create({
      title,
      description,
      shortDescription: shortDescription || description.substring(0, 200),
      category,
      developer: req.user._id,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      version: version || '1.0.0',
      platform: platform || 'Cross-platform',
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : []
    });

    await app.populate('developer', 'name email avatar');

    res.status(201).json({ app });
  } catch (error) {
    console.error('Create app error:', error);
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ message: 'Server error while creating app.' });
  }
};

exports.uploadAppImages = async (req, res) => {
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
      updates.icon = '/uploads/icons/' + req.files.icon[0].filename;
    }
    if (req.files && req.files.screenshots) {
      updates.screenshots = req.files.screenshots.map(f => '/uploads/screenshots/' + f.filename);
    }

    const updatedApp = await App.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('developer', 'name email avatar');

    res.json({ app: updatedApp });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ message: 'Server error while uploading images.' });
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

    const query = { status: 'approved' };

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

    // Delete file from disk
    if (app.filePath && fs.existsSync(app.filePath)) {
      fs.unlinkSync(app.filePath);
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
