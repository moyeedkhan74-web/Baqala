const { 
  startMultipartUpload, 
  uploadPart, 
  completeMultipartUpload,
  abortMultipartUpload 
} = require('../utils/b2Storage');

// Starts the cloud multipart process
exports.initUpload = async (req, res, next) => {
  try {
    const { fileName, contentType } = req.body;
    // Sanitize filename: replace spaces and special characters with underscores
    const sanitizedFileName = fileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = `apps/${Date.now()}_${sanitizedFileName}`;
    
    console.log(`[B2_INIT] Initializing upload for: ${fileName} as ${filePath}`);
    const result = await startMultipartUpload(filePath, contentType || 'application/octet-stream');
    
    if (result.success) {
      console.log(`[B2_INIT] Success. UploadID: ${result.uploadId} | Path: ${result.filePath}`);
      res.json({ 
        success: true, 
        uploadId: result.uploadId, 
        filePath: result.filePath 
      });
    } else {
      console.error(`[B2_INIT] Failed:`, result.error);
      res.status(500).json({ message: 'Failed to initialize cloud upload', error: result.error });
    }
  } catch (error) {
    next(error);
  }
};

exports.uploadChunk = async (req, res, next) => {
  try {
    const { chunkIndex, uploadId, filePath } = req.body;
    const chunk = req.file;

    if (!chunk) {
      return res.status(400).json({ message: 'No chunk data received.' });
    }

    // chunk.buffer is available because we use memoryStorage
    const partNumber = parseInt(chunkIndex) + 1;
    console.log(`[B2_CHUNK] Uploading Part ${partNumber} for ${uploadId}`);
    const result = await uploadPart(filePath, uploadId, partNumber, chunk.buffer);
    
    if (result.success) {
      console.log(`[B2_CHUNK] Part ${partNumber} complete. ETag: ${result.etag}`);
      res.json({ success: true, etag: result.etag, partNumber });
    } else {
      console.error(`[B2_CHUNK] Part ${partNumber} failed:`, result.error);
      res.status(500).json({ message: `Failed to upload part ${partNumber}`, error: result.error });
    }
  } catch (error) {
    next(error);
  }
};

