const crypto = require('crypto');

const VT_API_BASE = 'https://www.virustotal.com/api/v3';
const API_KEY = process.env.VIRUSTOTAL_API_KEY;

const ALLOWED_EXTENSIONS = ['apk', 'exe', 'zip', 'dmg', 'msi', 'deb', 'tar', 'gz', 'xz', 'rar', '7z'];

/**
 * a) Compute SHA-256 hash of a file buffer
 */
exports.hashFile = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * b) Check if a file hash is already known by VirusTotal
 */
exports.checkHashOnVirusTotal = async (hash) => {
  try {
    const response = await fetch(`${VT_API_BASE}/files/${hash}`, {
      method: 'GET',
      headers: { 'x-apikey': API_KEY }
    });

    if (response.status === 200) {
      const data = await response.json();
      return {
        known: true,
        malicious: data.data.attributes.last_analysis_stats.malicious,
        permalink: data.data.links.self
      };
    }

    if (response.status === 404) {
      return { known: false };
    }

    return { known: false, error: true };
  } catch (error) {
    console.error('[VT_HASH_CHECK] Error:', error.message);
    return { known: false, error: true };
  }
};

/**
 * c) Upload a file buffer to VirusTotal for scanning
 */
exports.uploadFileToVirusTotal = async (buffer, filename) => {
  try {
    const formData = new FormData();
    const blob = new Blob([buffer]);
    formData.append('file', blob, filename);

    const response = await fetch(`${VT_API_BASE}/files`, {
      method: 'POST',
      headers: { 'x-apikey': API_KEY },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VT upload failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
      analysisId: data.data.id,
      permalink: data.data.links.self
    };
  } catch (error) {
    console.error('[VT_UPLOAD] Error:', error.message);
    throw error;
  }
};

/**
 * d) Poll VirusTotal for scan results
 */
exports.pollScanResult = async (analysisId, maxAttempts = 10, intervalMs = 15000) => {
  try {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`${VT_API_BASE}/analyses/${analysisId}`, {
        method: 'GET',
        headers: { 'x-apikey': API_KEY }
      });

      if (response.ok) {
        const data = await response.json();
        const attrs = data.data.attributes;

        if (attrs.status === 'completed') {
          return {
            completed: true,
            malicious: attrs.stats.malicious,
            stats: attrs.stats
          };
        }
      }

      // Wait before next attempt
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    return { completed: false };
  } catch (error) {
    console.error('[VT_POLL] Error:', error.message);
    return { completed: false };
  }
};

/**
 * e) Validate file MIME type using magic bytes
 */
exports.validateFileMime = async (buffer) => {
  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const type = await fileTypeFromBuffer(buffer);

    if (!type) {
      return { valid: false, detectedType: null };
    }

    const valid = ALLOWED_EXTENSIONS.includes(type.ext);
    return { valid, detectedType: type.ext };
  } catch (error) {
    console.error('[MIME_VALIDATE] Error:', error.message);
    return { valid: false, detectedType: null };
  }
};
