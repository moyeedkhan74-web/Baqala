const { validateFileMime, hashFile, checkHashOnVirusTotal } = require('../services/virusScanner');

/**
 * Express middleware — runs AFTER multer.
 * Validates MIME type, hashes file, checks VirusTotal hash DB.
 * Blocks known-malicious files instantly.
 * Sets flags for background scan if file is unknown.
 */
module.exports = async (req, res, next) => {
  // No file uploaded — let the route handler deal with it
  if (!req.file && !(req.files && req.files.appFile && req.files.appFile[0])) {
    return next();
  }

  // Normalize: support both req.file (single) and req.files.appFile[0] (fields)
  const file = req.file || (req.files && req.files.appFile && req.files.appFile[0]);
  if (!file || !file.buffer) {
    return next();
  }

  // 1. MIME Validation
  const { valid, detectedType } = await validateFileMime(file.buffer);
  if (!valid) {
    return res.status(400).json({
      message: `Invalid file type. Detected: ${detectedType || 'unknown'}. Allowed: APK, EXE, ZIP, DMG, MSI, DEB, TAR, GZ, XZ, RAR, 7Z`
    });
  }

  try {
    // 2. Hash the file
    const hash = hashFile(file.buffer);
    req.fileHash = hash;

    // 3. Check hash against VirusTotal
    const vtResult = await checkHashOnVirusTotal(hash);

    if (vtResult.known && vtResult.malicious > 0) {
      // INSTANT REJECT — known malicious file
      return res.status(400).json({
        message: `This file has been flagged as malicious by ${vtResult.malicious} antivirus engine(s). Upload rejected.`,
        engines: vtResult.malicious
      });
    }

    if (vtResult.known && vtResult.malicious === 0) {
      // Known clean — skip full scan
      req.vtKnownClean = true;
    } else {
      // Unknown file — needs full VT scan
      req.vtNeedsFullScan = true;
    }

    next();
  } catch (error) {
    // VT is down or unreachable — don't block uploads
    console.error('[SCAN_MIDDLEWARE] VT error, proceeding anyway:', error.message);
    req.vtError = true;
    next();
  }
};
