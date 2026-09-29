const App = require('../models/App');
const Download = require('../models/Download');
const Review = require('../models/Review');
const ApiKey = require('../models/ApiKey');
const Webhook = require('../models/Webhook');
const mongoose = require('mongoose');
const crypto = require('crypto');

const hashKey = (rawKey) => crypto.createHash('sha256').update(rawKey).digest('hex');

const extractPrefix = (rawKey) => {
  const parts = String(rawKey).split('_');
  return parts.length >= 2 ? `${parts[0]}_${parts[1]}` : String(rawKey).slice(0, 8);
};

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

// POST /api/developer/keys/generate
exports.generateApiKey = async (req, res) => {
  try {
    const { name, scopes } = req.body;
    if (!name || !scopes || !scopes.length) {
      return res.status(400).json({ message: 'Key name and scopes are required.' });
    }

    const rawKey = `bq_live_${crypto.randomBytes(24).toString('hex')}`;
    const prefix = extractPrefix(rawKey);
    const keyHash = hashKey(rawKey);

    const apiKey = await ApiKey.create({
      developer: req.user._id,
      name,
      prefix,
      keyHash,
      scopes
    });

    res.status(201).json({
      message: 'API key generated. Save it now, it will not be shown again.',
      key: rawKey,
      keyId: apiKey._id,
      prefix
    });
  } catch (error) {
    console.error('Generate API key error:', error);
    res.status(500).json({ message: 'Server error generating API key.' });
  }
};

// GET /api/developer/keys
exports.getApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ developer: req.user._id })
      .select('name prefix createdAt lastUsedAt status scopes')
      .sort({ createdAt: -1 });

    res.json({ keys });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ message: 'Server error fetching API keys.' });
  }
};

// POST /api/developer/keys/:id/revoke
exports.revokeApiKey = async (req, res) => {
  try {
    const key = await ApiKey.findOne({ _id: req.params.id, developer: req.user._id });
    if (!key) {
      return res.status(404).json({ message: 'API key not found.' });
    }

    key.status = 'revoked';
    await key.save();

    res.json({ message: 'API key revoked.', keyId: key._id });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ message: 'Server error revoking API key.' });
  }
};

// POST /api/developer/webhooks
exports.createWebhook = async (req, res) => {
  try {
    const { url, events, appId, secret } = req.body;
    if (!url || !events || !events.length) {
      return res.status(400).json({ message: 'Webhook URL and at least one event are required.' });
    }

    const webhook = await Webhook.create({
      developer: req.user._id,
      app: appId || null,
      url,
      events,
      secret: secret || ''
    });

    res.status(201).json({ message: 'Webhook created.', webhook });
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({ message: 'Server error creating webhook.' });
  }
};

// GET /api/developer/webhooks
exports.getWebhooks = async (req, res) => {
  try {
    const webhooks = await Webhook.find({ developer: req.user._id })
      .populate('app', 'title')
      .sort({ createdAt: -1 });

    res.json({ webhooks });
  } catch (error) {
    console.error('Get webhooks error:', error);
    res.status(500).json({ message: 'Server error fetching webhooks.' });
  }
};

// DELETE /api/developer/webhooks/:id
exports.deleteWebhook = async (req, res) => {
  try {
    const webhook = await Webhook.findOne({ _id: req.params.id, developer: req.user._id });
    if (!webhook) {
      return res.status(404).json({ message: 'Webhook not found.' });
    }

    await webhook.deleteOne();
    res.json({ message: 'Webhook deleted.', webhookId: webhook._id });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ message: 'Server error deleting webhook.' });
  }
};

// POST /api/developer/webhooks/:id/test
exports.testWebhook = async (req, res) => {
  try {
    const webhook = await Webhook.findOne({ _id: req.params.id, developer: req.user._id });
    if (!webhook) {
      return res.status(404).json({ message: 'Webhook not found.' });
    }

    const axios = require('axios');
    const payload = {
      title: '🧪 Test Ping',
      description: 'This is a test notification from Baqala. Your webhook is configured correctly!',
      color: 5763719,
      fields: [
        { name: 'Status', value: 'Active', inline: true },
        { name: 'URL', value: webhook.url, inline: true }
      ]
    };

    await axios.post(webhook.url, payload, { timeout: 10000 });
    res.json({ message: 'Test notification sent.' });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ message: 'Server error sending test webhook.' });
  }
};

