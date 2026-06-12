const App = require('../models/App');

/**
 * Middleware to check if the authenticated user is the owner of the app
 * or has an admin role.
 */
const requireOwner = async (req, res, next) => {
  try {
    const app = await App.findById(req.params.id);
    
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    // Check if user is the developer of the app OR an admin
    const isOwner = app.developer && app.developer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. You do not own this app.' });
    }

    // Attach app to request for use in controllers
    req.app = app;
    next();
  } catch (error) {
    console.error('Error in requireOwner middleware:', error);
    res.status(500).json({ message: 'Server error during ownership verification.' });
  }
};

module.exports = requireOwner;
