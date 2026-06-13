const Config = require('../models/Config');

// GET /api/config
// Publicly accessible for Home page sections and maintenance status
exports.getConfig = async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create({});
    }
    res.json({ config });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ message: 'Server error fetching configuration.' });
  }
};

// PATCH /api/config
// Admin only
exports.updateConfig = async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = new Config({});
    }

    // Update fields from body
    const updates = req.body;
    
    // Handle nested objects manually or via flat updates
    if (updates.announcement) {
      config.announcement = { ...config.announcement, ...updates.announcement };
      delete updates.announcement;
    }
    if (updates.sections) {
      config.sections = { ...config.sections, ...updates.sections };
      delete updates.sections;
    }

    Object.assign(config, updates);
    await config.save();

    res.json({ message: 'Platform configuration updated.', config });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ message: 'Server error updating configuration.' });
  }
};
