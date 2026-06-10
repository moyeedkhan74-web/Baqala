const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Whitelist check: Grant access if email is in ADMIN_EMAILS env var
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const isWhitelisted = user.email && adminEmails.includes(user.email.toLowerCase());

    // Auto-lift ban if user.banUntil has passed
    if (user.isBanned && user.banUntil && new Date(user.banUntil) <= new Date()) {
      user.isBanned = false;
      user.banUntil = null;
      user.banReason = null;
      await user.save();
    }

    if (user.role !== 'admin' && !isWhitelisted) {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired.' });
    }
    res.status(500).json({ message: 'Server error during admin verification.' });
  }
};

module.exports = requireAdmin;
