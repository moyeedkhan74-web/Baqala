const Contact = require('../models/Contact');

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

    res.status(201).json({
      message: 'Your message has been received. We will get back to you shortly!'
    });
  } catch (error) {
    next(error);
  }
};
