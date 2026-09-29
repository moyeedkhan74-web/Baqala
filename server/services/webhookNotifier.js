const axios = require('axios');
const Webhook = require('../models/Webhook');
const App = require('../models/App');

const DiscordEmbed = (title, description, color, fields = []) => ({
  embeds: [
    {
      title,
      description,
      color,
      fields,
      footer: { text: 'Baqala Developer Notifications' },
      timestamp: new Date().toISOString()
    }
  ]
});

const SlackBlock = (title, text, color = '#36a64f') => ({
  blocks: [
    {
      type: 'header',
      text: { type: 'plain_text', text: title, emoji: true }
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text }
    }
  ]
});

const deliver = async (webhook, payload) => {
  if (!webhook?.url || !webhook.isActive) return;

  try {
    let formatted;
    const lower = webhook.url.toLowerCase();
    if (lower.includes('discord')) {
      formatted = DiscordEmbed(
        payload.title || 'Baqala Alert',
        payload.description || '',
        payload.color || 5763719,
        payload.fields || []
      );
    } else if (lower.includes('slack')) {
      formatted = SlackBlock(
        payload.title || 'Baqala Alert',
        payload.description || '',
        payload.color || '#36a64f'
      );
    } else {
      formatted = payload;
    }

    await axios.post(webhook.url, formatted, { timeout: 10000 });
  } catch (error) {
    console.error(`[WEBHOOK_FAIL] ${webhook.url}:`, error.message);
  }
};

exports.dispatchCriticalCrash = async (crashLog) => {
  try {
    const app = await App.findById(crashLog.app).select('title developer');
    if (!app) return;

    const webhooks = await Webhook.find({
      developer: app.developer,
      isActive: true,
      events: 'crash_critical'
    });

    const description = `**App:** ${app.title}\n**Crash:** ${crashLog.title}\n**Severity:** ${crashLog.aiDiagnostic?.severity || 'critical'}`;
    const payload = {
      title: '🚨 Critical Crash Detected',
      description,
      color: 15548997,
      fields: [
        { name: 'App', value: app.title, inline: true },
        { name: 'Severity', value: crashLog.aiDiagnostic?.severity || 'critical', inline: true }
      ]
    };

    await Promise.all(webhooks.map(w => deliver(w, payload)));
  } catch (error) {
    console.error('Webhook critical crash dispatch error:', error);
  }
};

exports.dispatchNewReview = async (review, app) => {
  if (!app) return;
  try {
    const webhooks = await Webhook.find({
      developer: app.developer,
      isActive: true,
      events: 'new_review'
    });

    const description = `**App:** ${app.title}\n**Rating:** ${review.rating}/5\n**User:** ${review.user?.name || 'Anonymous'}`;
    const payload = {
      title: '⭐ New Review Received',
      description,
      color: 5763719,
      fields: [
        { name: 'App', value: app.title, inline: true },
        { name: 'Rating', value: `${review.rating}/5`, inline: true }
      ]
    };

    await Promise.all(webhooks.map(w => deliver(w, payload)));
  } catch (error) {
    console.error('Webhook new review dispatch error:', error);
  }
};

exports.dispatchMilestone = async (app, milestone) => {
  if (!app) return;
  try {
    const webhooks = await Webhook.find({
      developer: app.developer,
      isActive: true,
      events: 'milestone_download'
    });

    const description = `**App:** ${app.title}\n**Milestone:** ${milestone.toLocaleString()} downloads`;
    const payload = {
      title: '🎉 Download Milestone Reached',
      description,
      color: 5763719,
      fields: [
        { name: 'App', value: app.title, inline: true },
        { name: 'Milestone', value: milestone.toLocaleString(), inline: true }
      ]
    };

    await Promise.all(webhooks.map(w => deliver(w, payload)));
  } catch (error) {
    console.error('Webhook milestone dispatch error:', error);
  }
};

exports.checkMilestone = async (appId) => {
  try {
    const app = await App.findById(appId).select('title developer totalDownloads');
    if (!app) return;

    const milestones = [100, 1000, 10000];
    const current = app.totalDownloads || 0;
    const reached = milestones.find(m => current >= m && current - (app._previousTotalDownloads || 0) < m);

    if (reached) {
      await exports.dispatchMilestone(app, reached);
    }

    app._previousTotalDownloads = current;
    await app.save();
  } catch (error) {
    console.error('Milestone check error:', error);
  }
};
