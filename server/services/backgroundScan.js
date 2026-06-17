const App = require('../models/App');
const User = require('../models/User');
const { uploadFileToVirusTotal, pollScanResult } = require('./virusScanner');
const { sendAutoRejectEmail } = require('./emailService');

/**
 * Fire-and-forget background scan.
 * Stage 3 Implementation
 */
exports.runBackgroundScan = async (appId, buffer, filename) => {
  let app;
  try {
    app = await App.findById(appId).populate('developer', 'email');
    if (!app) {
      console.warn(`[BG_SCAN] App ${appId} not found, aborting scan.`);
      return;
    }

    // 1. Upload to VirusTotal
    const { analysisId, permalink } = await uploadFileToVirusTotal(buffer, filename);
    app.vtScanId = analysisId;
    app.vtReportUrl = permalink;
    await app.save();

    // 2. Poll for results
    const result = await pollScanResult(analysisId);
    if (!result.completed) {
       console.error(`[BG_SCAN] Scan did not complete for ${appId}`);
       return;
    }

    const { malicious = 0, suspicious = 0, undetected = 0 } = result.stats || {};
    const totalEngines = malicious + suspicious + undetected + (result.stats?.harmless || 0) + (result.stats?.failure || 0);

    app.vtMaliciousCount = malicious;
    app.vtTotalEngines = totalEngines;

    const { sendScanResultNotification } = require('./notificationService');
    
    // 3. Decision Logic (Stage 3)
    if (malicious >= 3) {
      // AUTO REJECT
      app.status = 'auto_rejected';
      app.vtResult = 'malware';
      app.rejectionReason = 'Automated security scan detected malware (3+ engines flagged).';
      
      // Notify Developer
      if (app.developer && app.developer.email) {
        await sendAutoRejectEmail(app.developer.email, app.title, app.vtReportUrl, app.vtMaliciousCount, app.vtTotalEngines);
      }
    } else if (malicious >= 1 && malicious <= 2) {
      // SUSPICIOUS
      app.status = 'pending_review';
      app.vtResult = 'suspicious';
    } else {
      // CLEAN
      app.status = 'pending_review';
      app.vtResult = 'clean';
    }

    // In-App Notification (Centralized)
    await sendScanResultNotification(app.developer._id, app.title, app._id, app.vtResult);

    await app.save();
    
    // 4. Supabase Realtime Event (Stage 3) - Notify Admin Dashboard
    const supabase = require('../config/supabase');
    supabase.channel('admin_scans')
      .send({
        type: 'broadcast',
        event: 'scan_complete',
        payload: { appId: app._id, status: app.status, vtResult: app.vtResult }
      })
      .catch(err => console.error('[REALTIME_ERROR]:', err.message));

    console.log(`[BG_SCAN] Complete for ${appId}. Result: ${app.vtResult}, Status: ${app.status}`);

  } catch (error) {
    console.error('[BG_SCAN] Background scan error:', error.message);
  }
};
