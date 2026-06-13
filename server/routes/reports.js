const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const App = require('../models/App');
const { auth } = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

// POST /api/reports — requires auth, creates report
router.post('/', auth, async (req, res) => {
  try {
    const { appId, category, customReason } = req.body;

    const existingReport = await Report.findOne({ app: appId, reportedBy: req.user._id });
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this app.' });
    }

    const report = await Report.create({
      app: appId,
      reportedBy: req.user._id,
      category,
      customReason
    });

    // Auto-set app.isFlagged = true when report count hits 5+
    const reportCount = await Report.countDocuments({ app: appId });
    if (reportCount >= 5) {
      await App.findByIdAndUpdate(appId, { isFlagged: true, flaggedAt: new Date() });
    }

    res.status(201).json({ message: 'Report submitted successfully.', report });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error while submitting report.' });
  }
});

// GET /api/reports — requires admin, returns reports grouped by app
router.get('/', requireAdmin, async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate('app', 'title')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
    
    // Grouping logic could be added here if needed by the frontend
    res.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error fetching reports.' });
  }
});

// GET /api/reports/app/:appId — requires auth, checks if current user already reported this app
router.get('/app/:appId', auth, async (req, res) => {
  try {
    const report = await Report.findOne({ app: req.params.appId, reportedBy: req.user._id });
    res.json({ reported: !!report });
  } catch (error) {
    console.error('Check report error:', error);
    res.status(500).json({ message: 'Server error checking report status.' });
  }
});

module.exports = router;
