const Contact = require('../models/Contact');
const { sendEmail } = require('../services/emailService');

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

    // 1. Primary destination: officialbaqala@gmail.com
    const primaryRecipient = process.env.SUPPORT_EMAIL || 'officialbaqala@gmail.com';
    const emailSubject = `[Contact Form - ${reason}] Message from ${name}`;
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #8b5cf6; margin-top: 0;">New Inquiry Received on Baqala</h2>
        <p><strong>From Name:</strong> ${name}</p>
        <p><strong>User Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Category / Reason:</strong> <span style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-weight: 600;">${reason}</span></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p><strong>Message Content:</strong></p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border-left: 4px solid #8b5cf6; font-size: 15px; line-height: 1.6;">
          ${message.replace(/\n/g, '<br/>')}
        </div>
      </div>
    `;

    // Dispatch email asynchronously
    sendEmail({ to: primaryRecipient, subject: emailSubject, html: emailHtml }).catch(err => {
      console.error('[CONTACT_EMAIL_ERROR] Failed sending notification to official support:', err.message);
    });

    // 2. If it's a DMCA / Legal / Takedown request, also forward to legalbaqala@gmail.com
    if (reason === 'Request Takedown' || reason.toLowerCase().includes('takedown') || reason.toLowerCase().includes('legal')) {
      const legalRecipient = process.env.LEGAL_EMAIL || 'legalbaqala@gmail.com';
      sendEmail({ to: legalRecipient, subject: `[Legal/DMCA Alert] ${emailSubject}`, html: emailHtml }).catch(err => {
        console.error('[CONTACT_EMAIL_ERROR] Failed sending notification to legal team:', err.message);
      });
    }

    res.status(201).json({
      message: 'Your message has been received. We will get back to you shortly!'
    });
  } catch (error) {
    next(error);
  }
};

