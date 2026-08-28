const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const mongoose = require('mongoose');

const App = require('../models/App');
const User = require('../models/User');
const EmailLog = require('../models/EmailLog');
const Notification = require('../models/Notification');
const { listTempApks } = require('../utils/b2Storage');
const { cleanupTempBucket } = require('../services/apkAnalyzer');
const { getQueueSize, clearQueue } = require('../utils/notificationQueue');

const execPromise = util.promisify(exec);

const TEMP_DIR = path.join(__dirname, '../../uploads/temp');

// Recursively compute the byte size of a directory
const getDirSize = async (dir) => {
  let total = 0;
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await getDirSize(full);
    } else if (entry.isFile()) {
      try {
        const stat = await fs.promises.stat(full);
        total += stat.size;
      } catch (_) { /* ignore stat errors */ }
    }
  }
  return total;
};

const deleteDirContents = async (dir) => {
  if (!fs.existsSync(dir)) return 0;
  const size = await getDirSize(dir);
  await fs.promises.rm(dir, { recursive: true, force: true });
  await fs.promises.mkdir(dir, { recursive: true });
  return size;
};

// Best-effort container disk usage (real on Linux/Windows hosts)
const getDiskUsage = async () => {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execPromise(
        'wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:csv'
      );
      const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
      const dataLine = lines[lines.length - 1];
      const cols = dataLine.split(',');
      // CSV columns: Node, Size, FreeSpace
      const totalBytes = parseInt(cols[1], 10);
      const freeBytes = parseInt(cols[2], 10);
      if (!totalBytes || isNaN(totalBytes)) throw new Error('wmic parse failed');
      const usedBytes = totalBytes - freeBytes;
      return {
        totalBytes,
        usedBytes,
        freeBytes,
        usedPercentage: +((usedBytes / totalBytes) * 100).toFixed(2)
      };
    }

    const { stdout } = await execPromise('df -B1 / | tail -1');
    const cols = stdout.trim().split(/\s+/);
    const totalBytes = parseInt(cols[1], 10);
    const usedBytes = parseInt(cols[2], 10);
    const freeBytes = parseInt(cols[3], 10);
    if (!totalBytes || isNaN(totalBytes)) throw new Error('df parse failed');
    return {
      totalBytes,
      usedBytes,
      freeBytes,
      usedPercentage: +((usedBytes / totalBytes) * 100).toFixed(2)
    };
  } catch (err) {
    return null; // Unknown on this platform — frontend renders "N/A"
  }
};

// Computes the full storage breakdown. Shared by GET /storage and the SSE stream.
// Every data source is individually wrapped so a single failure never crashes the endpoint.
const buildMetrics = async () => {
  // 1. Database stats
  let dbStats = {};
  try {
    dbStats = await mongoose.connection.db.command({ dbStats: 1 });
  } catch (e) {
    console.error('[MONITORING] dbStats failed:', e.message);
  }

  // 2. App binary aggregation (guard $screenshots that might be null)
  let binaryAgg = { apksSizeBytes: 0, totalInstallers: 0, iconsCount: 0, screenshotsCount: 0 };
  try {
    const result = await App.aggregate([
      {
        $group: {
          _id: null,
          apksSizeBytes: { $sum: { $ifNull: ['$fileSize', 0] } },
          totalInstallers: { $sum: 1 },
          iconsCount: { $sum: { $cond: [{ $and: [{ $ne: ['$icon', ''] }, { $ne: ['$icon', null] }] }, 1, 0] } },
          screenshotsCount: { $sum: { $size: { $ifNull: ['$screenshots', []] } } }
        }
      }
    ]);
    binaryAgg = result[0] || binaryAgg;
  } catch (e) {
    console.error('[MONITORING] App aggregate failed:', e.message);
  }

  // 3. Temp files from B2
  let tempFiles = [];
  try {
    tempFiles = await listTempApks();
  } catch (e) {
    console.error('[MONITORING] listTempApks failed:', e.message);
  }

  // 4. Counts
  const emailLogsCount = await EmailLog.estimatedDocumentCount().catch(() => 0);
  const notificationsCount = await Notification.estimatedDocumentCount().catch(() => 0);
  const avatarCount = await User.countDocuments({ avatar: { $nin: ['', null] } }).catch(() => 0);

  // 5. Local temp directory size
  let tempDirSizeBytes = 0;
  try {
    if (fs.existsSync(TEMP_DIR)) {
      tempDirSizeBytes = await getDirSize(TEMP_DIR);
    }
  } catch (_) { /* dir may not exist on Render */ }

  const orphanChunksSizeBytes = tempFiles.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);

  // 6. Host disk usage
  const systemDisk = await getDiskUsage();

  // Build response objects
  const database = {
    sizeBytes: (dbStats.storageSize || ((dbStats.dataSize || 0) + (dbStats.indexSize || 0))) || 0,
    dataSizeBytes: dbStats.dataSize || 0,
    indexSizeBytes: dbStats.indexSize || 0,
    collectionsCount: dbStats.collections || 0,
    documentsCount: dbStats.objects || 0
  };

  const binaries = {
    sizeBytes: binaryAgg.apksSizeBytes || 0,
    totalInstallers: binaryAgg.totalInstallers || 0,
    avgFileSizeBytes:
      (binaryAgg.totalInstallers || 0) > 0
        ? Math.round((binaryAgg.apksSizeBytes || 0) / binaryAgg.totalInstallers)
        : 0
  };

  const media = {
    iconsCount: binaryAgg.iconsCount || 0,
    screenshotsCount: binaryAgg.screenshotsCount || 0,
    avatarsCount: avatarCount || 0
  };

  const tempCache = {
    tempDirSizeBytes,
    orphanChunksSizeBytes,
    queueTasksPending: getQueueSize(),
    totalBytes: tempDirSizeBytes + orphanChunksSizeBytes
  };

  const logs = {
    emailLogsCount,
    notificationsCount,
    logFilesSizeBytes: 0
  };

  return {
    success: true,
    timestamp: new Date().toISOString(),
    systemDisk,
    breakdown: {
      database,
      binaries,
      media,
      tempCache,
      logs
    }
  };
};