// POST /api/developer/cli-deploy
exports.cliDeploy = async (req, res) => {
  try {
    const appId = req.body.appId;
    const channel = req.body.channel;
    const changelog = req.body.changelog || '';
    const file = req.file;

    if (!appId || !channel || !file) {
      return res.status(400).json({ message: 'appId, channel, and APK file are required.' });
    }

    const validChannels = ['alpha', 'beta', 'stable'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({ message: 'Invalid channel. Use alpha, beta, or stable.' });
    }

    const app = await App.findOne({ developer: req.user._id, _id: appId });
    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    // In a real implementation, you would upload the file to B2 here
    // For now, we'll update the version history with the new deployment
    const versionEntry = {
      version: req.body.version || app.version,
      releaseChannel: channel,
      fileUrl: app.fileUrl, // Would be updated with new B2 URL
      fileName: file.originalname,
      fileSize: file.size,
      changelog,
      releasedAt: new Date(),
      rolloutPercentage: channel === 'stable' ? 100 : 25
    };

    app.versionHistory.push(versionEntry);
    app.releaseChannel = channel;
    app.changelog = changelog;
    await app.save();

    res.json({ message: 'Deployment successful.', version: versionEntry.version, channel });
  } catch (error) {
    console.error('CLI deploy error:', error);
    res.status(500).json({ message: 'Server error during deployment.' });
  }
};

// POST /api/developer/apps/:id/ab-test
exports.updateAbTest = async (req, res) => {
  try {
    const appId = req.params.id;
    const { variants, trafficSplit } = req.body;

    const app = await App.findOne({ developer: req.user._id, _id: appId });
    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    if (!variants || !Array.isArray(variants) || variants.length !== 2) {
      return res.status(400).json({ message: 'Exactly two variants (A and B) are required.' });
    }

    app.marketingVariants = variants.map(v => ({
      variantName: v.variantName,
      icon: v.icon || '',
      banner: v.banner || '',
      impressions: 0,
      downloads: 0
    }));

    app.abTestTrafficSplit = trafficSplit || 50;
    await app.save();

    res.json({ message: 'A/B test updated.', variants: app.marketingVariants });
  } catch (error) {
    console.error('A/B test error:', error);
    res.status(500).json({ message: 'Server error updating A/B test.' });
  }
};

// GET /api/developer/apps/:id/ab-test
exports.getAbTest = async (req, res) => {
  try {
    const appId = req.params.id;
    const app = await App.findOne({ developer: req.user._id, _id: appId }).select('marketingVariants abTestTrafficSplit');
    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    const variants = app.marketingVariants || [];
    const conversionLift = variants.length === 2 && variants[0].impressions > 0
      ? (((variants[1].downloads / variants[1].impressions) - (variants[0].downloads / variants[0].impressions)) * 100).toFixed(1)
      : null;

    res.json({ variants, conversionLift, trafficSplit: app.abTestTrafficSplit });
  } catch (error) {
    console.error('Get A/B test error:', error);
    res.status(500).json({ message: 'Server error fetching A/B test.' });
  }
};

// GET /api/developer/revenue
exports.getRevenue = async (req, res) => {
  try {
    const apps = await App.find({ developer: req.user._id }).select('title totalDownloads earnings payoutHistory');
    const totalEarned = apps.reduce((sum, app) => sum + (app.earnings?.totalEarned || 0), 0);
    const totalCredits = apps.reduce((sum, app) => sum + (app.earnings?.downloadCredits || 0), 0);
    const payoutHistory = apps.flatMap(app => (app.earnings?.payoutHistory || []).map(p => ({ ...p, appTitle: app.title })));

    res.json({
      totalEarned,
      downloadCredits: totalCredits,
      payoutHistory: payoutHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
    });
  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({ message: 'Server error fetching revenue data.' });
  }
};

// POST /api/developer/revenue/payout
exports.requestPayout = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1000) {
      return res.status(400).json({ message: 'Minimum payout amount is 1000 credits.' });
    }

    const apps = await App.find({ developer: req.user._id });
    const totalCredits = apps.reduce((sum, app) => sum + (app.earnings?.downloadCredits || 0), 0);

    if (amount > totalCredits) {
      return res.status(400).json({ message: 'Insufficient credits.' });
    }

    const payout = {
      amount,
      status: 'pending',
      date: new Date()
    };

    await App.updateMany(
      { developer: req.user._id },
      { $inc: { 'earnings.downloadCredits': -amount }, $push: { 'earnings.payoutHistory': payout } }
    );

    res.json({ message: 'Payout request submitted.', payout });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({ message: 'Server error requesting payout.' });
  }
};


