const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

// Configure Nodemailer for Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Helper to wrap a promise with a timeout
 */
const withTimeout = (promise, ms, providerName) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`TIMEOUT: ${providerName} exceeded ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

/**
 * Send an email using SMTP (Primary) or Resend (Secondary)
 */
exports.sendEmail = async ({ to, subject, html, appId = null }) => {
  const emailContent = `
    ${html}
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="font-size: 12px; color: #666;">
      Questions? Contact our legal team at <a href="mailto:legalbaqala@gmail.com">legalbaqala@gmail.com</a> or visit our <a href="https://baqala-lovat.vercel.app/terms">Terms of Service</a>.
    </p>
  `;

  let lastError = null;
  let resendFailed = false;

  // 1. Try Resend First (Primary for Render)
  if (resendKey) {
    let logEntry;
    try {
      console.log(`[EMAIL_SERVICE] [RESEND] Attempting delivery to: ${to}`);
      
      logEntry = await EmailLog.create({
        recipient: to,
        subject,
        provider: 'resend',
        status: 'pending',
        relatedAppId: appId
      });

      const { data, error } = await withTimeout(resend.emails.send({
        from: 'Baqala <onboarding@resend.dev>',
        to,
        subject,
        html: emailContent
      }), 15000, 'RESEND');

      if (error) throw error;

      console.log(`[EMAIL_SERVICE] [RESEND] Success: ${data?.id}`);
      logEntry.status = 'sent';
      logEntry.completedAt = new Date();
      await logEntry.save();
      
      return { success: true, data };
    } catch (resendError) {
      resendFailed = true;
      const isTimeout = resendError.message.includes('TIMEOUT');
      console.error(`[EMAIL_SERVICE] [RESEND] ${isTimeout ? 'Timeout' : 'Failed'}:`, resendError.message);
      
      if (logEntry) {
        logEntry.status = isTimeout ? 'timeout' : 'failed';
        logEntry.error = resendError.message;
        logEntry.completedAt = new Date();
        await logEntry.save();
      }
      lastError = resendError;
    }
  }

  // 2. Secondary: Try Nodemailer/SMTP
  // Only try SMTP if Resend is not configured OR if Resend failed
  if (process.env.SMTP_USER && process.env.SMTP_PASS && (!resendKey || resendFailed)) {
    let logEntry;
    try {
      const isFallback = resendKey && resendFailed;
      console.log(`[EMAIL_SERVICE] [SMTP] Attempting delivery to: ${to}${isFallback ? ' (FALLBACK)' : ''}`);
      
      logEntry = await EmailLog.create({
        recipient: to,
        subject,
        provider: 'smtp',
        status: 'pending',
        relatedAppId: appId,
        error: isFallback ? 'Used as fallback after Resend failed' : null
      });

      // Reduced timeout to 8s as SMTP on Render usually fails fast if blocked
      const info = await withTimeout(transporter.sendMail({
        from: `"Baqala" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: emailContent,
      }), 8000, 'SMTP');

      console.log(`[EMAIL_SERVICE] [SMTP] Success: ${info.messageId}`);
      logEntry.status = 'sent';
      logEntry.completedAt = new Date();
      await logEntry.save();

      return { success: true, messageId: info.messageId };
    } catch (smtpError) {
      const isTimeout = smtpError.message.includes('TIMEOUT');
      console.error(`[EMAIL_SERVICE] [SMTP] ${isTimeout ? 'Timeout' : 'Failed'}:`, smtpError.message);
      
      if (logEntry) {
        logEntry.status = isTimeout ? 'timeout' : 'failed';
        logEntry.error = smtpError.message;
        logEntry.completedAt = new Date();
        await logEntry.save();
      }
      lastError = smtpError;
    }
  }

  // 3. Final Fallback: Simulated
  if (!resendKey && !(process.env.SMTP_USER && process.env.SMTP_PASS)) {
    console.warn('[EMAIL_SERVICE] [WARNING] No email provider configured. Falling back to console log.');
    console.log(`[EMAIL_SERVICE] [SIMULATED] To: ${to}, Subject: ${subject}`);
    
    await EmailLog.create({
      recipient: to,
      subject,
      provider: 'simulated',
      status: 'sent',
      relatedAppId: appId,
      completedAt: new Date()
    });

    return { success: true };
  }

  return { success: false, error: lastError?.message || 'All providers failed' };
};

/**
 * Template for Auto-Rejection (Malware)
 */
exports.sendAutoRejectEmail = async (email, appName, reportUrl) => {
  return exports.sendEmail({
    to: email,
    subject: `Security Alert: Your app ${appName} was rejected`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h1 style="color: #f43f5e;">Security Rejection</h1>
        <p>Your app <strong>${appName}</strong> was automatically rejected because our security scanner detected malware.</p>
        <p>Details: <a href="${reportUrl}">${reportUrl}</a></p>
        <p>If you believe this is a mistake, please review your APK and try again.</p>
      </div>
    `
  });
};

/**
 * Template for Admin Rejection
 */
exports.sendAdminRejectEmail = async (email, appName, reason) => {
  return exports.sendEmail({
    to: email,
    subject: `Update on your app: ${appName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>App Rejected</h2>
        <p>Your app <strong>${appName}</strong> was rejected by our review team.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please address these issues and re-upload your app.</p>
      </div>
    `
  });
};

/**
 * Template for Admin Approval
 */
exports.sendApprovalEmail = async (email, appName) => {
  return exports.sendEmail({
    to: email,
    subject: `Congratulations! ${appName} is now live`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #10b981;">App Approved!</h2>
        <p>Congratulations! Your app <strong>${appName}</strong> is now live on Baqala.</p>
        <p>You can now view it on the platform and share it with others.</p>
      </div>
    `
  });
};

/**
 * Template for Upload Confirmation
 */
exports.sendUploadConfirmationEmail = async (email, appName) => {
  return exports.sendEmail({
    to: email,
    subject: `Processing: ${appName} is in the queue`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Upload Received!</h2>
        <p>Your app <strong>${appName}</strong> has been successfully uploaded to the Baqala platform.</p>
        <p><strong>What happens next?</strong></p>
        <ul>
          <li>Our automated scanner is currently checking your binary for security threats.</li>
          <li>Once the scan is clean, our moderators will perform a final review.</li>
          <li>You will receive another email once your app is approved and live!</li>
        </ul>
        <p>You can track the live status on your <a href="https://baqala-lovat.vercel.app/developer">Developer Dashboard</a>.</p>
      </div>
    `
  });
};