exports.combineChunks = async (req, res, next) => {
  try {
    const { uploadId, filePath, parts, fileName, title, description, shortDescription,
            tagline, category, version, platform, developerName, tags, fileSize } = req.body;
    
    // parts should be array of { ETag, PartNumber }
    // FORCE isPrivate=true for apps
    const result = await completeMultipartUpload(filePath, uploadId, parts, true);

    if (!result.success) {
      await abortMultipartUpload(filePath, uploadId);
      return res.status(500).json({ message: 'Failed to finalize cloud upload', error: result.error });
    }

    // ── VirusTotal Scan Integration for chunked uploads ──
    // We don't have the full buffer here (chunks were uploaded directly to B2),
    // so we create the app record first, then attempt to download for scanning.
    const App = require('../models/App');
    let scanStatus = 'not_scanned';
    let appStatus = 'approved';
    let fileHash = null;

    try {
      // Try to download the combined file from B2 for scanning
      const { getDownloadUrl, extractB2Key } = require('../utils/b2Storage');
      const { validateFileMime, hashFile, checkHashOnVirusTotal } = require('../services/virusScanner');
      const https = require('https');
      const http = require('http');

      const b2Key = extractB2Key(result.url);
      if (b2Key) {
        const dlResult = await getDownloadUrl(result.url, fileName);
        if (dlResult.success) {
          // Download the file into a buffer
          const fileBuffer = await new Promise((resolve, reject) => {
            const protocol = dlResult.url.startsWith('https') ? https : http;
            protocol.get(dlResult.url, (response) => {
              if (response.statusCode !== 200) {
                reject(new Error(`Download failed: ${response.statusCode}`));
                return;
              }
              const chunks = [];
              response.on('data', chunk => chunks.push(chunk));
              response.on('end', () => resolve(Buffer.concat(chunks)));
              response.on('error', reject);
            }).on('error', reject);
          });

          // MIME Validation
          const { valid, detectedType } = await validateFileMime(fileBuffer);
          if (!valid) {
            // Delete the malicious/invalid file from B2
            const { deleteFromB2 } = require('../utils/b2Storage');
            await deleteFromB2(b2Key, true);
            return res.status(400).json({
              message: `Invalid file type. Detected: ${detectedType || 'unknown'}. Allowed: APK, EXE, ZIP, DMG, MSI, DEB, TAR, GZ, XZ, RAR, 7Z`
            });
          }

          // Hash check
          fileHash = hashFile(fileBuffer);
          const vtResult = await checkHashOnVirusTotal(fileHash);

          if (vtResult.known && vtResult.malicious > 0) {
            // Instant reject — delete from B2
            const { deleteFromB2 } = require('../utils/b2Storage');
            await deleteFromB2(b2Key, true);
            return res.status(400).json({
              message: `This file has been flagged as malicious by ${vtResult.malicious} antivirus engine(s). Upload rejected.`,
              engines: vtResult.malicious
            });
          }

          if (vtResult.known && vtResult.malicious === 0) {
            scanStatus = 'clean';
            appStatus = 'approved';
          } else {
            // Unknown file — needs background scan
            scanStatus = 'scanning';
            appStatus = 'pending';

            // We'll fire the background scan after creating the app
            // Store the buffer reference for later
            req._scanBuffer = fileBuffer;
          }
        }
      }
    } catch (scanError) {
      console.error('[COMBINE_SCAN] Scan step failed, proceeding:', scanError.message);
      scanStatus = 'scan_failed';
      appStatus = 'approved';
    }

    // Create the app document if metadata was provided
    if (title && description) {
      let rawCategory = category;
      let parsedCategory = [];
      if (Array.isArray(rawCategory)) {
        parsedCategory = rawCategory;
      } else if (typeof rawCategory === 'string') {
        if (rawCategory.startsWith('[') && rawCategory.endsWith(']')) {
          try { parsedCategory = JSON.parse(rawCategory); } catch (e) { parsedCategory = [rawCategory]; }
        } else if (rawCategory.includes(',')) {
          parsedCategory = rawCategory.split(',').map(c => c.trim());
        } else {
          parsedCategory = [rawCategory];
        }
      } else if (rawCategory) {
        parsedCategory = [String(rawCategory)];
      } else {
        parsedCategory = ['Other'];
      }
      parsedCategory = parsedCategory.slice(0, 5);

      const { extractB2Key: extractKey } = require('../utils/b2Storage');
      let scrubbedFileUrl = result.url;
      const key = extractKey(result.url);
      if (key) {
        scrubbedFileUrl = `https://${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${key}`;
      }
      const scrubbedFileName = (fileName || 'unknown').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');

      const app = await App.create({
        title,
        description,
        shortDescription: shortDescription || description.substring(0, 200),
        tagline: tagline || '',
        category: parsedCategory,
        developer: req.user._id,
        developerName: developerName || (req.user ? req.user.name : 'Unknown'),
        fileUrl: scrubbedFileUrl,
        fileName: scrubbedFileName,
        fileSize: fileSize || 0,
        icon: req.body.icon || '',
        screenshots: req.body.screenshots || [],
        version: version || '1.0.0',
        platform: platform || 'Cross-platform',
        tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
        scanStatus,
        status: appStatus,
        fileHash
      });

      // Fire background scan if needed
      if (scanStatus === 'scanning' && req._scanBuffer) {
        const { runBackgroundScan } = require('../services/backgroundScan');
        runBackgroundScan(app._id, req._scanBuffer, fileName || 'unknown')
          .catch(err => console.error('[SCAN_LAUNCH] Error:', err.message));
      }

      await app.populate('developer', 'name email avatar');
      return res.json({
        success: true,
        url: result.url,
        fileName,
        app
      });
    }

    res.json({ 
      success: true, 
      url: result.url, 
      fileName,
    });
  } catch (error) {
    next(error);
  }
};

