const App = require('../models/App');
const Download = require('../models/Download');
const Review = require('../models/Review');
const mongoose = require('mongoose');

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const formatDateLabel = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// GET /api/developer/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 90);
    const appId = req.query.appId;
    const developerId = req.user._id;

    const appQuery = { developer: developerId };
    if (!appId || !mongoose.Types.ObjectId.isValid(appId)) {
      appQuery.status = 'approved';
    } else {
      appQuery._id = appId;
    }

    const apps = await App.find(appQuery).select('_id title category platform totalDownloads averageRating fileSize versionHistory').lean();
    const appIds = apps.map(a => a._id);

    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const dayMs = 24 * 60 * 60 * 1000;

    // Downloads in period
    const downloadsInPeriodAgg = await Download.aggregate([
      { $match: { app: { $in: appIds }, createdAt: { $gte: periodStart } } },
      { $group: { _id: '$app', count: { $sum: 1 } } }
    ]);
    const downloadsInPeriodMap = new Map(downloadsInPeriodAgg.map(r => [String(r._id), r.count]));

    const totalDownloadsInPeriod = downloadsInPeriodAgg.reduce((sum, r) => sum + r.count, 0);

    // Daily breakdown
    const timeseries = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = startOfDay(new Date(now.getTime() - i * dayMs));
      const dayEnd = endOfDay(new Date(now.getTime() - i * dayMs));
      const dayDownloads = await Download.countDocuments({ app: { $in: appIds }, createdAt: { $gte: dayStart, $lte: dayEnd } });
      timeseries.push({
        date: formatDateLabel(dayStart),
        impressions: dayDownloads,
        downloads: dayDownloads
      });
    }

    // Bandwidth consumed in period (approximate using fileSize * downloads in period)
    let bandwidthBytes = 0;
    for (const app of apps) {
      const dlCount = downloadsInPeriodMap.get(String(app._id)) || 0;
      bandwidthBytes += (app.fileSize || 0) * dlCount;
    }
    const bandwidthGB = bandwidthBytes / (1024 * 1024 * 1024);

    // Active installs = cumulative total downloads across developer's apps
    const activeInstalls = apps.reduce((sum, a) => sum + (a.totalDownloads || 0), 0);

    // Daily downloads = last 24h
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);
    const dailyDownloads = await Download.countDocuments({ app: { $in: appIds }, createdAt: { $gte: dayStart, $lte: dayEnd } });

    // Avg rating across developer's apps
    const ratedApps = apps.filter(a => a.averageRating > 0);
    const avgRating = ratedApps.length > 0
      ? (ratedApps.reduce((sum, a) => sum + (a.averageRating || 0), 0) / ratedApps.length).toFixed(1)
      : '0.0';

    // Sentiment score from reviews (avg review rating scaled to 100)
    const reviewAgg = await Review.aggregate([
      { $match: { app: { $in: appIds } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, total: { $sum: 1 } } }
    ]);
    const sentimentScore = reviewAgg.length > 0 ? Math.round((reviewAgg[0].avgRating / 5) * 100) : null;

    // Device / platform breakdown (proxy for device breakdown using platform field)
    const platformMap = {};
    apps.forEach(app => {
      const dlCount = downloadsInPeriodMap.get(String(app._id)) || 0;
      const platform = app.platform || 'Unknown';
      platformMap[platform] = (platformMap[platform] || 0) + dlCount;
    });
    const deviceBreakdown = Object.entries(platformMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Category breakdown
    const categoryMap = {};
    apps.forEach(app => {
      const dlCount = downloadsInPeriodMap.get(String(app._id)) || 0;
      const cats = Array.isArray(app.category) ? app.category : [app.category || 'Other'];
      cats.forEach(cat => {
        categoryMap[cat] = (categoryMap[cat] || 0) + dlCount;
      });
    });
    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const overview = {
      impressions: totalDownloadsInPeriod,
      downloads: totalDownloadsInPeriod,
      bandwidthGB: parseFloat(bandwidthGB.toFixed(2)),
      activeInstalls,
      dailyDownloads,
      avgRating: parseFloat(avgRating),
      sentimentScore
    };

    res.json({ overview, timeseries, deviceBreakdown, categoryBreakdown });
  } catch (error) {
    console.error('Developer analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics.' });
  }
};

// GET /api/developer/releases
exports.getReleases = async (req, res) => {
  try {
    const developerId = req.user._id;
    const apps = await App.find({ developer: developerId })
      .select('title icon versionHistory')
      .lean();

    const releases = [];
    apps.forEach(app => {
      const history = app.versionHistory || [];
      history.forEach(entry => {
        const changelog = entry.changelog ? entry.changelog.split('\n').filter(line => line.trim() !== '') : [];
        releases.push({
          _id: entry._id,
          appId: app._id,
          appIcon: app.icon || '',
          appName: app.title,
          buildNumber: entry.version,
          channel: entry.releaseChannel || 'production',
          version: entry.version,
          rolloutPercentage: entry.rolloutPercentage ?? 100,
          changelog,
          releasedAt: entry.releasedAt
        });
      });
    });

    releases.sort((a, b) => new Date(b.releasedAt) - new Date(a.releasedAt));
    res.json({ releases });
  } catch (error) {
    console.error('Developer releases error:', error);
    res.status(500).json({ message: 'Server error fetching releases.' });
  }
};

// POST /api/developer/releases/:id/rollout
exports.updateRollout = async (req, res) => {
  try {
    const { percentage } = req.body;
    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return res.status(400).json({ message: 'Rollout percentage must be between 0 and 100.' });
    }

    const releaseId = req.params.id;
    const app = await App.findOne({ developer: req.user._id, 'versionHistory._id': releaseId });
    if (!app) {
      return res.status(404).json({ message: 'Release not found.' });
    }

    const historyEntry = app.versionHistory.id(releaseId);
    if (!historyEntry) {
      return res.status(404).json({ message: 'Release entry not found.' });
    }

    historyEntry.rolloutPercentage = parseInt(percentage, 10);
    await app.save();

    res.json({ message: 'Rollout updated.', rolloutPercentage: historyEntry.rolloutPercentage });
  } catch (error) {
    console.error('Update rollout error:', error);
    res.status(500).json({ message: 'Server error updating rollout.' });
  }
};

// POST /api/developer/releases/:id/promote
exports.promoteRelease = async (req, res) => {
  try {
    const { targetChannel } = req.body;
    const validChannels = ['alpha', 'beta', 'production'];
    if (!validChannels.includes(targetChannel)) {
      return res.status(400).json({ message: 'Invalid target channel.' });
    }

    const releaseId = req.params.id;
    const app = await App.findOne({ developer: req.user._id, 'versionHistory._id': releaseId });
    if (!app) {
      return res.status(404).json({ message: 'Release not found.' });
    }

    const historyEntry = app.versionHistory.id(releaseId);
    if (!historyEntry) {
      return res.status(404).json({ message: 'Release entry not found.' });
    }

    historyEntry.releaseChannel = targetChannel;
    await app.save();

    res.json({ message: `Promoted to ${targetChannel}.`, channel: targetChannel });
  } catch (error) {
    console.error('Promote release error:', error);
    res.status(500).json({ message: 'Server error promoting release.' });
  }
};
