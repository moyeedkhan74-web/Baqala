const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const admin = require('../config/firebase');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Legacy email/password register (still works without Firebase)
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const allowedRoles = ['user', 'developer'];
    const userRole = allowedRoles.includes(role) ? role : 'user';

    const user = await User.create({ name, email, password, role: userRole });
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// Legacy email/password login (still works without Firebase) 
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Legacy Google login (kept for backward compatibility)
exports.googleLogin = async (req, res) => {
  try {
    const { token, role } = req.body;

    // Try Firebase verification first, fall back to legacy
    let email, name, picture, googleId;

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      email = decodedToken.email;
      name = decodedToken.name || decodedToken.email.split('@')[0];
      picture = decodedToken.picture;
      googleId = decodedToken.uid;
    } catch (firebaseError) {
      // Fall back to legacy Google Auth Library
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy_client_id_for_dev');
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      googleId = payload.sub;
    }

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = user.avatar || picture;
        await user.save();
      }
      if (user.isBanned) return res.status(403).json({ message: 'Your account has been banned.' });
    } else {
      const allowedRoles = ['user', 'developer'];
      const userRole = allowedRoles.includes(role) ? role : 'user';
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        role: userRole
      });
    }

    const jwtToken = generateToken(user);
    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Invalid Google Authentication' });
  }
};

// ========================================
// NEW: Firebase Authentication Endpoints
// ========================================

// Firebase Login — accepts Firebase ID token, verifies it, returns app JWT
exports.firebaseLogin = async (req, res) => {
  try {
    const { idToken, role } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Firebase ID token is required.' });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: 'Email not found in Firebase token.' });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (user) {
      // Update Firebase UID if not set
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        if (picture && !user.avatar) user.avatar = picture;
        await user.save();
      }

      if (user.isBanned) {
        return res.status(403).json({ message: 'Your account has been banned.' });
      }
    } else {
      // Auto-create user for Google sign-in
      const displayName = name || decodedToken.name || email.split('@')[0];
      const allowedRoles = ['user', 'developer'];
      const userRole = allowedRoles.includes(role) ? role : 'user';

      user = await User.create({
        name: displayName,
        email,
        firebaseUid: uid,
        googleId: uid,
        avatar: picture || '',
        role: userRole
      });
    }

    const jwtToken = generateToken(user);

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Firebase Login Error:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Firebase token has expired. Please sign in again.' });
    }
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ message: 'Invalid Firebase token.' });
    }
    res.status(401).json({ message: 'Firebase authentication failed.' });
  }
};

// Firebase Register — accepts Firebase ID token + name/role, creates MongoDB user
exports.firebaseRegister = async (req, res) => {
  try {
    const { idToken, name, role } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Firebase ID token is required.' });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: 'Email not found in Firebase token.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If exists, just login them
      if (existingUser.isBanned) {
        return res.status(403).json({ message: 'Your account has been banned.' });
      }
      if (!existingUser.firebaseUid) {
        existingUser.firebaseUid = uid;
        await existingUser.save();
      }
      const jwtToken = generateToken(existingUser);
      return res.json({
        token: jwtToken,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          avatar: existingUser.avatar,
          createdAt: existingUser.createdAt
        }
      });
    }

    // Create new user
    const allowedRoles = ['user', 'developer'];
    const userRole = allowedRoles.includes(role) ? role : 'user';
    const displayName = name || decodedToken.name || email.split('@')[0];

    const user = await User.create({
      name: displayName,
      email,
      firebaseUid: uid,
      avatar: picture || '',
      role: userRole
    });

    const jwtToken = generateToken(user);

    res.status(201).json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Firebase Register Error:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Firebase token has expired.' });
    }
    res.status(500).json({ message: 'Server error during Firebase registration.' });
  }
};
