const { Resend } = require('resend');

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

/**
 * Send an email using Resend
 */
exports.sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[EMAIL] Resend API Key missing. Falling back to console log.');
      console.log(`[SIMULATED EMAIL] To: ${to}, Subject: ${subject}`);
      return { success: true };
    }

    const { data, error } = await resend.emails.send({
      from: 'Baqala <onboarding@resend.dev>', // Update this with verified domain in production
      to,
      subject,
      html
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