// GET /api/admin/monitoring/storage
exports.getStorageMetrics = async (req, res) => {
  try {
    const metrics = await buildMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('[MONITORING] getStorageMetrics error:', error.message);
    res.status(500).json({ message: 'Failed to collect storage metrics.' });
  }
};

// GET /api/admin/monitoring/storage/stream (SSE)
// Auth is performed here because EventSource cannot set the Authorization header.
exports.storageStream = (req, res) => {
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');
  const token = req.query.token;

  const reject = (msg) => {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: msg }));
  };

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_) {
    return reject('Invalid or missing token.');
  }

  User.findById(decoded.id).then(user => {
    if (!user) return reject('User not found.');
    if (decoded.tokenVersion !== user.tokenVersion) return reject('Session invalidated.');
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const isWhitelisted = user.email && adminEmails.includes(user.email.toLowerCase());
    if (user.role !== 'admin' && !isWhitelisted) return reject('Admin access required.');

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': req.headers.origin || '*'
    });

    const push = async () => {
      try {
        const data = await buildMetrics();
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
      }
    };

    push();
    const interval = setInterval(push, 4000);

    req.on('close', () => {
      clearInterval(interval);
    });
  }).catch(() => reject('Authentication failed.'));
};

// POST /api/admin/monitoring/clear-cache
// SAFE: only prunes temporary/cache data. Never touches user/app binaries or records.
exports.clearCache = async (req, res) => {
  try {
    const details = {
      tempDirBytes: 0,
      queueTasksCleared: 0,
      b2TempFilesPruned: 0,
      b2TempBytesPruned: 0,
      emailLogsPruned: 0,
      notificationsPruned: 0,
      gcRun: false
    };
    let freedBytes = 0;

    // 1. Local temp upload fragments (multer uses memoryStorage, but clean defensively)
    details.tempDirBytes = await deleteDirContents(TEMP_DIR).catch(() => 0);
    freedBytes += details.tempDirBytes;

    // 2. In-memory background task queue
    details.queueTasksCleared = getQueueSize();
    clearQueue();

    // 3. B2 temp bucket — delete APK fragments older than 7 days
    try {
      const before = await listTempApks();
      details.b2TempFilesPruned = before.length;
      details.b2TempBytesPruned = before.reduce((s, f) => s + (f.sizeBytes || 0), 0);
      await cleanupTempBucket();
    } catch (err) {
      console.error('[MONITORING] B2 temp cleanup failed:', err.message);
    }

    // 4. Force-reclaim expired records immediately (beyond native TTL)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const emailRes = await EmailLog.deleteMany({ createdAt: { $lt: fourteenDaysAgo } }).catch(() => ({ deletedCount: 0 }));
    const notifRes = await Notification.deleteMany({ createdAt: { $lt: thirtyDaysAgo } }).catch(() => ({ deletedCount: 0 }));
    details.emailLogsPruned = emailRes.deletedCount || 0;
    details.notificationsPruned = notifRes.deletedCount || 0;

    // 5. Best-effort garbage collection
    if (typeof global.gc === 'function') {
      global.gc();
      details.gcRun = true;
    }

    res.json({
      success: true,
      freedBytes,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MONITORING] clearCache error:', error.message);
    res.status(500).json({ message: 'Failed to clear cache.' });
  }
};
