const App = require('../models/App');

/**
 * Middleware to check if the current user is the owner of the app
 * or has administrative privileges.
 */
const requireOwner = async (req, res, next) => {
  try {
    const app = await App.findById(req.params.id);

    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    // Check if user is the developer or an admin
    const isDeveloper = app.developer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isDeveloper && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. You do not own this app.' });
    }

    // Attach app to request object for use in controllers
    req.app = app;
    next();
  } catch (error) {
    console.error('[REQUIRE_OWNER_ERROR]:', error);
    res.status(500).json({ message: 'Server error during ownership verification.' });
  }
};

module.exports = requireOwner;
