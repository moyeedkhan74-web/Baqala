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

    // BUG-09 FIX: Whitelist only known safe fields. Object.assign with raw req.body
    // allowed injecting internal Mongoose fields like _id, __v, etc.
    const ALLOWED_CONFIG_FIELDS = [
      'maxApkSize',
      'maxImageSize',
      'isMaintenanceMode',
      'maintenanceMessage'
    ];

    ALLOWED_CONFIG_FIELDS.forEach(field => {
      if (updates[field] !== undefined) {
        config[field] = updates[field];
      }
    });

    await config.save();

    res.json({ message: 'Platform configuration updated.', config });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ message: 'Server error updating configuration.' });
  }
};

// POST /api/config/maintenance
// Admin only — instantly toggles maintenance mode and saves
exports.toggleMaintenance = async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = new Config({});
    }

    const newState = !config.isMaintenanceMode;

    config.isMaintenanceMode = newState;
    if (req.body.maintenanceMessage) {
      config.maintenanceMessage = req.body.maintenanceMessage;
    }

    if (newState) {
      // Activating maintenance — record who and when
      config.maintenanceActivatedBy = req.user?.name || req.user?.email || 'Unknown Admin';
      config.maintenanceActivatedAt = new Date();
    } else {
      // Deactivating — clear audit
      config.maintenanceActivatedBy = '';
      config.maintenanceActivatedAt = null;
    }

    await config.save();

    console.log(`🔒 Maintenance ${newState ? 'ENABLED' : 'DISABLED'} by ${config.maintenanceActivatedBy}`);

    res.json({
      message: `Maintenance mode ${newState ? 'enabled' : 'disabled'}.`,
      config
    });
  } catch (error) {
    console.error('Toggle maintenance error:', error);
    res.status(500).json({ message: 'Server error toggling maintenance mode.' });
  }
};
