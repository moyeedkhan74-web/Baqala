import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { Settings, X, Save, Download, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanel = () => {
  const { config, updateConfig, resetConfig } = useConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(config, null, 2));
  const [error, setError] = useState('');

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      
      // Basic structural validation
      const requiredKeys = ['hero', 'personal', 'gallery', 'timeline', 'letter', 'reasons', 'messages', 'banner', 'surprise', 'videoMemories', 'ending'];
      const missingKeys = requiredKeys.filter(key => !parsed[key]);
      
      if (missingKeys.length > 0) {
        if (!confirm(`Warning: The following sections are missing: ${missingKeys.join(', ')}. This might cause layout issues. Do you still want to save?`)) {
          return;
        }
      }

      updateConfig(parsed);
      setError('');
      alert('Settings saved and applied successfully!');
    } catch (err) {
      setError('Invalid JSON format. Please check for missing quotes or commas.');
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to the original file settings?')) {
      resetConfig();
      setJsonText(JSON.stringify(config, null, 2)); // Will update to initial on next render, but better to force reload or let context handle
      window.location.reload();
    }
  };

  const handleDownload = () => {
    try {
      const parsed = JSON.parse(jsonText); // Ensure valid
      const content = `export const siteConfig = ${JSON.stringify(parsed, null, 2)};\n`;
      const blob = new Blob([content], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'siteConfig.js';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Cannot download: Invalid JSON format.');
    }
  };

  // Sync textarea if context changes externally
  React.useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(config, null, 2));
    }
  }, [isOpen, config]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[100] w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-accent transition-colors shadow-primary/30"
        title="Edit Configuration"
      >
        <Settings size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 font-body">Site Configuration</h2>
                  <p className="text-gray-500 text-sm mt-1">Edit the JSON below to change website content in real-time.</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Editor */}
              <div className="flex-1 overflow-hidden p-6 bg-gray-50 flex flex-col gap-4">
                {error && (
                  <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm font-medium">
                    {error}
                  </div>
                )}
                <textarea
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    setError('');
                  }}
                  className="w-full flex-1 p-4 rounded-xl border border-gray-200 font-mono text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white shadow-inner"
                  spellCheck="false"
                />
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    <Download size={16} />
                    Download File
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>
                </div>

                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-accent transition-colors font-medium shadow-lg shadow-primary/30"
                >
                  <Save size={18} />
                  Save & Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminPanel;
