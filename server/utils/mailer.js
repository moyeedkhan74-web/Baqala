const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter utilizing generic SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Validates SMTP Config before trying to send
 */
const isConfigured = () => {
  return !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
};

/**
 * Send App Removed Email
 * @param {string} to - Developer Email
 * @param {string} developerName 
 * @param {string} appTitle 
 */
exports.sendAppRemovedEmail = async (to, developerName, appTitle) => {
  if (!isConfigured()) return;
  
  const mailOptions = {
    from: `"Baqala Moderation" <${process.env.SMTP_USER}>`,
    to,
    subject: `Action Required: Your application "${appTitle}" was removed`,
    html: `
      <div style="font-family: sans-serif; max-w-2xl mx-auto p-4 border rounded-xl border-gray-200">
        <h2 style="color: #e11d48;">Community Standards Notice</h2>
        <p>Dear ${developerName},</p>
        <p>This is to inform you that your application, <strong>"${appTitle}"</strong>, has been permanently removed from the Baqala platform.</p>
        <p>This action was taken following a review which determined the application violated our Privacy Policy and Terms & Conditions.</p>
        <p>Repeated violations could result in your developer account being permanently suspended.</p>
        <br />
        <p>Regards,</p>
        <p><strong>Baqala Admin Team</strong></p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Sent App Removal email to ${to}`);
  } catch (err) {
    console.error('[MAILER ERROR] Failed to send App Removal email:', err);
  }
};

/**
 * Send User Banned Email
 * @param {string} to - User Email
 * @param {string} userName
 * @param {string} reason 
 * @param {number|string} duration - The number of days or 'Permanent'
 */
exports.sendBanEmail = async (to, userName, reason, duration) => {
  if (!isConfigured()) return;

  const mailOptions = {
    from: `"Baqala Moderation" <${process.env.SMTP_USER}>`,
    to,
    subject: `Account Notice: Your Baqala account has been restricted`,
    html: `
      <div style="font-family: sans-serif; max-w-2xl mx-auto p-4 border rounded-xl border-gray-200">
        <h2 style="color: #e11d48;">Account Restriction Notice</h2>
        <p>Dear ${userName},</p>
        <p>Your Baqala account has been placed under restriction.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Duration of Restriction:</strong> ${duration === 'Permanent' ? 'Permanent' : duration + ' days'}</p>
        <br />
        <p>If you believe this was an error, you may reply to this email to contact support.</p>
        <br />
        <p>Regards,</p>
        <p><strong>Baqala Admin Team</strong></p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Sent Ban email to ${to}`);
  } catch (err) {
    console.error('[MAILER ERROR] Failed to send Ban email:', err);
  }
};

/**
 * Send Report Processed Email to Reporter
 * @param {string} to - Reporter Email
 * @param {string} reporterName 
 * @param {string} targetName - App or Developer they reported
 */
exports.sendReportProcessedEmail = async (to, reporterName, targetName) => {
  if (!isConfigured()) return;

  const mailOptions = {
    from: `"Baqala Support" <${process.env.SMTP_USER}>`,
    to,
    subject: `Update on your recent report concerning "${targetName}"`,
    html: `
      <div style="font-family: sans-serif; max-w-2xl mx-auto p-4 border rounded-xl border-gray-200">
        <h2 style="color: #8b5cf6;">Report Reviewed</h2>
        <p>Dear ${reporterName},</p>
        <p>Thank you for helping keep Baqala safe. We wanted to let you know that our moderation team has reviewed your recent report concerning <strong>"${targetName}"</strong>.</p>
        <p>Appropriate action has been taken in accordance with our community guidelines.</p>
        <br />
        <p>Thank you for your active participation in our community.</p>
        <br />
        <p>Regards,</p>
        <p><strong>Baqala Support Team</strong></p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Sent Report Processed email to ${to}`);
  } catch (err) {
    console.error('[MAILER ERROR] Failed to send Report Processed email:', err);
  }
};
