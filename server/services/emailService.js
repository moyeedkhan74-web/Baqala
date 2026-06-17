const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const { BrevoClient } = require('@getbrevo/brevo');
const EmailLog = require('../models/EmailLog');

// Configuration
const brevoKey = process.env.BREVO_API_KEY?.trim() || null;
const brevoFrom = process.env.BREVO_FROM_EMAIL || 'legalbaqala@gmail.com';
const supportEmail = process.env.SUPPORT_EMAIL || 'officialbaqala@gmail.com';
const resendKey = process.env.RESEND_API_KEY;

// Initialize Brevo (v5.x SDK)
let brevoClient = null;
if (brevoKey) {
  try {
    brevoClient = new BrevoClient({ apiKey: brevoKey });
  } catch (initError) {
    console.error('[EMAIL_SERVICE] [BREVO_INIT_ERROR]:', initError.message);
  }
}

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
 * Send an email using Brevo (Primary), Resend (Secondary), or SMTP (Last Resort)
 */
exports.sendEmail = async ({ to, subject, html, appId = null }) => {
  const emailContent = `
    ${html}
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="font-size: 12px; color: #666;">
      Questions? Contact our support team at <a href="mailto:${supportEmail}">${supportEmail}</a> or visit our <a href="https://baqala-lovat.vercel.app/terms">Terms of Service</a>.
    </p>
  `;

  let lastError = null;
  let brevoFailed = false;
  let resendFailed = false;

  // 1. Try Brevo First (New Primary)
  if (brevoClient) {
    let logEntry;
    try {
      console.log(`[EMAIL_SERVICE] [BREVO] Attempting delivery to: ${to}`);
      
      logEntry = await EmailLog.create({
        recipient: to,
        subject,
        provider: 'brevo',
        status: 'pending',
        relatedAppId: appId
      });

      // Brevo v5.x SDK uses transactionalEmails.sendTransacEmail
      const result = await withTimeout(brevoClient.transactionalEmails.sendTransacEmail({
        subject: subject,
        htmlContent: emailContent,
        sender: { name: "Baqala", email: brevoFrom },
        to: [{ email: to }],
        replyTo: { email: supportEmail }
      }), 8000, 'BREVO');

      console.log(`[EMAIL_SERVICE] [BREVO] Success: ${result.messageId || 'SENT'}`);
      logEntry.status = 'sent';
      logEntry.completedAt = new Date();
      await logEntry.save();
      
      return { success: true, provider: 'brevo', messageId: result.messageId };
    } catch (brevoError) {
      brevoFailed = true;
      const isTimeout = brevoError.message.includes('TIMEOUT');
      console.error(`[EMAIL_SERVICE] [BREVO] ${isTimeout ? 'Timeout' : 'Failed'}:`, brevoError.message);
      
      if (logEntry) {
        logEntry.status = isTimeout ? 'timeout' : 'failed';
        logEntry.error = brevoError.message;
        logEntry.completedAt = new Date();
        await logEntry.save();
      }
      lastError = brevoError;
    }
  }

  // 2. Try Resend Second (Sandbox Fallback)
  if (resendKey && (!brevoClient || brevoFailed)) {
    let logEntry;
    try {
      const isFallback = brevoClient && brevoFailed;
      console.log(`[EMAIL_SERVICE] [RESEND] Attempting delivery to: ${to}${isFallback ? ' (FALLBACK)' : ''}`);
      
      logEntry = await EmailLog.create({
        recipient: to,
        subject,
        provider: 'resend',
        status: 'pending',
        relatedAppId: appId,
        error: isFallback ? 'Used as fallback after Brevo failed' : null
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
      
      return { success: true, provider: 'resend', data };
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

  // 3. Try Nodemailer/SMTP (Last Resort)
  if (process.env.SMTP_USER && process.env.SMTP_PASS && (!brevoApi || brevoFailed) && (!resendKey || resendFailed)) {
    let logEntry;
    try {
      const isFallback = (brevoApi && brevoFailed) || (resendKey && resendFailed);
      console.log(`[EMAIL_SERVICE] [SMTP] Attempting delivery to: ${to}${isFallback ? ' (FALLBACK)' : ''}`);
      
      logEntry = await EmailLog.create({
        recipient: to,
        subject,
        provider: 'smtp',
        status: 'pending',
        relatedAppId: appId,
        error: isFallback ? 'Used as fallback after primary providers failed' : null
      });

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

      return { success: true, provider: 'smtp', messageId: info.messageId };
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

  // 4. Final Fallback: Simulated
  if (!brevoKey && !resendKey && !(process.env.SMTP_USER && process.env.SMTP_PASS)) {
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

    return { success: true, provider: 'simulated' };
  }

  return { success: false, error: lastError?.message || 'All providers failed' };
};

/**
 * Template for Auto-Rejection (Malware)
 */
exports.sendAutoRejectEmail = async (email, appName, reportUrl, maliciousCount, totalEngines) => {
  return exports.sendEmail({
    to: email,
    subject: `Security Alert: Your app ${appName} was rejected`,
    html: `<div style="background-color:#f4f5f7; padding:32px 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <tr><td style="background-color:#0f172a; padding:24px 32px; text-align:center;">
      <img src="https://baqala-lovat.vercel.app/baqala-logo-email.png" alt="Baqala" width="178" height="32" style="display:block; margin:0 auto;" />
    </td></tr>
    <tr><td style="background-color:#fef2f2; padding:36px 32px 24px; text-align:center;">
      <div style="width:64px; height:64px; background-color:#ef4444; border-radius:50%; margin:0 auto 16px; line-height:64px; font-size:30px; color:#ffffff;">&#9888;</div>
      <h1 style="margin:0; font-size:26px; line-height:32px; font-weight:700; color:#991b1b;">Security scan blocked this upload</h1>
    </td></tr>
    <tr><td style="padding:32px 32px 8px;">
      <p style="margin:0 0 20px; font-size:17px; line-height:26px; color:#1f2937;">Your upload <strong style="color:#0f172a;">${appName}</strong> was automatically rejected. Our automated scanner detected malware or suspicious code in the file before it reached our review team.</p>
    </td></tr>
    <tr><td style="padding:0 32px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fee2e2; border-left:4px solid #ef4444; border-radius:10px;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 6px; font-size:14px; color:#991b1b; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Scan result</p>
          <p style="margin:0 0 14px; font-size:16px; line-height:24px; color:#7f1d1d;"><strong>${maliciousCount} / ${totalEngines}</strong> security engines flagged this file as malicious.</p>
          <a href="${reportUrl}" style="display:inline-block; font-size:14px; font-weight:600; color:#ef4444; text-decoration:none; border:1.5px solid #ef4444; border-radius:8px; padding:8px 16px;">View Full Scan Report &rarr;</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 32px 28px;">
      <p style="margin:0 0 12px; font-size:16px; line-height:24px; color:#1f2937;"><strong>If this looks wrong to you:</strong> rebuild your APK from a clean environment, make sure no third-party SDKs or ad libraries are bundled unexpectedly, and re-upload. If you believe this is a false positive, contact support with the scan report link above.</p>
    </td></tr>
    <tr><td style="padding:0 32px 32px; text-align:center;">
      <a href="https://baqala-lovat.vercel.app/developer" style="display:inline-block; background-color:#ef4444; color:#ffffff; font-size:17px; font-weight:600; text-decoration:none; padding:16px 36px; border-radius:10px;">Re-upload a New Version</a>
    </td></tr>
    <tr><td style="padding:24px 32px 32px; border-top:1px solid #e5e7eb; text-align:center;">
      <p style="margin:0 0 8px; font-size:14px; color:#94a3b8;">Think this is a mistake? Email <a href="mailto:${supportEmail}" style="color:#ef4444; text-decoration:none; font-weight:600;">${supportEmail}</a></p>
      <p style="margin:0; font-size:13px; color:#cbd5e1;">Baqala App Store &middot; <a href="https://baqala-lovat.vercel.app/terms" style="color:#94a3b8; text-decoration:underline;">Terms of Service</a></p>
    </td></tr>
  </table>
</div>`
  });
};

/**
 * Template for Admin Rejection
 */
exports.sendAdminRejectEmail = async (email, appName, reason) => {
  return exports.sendEmail({
    to: email,
    subject: `Update on your app: ${appName}`,
    html: `<div style="background-color:#f4f5f7; padding:32px 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <tr><td style="background-color:#0f172a; padding:24px 32px; text-align:center;">
      <img src="https://baqala-lovat.vercel.app/baqala-logo-email.png" alt="Baqala" width="178" height="32" style="display:block; margin:0 auto;" />
    </td></tr>
    <tr><td style="background-color:#fff7ed; padding:36px 32px 24px; text-align:center;">
      <div style="width:64px; height:64px; background-color:#f59e0b; border-radius:50%; margin:0 auto 16px; line-height:64px; font-size:30px; color:#ffffff;">!</div>
      <h1 style="margin:0; font-size:26px; line-height:32px; font-weight:700; color:#92400e;">Changes needed before publishing</h1>
    </td></tr>
    <tr><td style="padding:32px 32px 8px;">
      <p style="margin:0 0 20px; font-size:17px; line-height:26px; color:#1f2937;">Thanks for submitting <strong style="color:#0f172a;">${appName}</strong>. Our moderation team reviewed it and it isn't quite ready to go live yet.</p>
    </td></tr>
    <tr><td style="padding:0 32px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef3c7; border-left:4px solid #f59e0b; border-radius:10px;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 6px; font-size:14px; color:#92400e; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Reason from our team</p>
          <p style="margin:0; font-size:16px; line-height:24px; color:#78350f;">${reason}</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 32px 28px;">
      <p style="margin:0; font-size:17px; line-height:26px; color:#1f2937;">Please address the points above and resubmit — most updates are reviewed quickly.</p>
    </td></tr>
    <tr><td style="padding:0 32px 32px; text-align:center;">
      <a href="https://baqala-lovat.vercel.app/developer" style="display:inline-block; background-color:#0f172a; color:#ffffff; font-size:17px; font-weight:600; text-decoration:none; padding:16px 36px; border-radius:10px;">Go to Developer Dashboard</a>
    </td></tr>
    <tr><td style="padding:24px 32px 32px; border-top:1px solid #e5e7eb; text-align:center;">
      <p style="margin:0 0 8px; font-size:14px; color:#94a3b8;">Questions about this decision? Email <a href="mailto:${supportEmail}" style="color:#0f172a; text-decoration:none; font-weight:600;">${supportEmail}</a></p>
      <p style="margin:0; font-size:13px; color:#cbd5e1;">Baqala App Store &middot; <a href="https://baqala-lovat.vercel.app/terms" style="color:#94a3b8; text-decoration:underline;">Terms of Service</a></p>
    </td></tr>
  </table>
</div>`
  });
};

/**
 * Template for Admin Approval
 */
exports.sendApprovalEmail = async (email, appName, appId) => {
  return exports.sendEmail({
    to: email,
    subject: `Congratulations! ${appName} is now live`,
    html: `<div style="background-color:#f4f5f7; padding:32px 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <tr><td style="background-color:#0f172a; padding:28px 32px; text-align:center;">
      <img src="https://baqala-lovat.vercel.app/logo.png" alt="Baqala" width="44" height="44" style="display:inline-block; vertical-align:middle; border-radius:10px;" />
      <span style="display:inline-block; vertical-align:middle; margin-left:10px; font-size:22px; font-weight:700; color:#ffffff;">Baqala</span>
    </td></tr>
    <tr><td style="background-color:#ecfdf5; padding:36px 32px 24px; text-align:center;">
      <div style="width:64px; height:64px; background-color:#10b981; border-radius:50%; margin:0 auto 16px; line-height:64px; font-size:32px; color:#ffffff;">&#10003;</div>
      <h1 style="margin:0; font-size:26px; line-height:32px; font-weight:700; color:#065f46;">Your app is now live! &#128640;</h1>
    </td></tr>
    <tr><td style="padding:32px 32px 8px;">
      <p style="margin:0 0 20px; font-size:17px; line-height:26px; color:#1f2937;">Congratulations! <strong style="color:#0f172a;">${appName}</strong> has passed review and is now published on the Baqala App Store.</p>
      <p style="margin:0 0 28px; font-size:17px; line-height:26px; color:#1f2937;">Users can now discover, download, and review your app. Great work!</p>
    </td></tr>
    <tr><td style="padding:0 32px 32px; text-align:center;">
      <a href="https://baqala-lovat.vercel.app/app/${appId}" style="display:inline-block; background-color:#10b981; color:#ffffff; font-size:17px; font-weight:600; text-decoration:none; padding:16px 36px; border-radius:10px;">View Your Live App</a>
    </td></tr>
    <tr><td style="padding:0 32px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border-radius:12px;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 6px; font-size:14px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">What's next</p>
          <p style="margin:0; font-size:16px; line-height:24px; color:#334155;">Share your app's link with your audience, keep an eye on your developer dashboard for download stats, and submit updates anytime.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 32px 32px; border-top:1px solid #e5e7eb; text-align:center;">
      <p style="margin:0 0 8px; font-size:14px; color:#94a3b8;">Questions? Reach us at <a href="mailto:${supportEmail}" style="color:#10b981; text-decoration:none;">${supportEmail}</a></p>
      <p style="margin:0; font-size:13px; color:#cbd5e1;">Baqala App Store &middot; <a href="https://baqala-lovat.vercel.app/terms" style="color:#94a3b8; text-decoration:underline;">Terms of Service</a></p>
    </td></tr>
  </table>
</div>`
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
