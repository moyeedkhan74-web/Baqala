const ApkReader = require('adbkit-apkreader');
const AdmZip = require('adm-zip');

async function extractApkMetadata(filePath) {
  const result = {
    packageName: null, versionName: null, permissions: [],
    activities: [], services: [], receivers: [],
    fileCount: 0, nativeLibCount: 0, extractionError: null
  };
  try {
    const reader = await ApkReader.open(filePath);
    const manifest = await reader.readManifest();
    result.packageName = manifest.package;
    result.versionName = manifest.versionName;
    result.permissions = (manifest.usesPermissions || []).map(p => p.name).filter(Boolean);
    const app = manifest.application || {};
    result.activities = (app.activities || []).map(a => a.name).filter(Boolean);
    result.services   = (app.services  || []).map(s => s.name).filter(Boolean);
    result.receivers  = (app.receivers || []).map(r => r.name).filter(Boolean);
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();
    result.fileCount = entries.length;
    result.nativeLibCount = entries.filter(e => e.entryName.endsWith('.so')).length;
  } catch (err) {
    result.extractionError = err.message;
  }
  return result;
}

module.exports = { extractApkMetadata };
