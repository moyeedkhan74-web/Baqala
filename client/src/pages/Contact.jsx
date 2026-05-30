import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';
import SEOHead from '../components/SEOHead';
import { HiMail, HiChatAlt, HiExternalLink } from 'react-icons/hi';
import { FaGithub } from 'react-icons/fa';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: 'General',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/contact', formData);
      toast.success(data.message || 'Message sent successfully!');
      setFormData({ name: '', email: '', reason: 'General', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SEOHead 
        title="Contact Us | Baqala Support"
        description="Get in touch with the Baqala team for support, feedbacks, or reporting issues."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-gray-400">
              Have a question about an app? Need help with your developer account? Or found a bug? We're here to help.
            </p>
          </div>

          <div className="space-y-4">
            <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-accent-violet/10">
              <div className="w-12 h-12 bg-accent-violet/10 rounded-xl flex items-center justify-center text-accent-violet">
                <HiMail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Us</p>
                <p className="text-slate-900 dark:text-white font-semibold">support@baqala.com</p>
              </div>
            </div>

            <a 
              href="https://github.com/moyeedkhan74-web" 
              target="_blank" 
              rel="noopener noreferrer"
              className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-dark-200/50 dark:border-white/5 hover:border-accent-neon/30 transition-all group"
            >
              <div className="w-12 h-12 bg-dark-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-dark-900 dark:text-white group-hover:bg-accent-neon group-hover:text-black transition-colors">
                <FaGithub className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">GitHub</p>
                <p className="text-slate-900 dark:text-white font-semibold flex items-center justify-between">
                  @moyeedkhan74-web <HiExternalLink className="w-4 h-4" />
                </p>
              </div>
            </a>
          </div>
        </motion.div>

        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-8 md:p-10 rounded-3xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">Your Name</label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">Email Address</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="input-field"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">Reason for Contact</label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="input-field cursor-pointer"
              >
                <option value="General">General Inquiry</option>
                <option value="Report App">Report an App</option>
                <option value="Request Takedown">Request Takedown (DMCA)</option>
                <option value="Developer Support">Developer Support</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">Message</label>
              <textarea
                required
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="How can we help you?"
                rows={5}
                className="input-field resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <HiChatAlt className="w-6 h-6" /> Send Message
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
