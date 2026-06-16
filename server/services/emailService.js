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

    // Try Nodemailer first (more flexible for development)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log(`[EMAIL] Sending via SMTP to: ${to}`);
      await transporter.sendMail({
        from: `"Baqala" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: emailContent,
      });
      return { success: true };
    }

    // Fallback to Resend
    if (!resendKey) {
      console.warn('[EMAIL] No email provider configured. Falling back to console log.');
      console.log(`[SIMULATED EMAIL] To: ${to}, Subject: ${subject}`);
      return { success: true };
    }

    const { data, error } = await resend.emails.send({
      from: 'Baqala <onboarding@resend.dev>',
      to,
      subject,
      html: emailContent
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[EMAIL_ERROR]:', error);
    return { success: false, error };
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
