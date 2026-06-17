const Notification = require('../models/Notification');
const supabase = require('../config/supabase');

/**
 * Send an in-app notification to a user.
 * @param {Object} params - Notification parameters
 * @param {string} params.recipient - Recipient User ID
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} [params.type='info'] - Notification type (info, success, warning, danger)
 * @param {string} [params.link] - Optional link for navigation
 */
exports.sendNotification = async ({ recipient, title, message, type = 'info', link }) => {
  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      link
    });

    // Broadcast Real-time event via Supabase
    try {
      const channelName = `user_notifications_${recipient}`;
      await supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'new_notification',
        payload: { notification }
      });
      console.log(`[NOTIFICATION_SERVICE] Broadcast: Sent to channel ${channelName}`);
    } catch (broadcastErr) {
      console.error('[NOTIFICATION_SERVICE] Real-time broadcast failed:', broadcastErr.message);
    }
    
    console.log(`[NOTIFICATION_SERVICE] Success: Created for user ${recipient} (Type: ${type})`);
    return { success: true, notification };
  } catch (error) {
    console.error(`[NOTIFICATION_SERVICE] Error: Failed to create notification for ${recipient}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send a welcome notification to a new user.
 */
exports.sendWelcomeNotification = async (user) => {
  return exports.sendNotification({
    recipient: user._id,
    title: '👋 Welcome to Baqala!',
    message: `Hi ${user.name}, welcome to the platform! We're glad to have you here.`,
    type: 'success'
  });
};

/**
 * Send an upload confirmation notification.
 */
exports.sendUploadConfirmation = async (user, appTitle, appId) => {
  return exports.sendNotification({
    recipient: user._id,
    title: '📦 Upload Received',
    message: `We've received your application "${appTitle}". It's now in the queue for security scanning and moderation.`,
    type: 'info',
    link: `/developer/apps/${appId}`
  });
};

/**
 * Send a security scan result notification.
 */
exports.sendScanResultNotification = async (developerId, appTitle, appId, result) => {
  let title, message, type;

  switch (result) {
    case 'malware':
      title = '🚨 Security Alert: Malware Detected';
      message = `Your app "${appTitle}" was automatically rejected because our scanner detected malware.`;
      type = 'danger';
      break;
    case 'suspicious':
      title = '⚠️ Scan Warning: Suspicious Activity';
      message = `Your app "${appTitle}" flagged some engines. It's now pending manual review.`;
      type = 'warning';
      break;
    case 'clean':
      title = '✅ Security Scan Passed';
      message = `Great news! "${appTitle}" passed the automated security scan and is now awaiting final moderation.`;
      type = 'success';
      break;
    default:
      return;
  }

  return exports.sendNotification({
    recipient: developerId,
    title,
    message,
    type,
    link: `/developer/apps/${appId}`
  });
};
