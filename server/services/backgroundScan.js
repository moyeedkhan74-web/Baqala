const App = require('../models/App');
const { deleteFromB2, extractB2Key } = require('../utils/b2Storage');
const { uploadFileToVirusTotal, pollScanResult } = require('./virusScanner');

/**
 * Fire-and-forget background scan.
 * Uploads file to VirusTotal, polls for result, and auto-approves/rejects.
 * NEVER throws — this must never crash the server.
 */
exports.runBackgroundScan = async (appId, buffer, filename) => {
  let app;
  try {
    app = await App.findById(appId);
    if (!app) {
      console.warn(`[BG_SCAN] App ${appId} not found, aborting scan.`);
      return;
    }

    // 1. Upload to VirusTotal
    const { analysisId, permalink } = await uploadFileToVirusTotal(buffer, filename);
    app.vtAnalysisId = analysisId;
    app.vtPermalink = permalink;
    await app.save();

    // 2. Poll for results
    const result = await pollScanResult(analysisId);
    app.scanCompletedAt = new Date();
    app.vtMaliciousCount = result.malicious || 0;

    if (result.completed && result.malicious > 0) {
      // MALICIOUS — reject and delete file from B2
      app.scanStatus = 'malicious';
      app.status = 'rejected';

      // Delete binary from B2
      const b2Key = extractB2Key(app.fileUrl);
      if (b2Key) {
        await deleteFromB2(b2Key, true);
        console.log(`[BG_SCAN] Deleted malicious file from B2: ${b2Key}`);
      }

      console.log(`[BG_SCAN] MALICIOUS: App ${appId} rejected (${result.malicious} engines flagged)`);
    } else if (result.completed && result.malicious === 0) {
      // CLEAN — approve
      app.scanStatus = 'clean';
      app.status = 'approved';
      console.log(`[BG_SCAN] CLEAN: App ${appId} approved`);
    } else {
      // Scan timed out — approve anyway
      app.scanStatus = 'scan_failed';
      app.status = 'approved';
      console.warn(`[BG_SCAN] Scan timed out for App ${appId}, approved anyway.`);
    }

    await app.save();
  } catch (error) {
    console.error('[BG_SCAN] Background scan error:', error.message);
    try {
      if (!app) app = await App.findById(appId);
      if (app) {
        app.scanStatus = 'scan_failed';
        app.status = 'approved';
        await app.save();
      }
    } catch (saveError) {
      console.error('[BG_SCAN] Failed to save error state:', saveError.message);
    }
  }
};
