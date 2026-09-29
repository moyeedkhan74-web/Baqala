const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const hashKey = (rawKey) => crypto.createHash('sha256').update(rawKey).digest('hex');

const extractPrefix = (rawKey) => {
  const parts = String(rawKey).split('_');
  return parts.length >= 2 ? `${parts[0]}_${parts[1]}` : String(rawKey).slice(0, 8);
};

const apiKeyAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token or API key provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const prefix = extractPrefix(token);

    const apiKey = await ApiKey.findOne({ prefix, status: 'active' });
    if (apiKey) {
      const keyHash = hashKey(token);
      if (apiKey.keyHash !== keyHash) {
        return res.status(401).json({ message: 'Invalid API key.' });
      }

      apiKey.lastUsedAt = new Date();
      await apiKey.save();

      const user = await User.findById(apiKey.developer);
      if (!user) {
        return res.status(401).json({ message: 'API key owner not found.' });
      }

      req.user = user;
      req.apiKey = apiKey;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Token is invalid. User not found.' });
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: 'Session expired or invalidated. Please log in again.' });
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

module.exports = { apiKeyAuth, hashKey, extractPrefix };
