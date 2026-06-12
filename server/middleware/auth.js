const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Token is invalid. User not found.' });
    }

    if (user.isBanned) {
      if (user.banUntil && new Date(user.banUntil) <= new Date()) {
        // Auto-lift ban
        user.isBanned = false;
        user.banUntil = null;
        user.banReason = null;
        await user.save();
      } else {
        return res.status(403).json({ 
          message: `Your account has been banned. Reason: ${user.banReason || 'No reason provided'}`, 
          banUntil: user.banUntil,
          reason: user.banReason
        });
      }
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
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && !user.isBanned) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
  }
  next();
};

/**
 * softAuth blocks banned users if a token is provided,
 * but allows unauthenticated (guest) users.
 */
const softAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (user) {
        if (user.isBanned) {
          if (user.banUntil && new Date(user.banUntil) <= new Date()) {
            // Auto-lift expired ban
            user.isBanned = false;
            user.banUntil = null;
            user.banReason = null;
            await user.save();
            req.user = user;
          } else {
            return res.status(403).json({ 
              message: `Your account has been banned. Reason: ${user.banReason || 'No reason provided'}`, 
              banUntil: user.banUntil,
              reason: user.banReason
            });
          }
        } else {
          req.user = user;
        }
      }
    }
  } catch (error) {
    // Silently ignore invalid tokens, treat as guest
  }
  next();
};

module.exports = { auth, optionalAuth, softAuth };
