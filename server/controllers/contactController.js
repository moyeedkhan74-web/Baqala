const Contact = require('../models/Contact');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { sendNotification } = require('../services/notificationService');

exports.submitContactForm = async (req, res, next) => {
  try {
    const { name, email, reason, message } = req.body;

    if (!name || !email || !reason || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const contact = new Contact({
      name,
      email,
      reason,
      message
    });

    await contact.save();

    // 1. Notify Official Support Team via Email (officialbaqala@gmail.com)
    const primaryRecipient = process.env.SUPPORT_EMAIL || 'officialbaqala@gmail.com';
    const adminEmailSubject = `[Contact Form - ${reason}] Message from ${name}`;
    const adminEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #8b5cf6; margin-top: 0;">New Contact Inquiry Received</h2>
        <p><strong>From Name:</strong> ${name}</p>
        <p><strong>User Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Category / Reason:</strong> <span style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-weight: 600;">${reason}</span></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p><strong>Message:</strong></p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border-left: 4px solid #8b5cf6; font-size: 15px; line-height: 1.6;">
          ${message.replace(/\n/g, '<br/>')}
        </div>
      </div>
    `;

    sendEmail({ to: primaryRecipient, subject: adminEmailSubject, html: adminEmailHtml }).catch(err => {
      console.error('[CONTACT_EMAIL_ERROR] Failed sending notification to support:', err.message);
    });

    // Forward to legal team if DMCA or Legal request
    if (reason === 'Request Takedown' || reason.toLowerCase().includes('takedown') || reason.toLowerCase().includes('legal')) {
      const legalRecipient = process.env.LEGAL_EMAIL || 'legalbaqala@gmail.com';
      sendEmail({ to: legalRecipient, subject: `[Legal/DMCA Alert] ${adminEmailSubject}`, html: adminEmailHtml }).catch(err => {
        console.error('[CONTACT_EMAIL_ERROR] Failed sending notification to legal team:', err.message);
      });
    }

    // 2. Send Automated Confirmation Email to the USER who submitted the form
    const userEmailSubject = `We received your message - Baqala Support`;
    const userEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #0f172a; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://baqala-lovat.vercel.app/logo.png" alt="Baqala" width="48" height="48" style="display: inline-block; border-radius: 12px;" />
          <h2 style="margin: 12px 0 4px; font-size: 22px; font-weight: 800; color: #0f172a;">Message Received!</h2>
          <p style="margin: 0; font-size: 14px; color: #64748b;">Thanks for reaching out to Baqala Support</p>
        </div>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We've received your inquiry regarding <strong>${reason}</strong>. Our support team is currently reviewing your message and will respond as quickly as possible.</p>
        <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #64748b; uppercase; letter-spacing: 0.5px;">Summary of your message:</p>
          <p style="margin: 0; font-size: 14px; color: #334155; font-style: italic;">"${message.length > 150 ? message.substring(0, 150) + '...' : message}"</p>
        </div>
        <p style="font-size: 14px; color: #64748b;">If you need to provide additional details, feel free to reply directly to this email or visit our <a href="https://baqala-lovat.vercel.app/contact" style="color: #8b5cf6; text-decoration: none; font-weight: 600;">Contact Center</a>.</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">Baqala App Store &middot; Support & Discovery</p>
      </div>
    `;

    sendEmail({ to: email, subject: userEmailSubject, html: userEmailHtml }).catch(err => {
      console.error('[USER_CONFIRMATION_EMAIL_ERROR] Failed sending confirmation to user:', err.message);
    });

    // 3. Send In-App Notification to User (if registered/logged in) & Admins
    let userToNotify = req.user;
    if (!userToNotify) {
      userToNotify = await User.findOne({ email: email.toLowerCase() });
    }

    if (userToNotify) {
      sendNotification({
        recipient: userToNotify._id,
        title: '📬 Inquiry Received',
        message: `Your message regarding "${reason}" was delivered to support. We will reply soon!`,
        type: 'success',
        link: '/contact'
      }).catch(err => console.error('[IN_APP_NOTIF_ERROR]:', err.message));
    }

    // Also send an in-app notification to all Admins
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    for (const admin of adminUsers) {
      sendNotification({
        recipient: admin._id,
        title: `📩 Support Inquiry (${reason})`,
        message: `${name} (${email}) sent: "${message.substring(0, 60)}..."`,
        type: 'info',
        link: '/admin/dashboard'
      }).catch(err => console.error('[ADMIN_NOTIF_ERROR]:', err.message));
    }

    res.status(201).json({
      message: 'Your message has been received! A confirmation email and in-app notification have been sent.'
    });
  } catch (error) {
    next(error);
  }
};

