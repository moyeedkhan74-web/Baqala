const { Resend } = require('resend');
const nodemailer = require('nodemailer');

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
 * Send an email using SMTP (Primary) or Resend (Secondary)
 */
exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const emailContent = `
      ${html}
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #666;">
        Questions? Contact our legal team at <a href="mailto:legalbaqala@gmail.com">legalbaqala@gmail.com</a> or visit our <a href="https://baqala-lovat.vercel.app/terms">Terms of Service</a>.
      </p>
    `;

    // Try Resend First (Most reliable on PaaS like Render)
    if (resendKey) {
      try {
        console.log(`[EMAIL_SERVICE] [RESEND] Attempting delivery to: ${to} (Subject: ${subject})`);
        const { data, error } = await resend.emails.send({
          from: 'Baqala <onboarding@resend.dev>',
          to,
          subject,
          html: emailContent
        });

        if (error) {
          console.error('[EMAIL_SERVICE] [RESEND] Provider Error:', error);
          throw error;
        }
        console.log(`[EMAIL_SERVICE] [RESEND] Success:`, data?.id);
        return { success: true, data };
      } catch (resendError) {
        console.error('[EMAIL_SERVICE] [RESEND] Failed:', resendError.message);
        // If Resend fails, we'll try SMTP as secondary below
      }
    }

    // Secondary: Try Nodemailer/SMTP
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log(`[EMAIL_SERVICE] [SMTP] Attempting delivery to: ${to} (Subject: ${subject})`);
      try {
        const info = await transporter.sendMail({
          from: `"Baqala" <${process.env.SMTP_USER}>`,
          to,
          subject,
          html: emailContent,
        });
        console.log(`[EMAIL_SERVICE] [SMTP] Success: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (smtpError) {
        console.error(`[EMAIL_SERVICE] [SMTP] Failed:`, {
          message: smtpError.message,
          code: smtpError.code
        });
        
        if (smtpError.code === 'EAUTH') {
          console.error('[EMAIL_SERVICE] [CRITICAL] Authentication Failed. Gmail requires an "App Password".');
        }
      }
    }

    // Final Fallback: Simulated Logan
    if (!resendKey && !(process.env.SMTP_USER && process.env.SMTP_PASS)) {
      console.warn('[EMAIL_SERVICE] [WARNING] No email provider configured. Falling back to console log.');
      console.log(`[EMAIL_SERVICE] [SIMULATED] To: ${to}, Subject: ${subject}`);
      return { success: true };
    }
  } catch (globalError) {
    console.error('[EMAIL_SERVICE] [FATAL]:', globalError.message);
    return { success: false, error: globalError.message };
  }
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
