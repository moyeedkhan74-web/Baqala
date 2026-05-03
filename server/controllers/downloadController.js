const Download = require('../models/Download');
const App = require('../models/App');
const { getDownloadUrl } = require('../utils/b2Storage');

exports.downloadApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.appId);
    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    // Allow downloading even if pending (requested for testing visibility)
    if (app.status === 'rejected') {
      return res.status(400).json({ message: 'This app has been rejected and is not available for download.' });
    }

    // Record download
    await Download.create({
      user: req.user ? req.user._id : null,
      app: app._id,
      ip: req.ip
    });

    // Increment download counter
    await App.findByIdAndUpdate(app._id, { $inc: { totalDownloads: 1 } });

    // Return the external file URL so the client can download it directly
    if (!app.fileUrl) {
      return res.status(404).json({ message: 'File URL not found.' });
    }

    let downloadUrl = app.fileUrl;

    // If it's in a B2 bucket, we must sign it
    if (app.fileUrl.includes('.backblazeb2.com/') || app.fileUrl.includes('/api/assets/')) {
      const result = await getDownloadUrl(app.fileUrl);
      if (result.success) {
        downloadUrl = result.url;
      }
    }

    res.json({ downloadUrl, message: 'Download initiated' });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error during download.' });
  }
};

exports.getDownloadStats = async (req, res) => {
  try {
    const appId = req.params.appId;
    const app = await App.findById(appId);
    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    const totalDownloads = await Download.countDocuments({ app: appId });

    // Last 30 days breakdown
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyDownloads = await Download.aggregate([
      {
        $match: {
          app: app._id,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ totalDownloads, dailyDownloads });
  } catch (error) {
    console.error('Download stats error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
