const CrashLog = require('../models/CrashLog');
const App = require('../models/App');

exports.createCrashLog = async (req, res) => {
  try {
    const { appId, logType, title, errorStack, deviceInfo, aiDiagnostic } = req.body;

    const app = await App.findById(appId);
    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    const crashLog = await CrashLog.create({
      app: appId,
      developer: app.developer,
      logType: logType || 'runtime_crash',
      title: title || 'App Health Report',
      errorStack: errorStack || '',
      deviceInfo: deviceInfo || {},
      aiDiagnostic: aiDiagnostic || {}
    });

    res.status(201).json({ message: 'Crash log recorded successfully', crashLog });
  } catch (error) {
    console.error('Create crash log error:', error);
    res.status(500).json({ message: 'Server error recording crash log.' });
  }
};

exports.getAppCrashLogs = async (req, res) => {
  try {
    const appId = req.params.appId;
    const app = await App.findById(appId);

    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    if (app.developer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view diagnostics for this app.' });
    }

    // Determine retention tier
    const isProTier = req.user.tier === 'advance' || req.user.role === 'admin';
    const limit = isProTier ? 200 : 50; // Free gets last 50 logs, Pro gets 200

    const crashLogs = await CrashLog.find({ app: appId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      crashLogs,
      tier: isProTier ? 'pro' : 'free',
      limitApplied: limit
    });
  } catch (error) {
    console.error('Get crash logs error:', error);
    res.status(500).json({ message: 'Server error fetching crash logs.' });
  }
};

exports.explainCrashWithAI = async (req, res) => {
  try {
    const { crashId } = req.params;
    const crashLog = await CrashLog.findById(crashId).populate('app');

    if (!crashLog) {
      return res.status(404).json({ message: 'Crash log not found.' });
    }

    // Generate simple AI diagnostic response based on error stack
    let aiExplanation = "No detailed stack trace available. Verify build configuration and permissions in AndroidManifest.xml.";
    let suggestedFix = "Check if all required permissions and activities are properly declared.";

    if (crashLog.errorStack.includes('NullPointerException')) {
      aiExplanation = "NullPointerException detected: An uninitialized variable or null object reference was accessed.";
      suggestedFix = "Add null-checks or use optional chaining before invoking methods on variables.";
    } else if (crashLog.errorStack.includes('ClassNotFoundException') || crashLog.errorStack.includes('NoClassDefFoundError')) {
      aiExplanation = "Missing Class or Library dependency during execution.";
      suggestedFix = "Ensure ProGuard / R8 rules keep necessary class definitions or include dependency in build.gradle.";
    } else if (crashLog.errorStack.includes('SecurityException') || crashLog.errorStack.includes('Permission')) {
      aiExplanation = "Missing Runtime Permission flag.";
      suggestedFix = "Declare missing permission in AndroidManifest.xml and request runtime permission prompt.";
    } else if (crashLog.errorStack.includes('OutOfMemoryError')) {
      aiExplanation = "App exceeded heap memory limits (e.g., loading uncompressed images).";
      suggestedFix = "Enable standard image caching or scale down bitmap resources before rendering.";
    }

    crashLog.aiDiagnostic = {
      summary: aiExplanation,
      suggestedFix: suggestedFix,
      severity: crashLog.errorStack.length > 500 ? 'high' : 'medium'
    };
    await crashLog.save();

    res.json({ message: 'AI Diagnostic complete', aiDiagnostic: crashLog.aiDiagnostic });
  } catch (error) {
    console.error('AI Explain error:', error);
    res.status(500).json({ message: 'Server error generating AI explanation.' });
  }
};
exports.getDeveloperCrashLogs = async (req, res) => {
  try {
    const isProTier = req.user.tier === 'advance' || req.user.role === 'admin';
    const limit = isProTier ? 500 : 50;

    const logs = await CrashLog.find({ developer: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('app', 'title icon');

    res.json({ logs, tier: isProTier ? 'pro' : 'free', limitApplied: limit });
  } catch (error) {
    console.error('Get developer crash logs error:', error);
    res.status(500).json({ message: 'Server error fetching crash logs.' });
  }
};
