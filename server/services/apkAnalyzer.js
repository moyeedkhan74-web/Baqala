const AdmZip = require('adm-zip');
const {
  uploadTempApk,
  downloadTempApk,
  deleteTempApk,
  listTempApks,
} = require('../utils/b2Storage');

const SUSPICIOUS_KEYWORDS = [
  'bet','casino','slot','gambling','poker','lottery',
  'adult','xxx','porn','18+','onlyfans',
  'win cash','earn money fast','get rich',
  'withdraw','deposit','invest now',
  'crypto','bitcoin','ethereum','nft',
  'mlm','pyramid','referral bonus',
  'hack','cheat','mod apk','crack','bypass','root',
  'phishing','credit card','bank account',
  'password steal','keylogger','spy',
];

async function extractApkMetadata(apkBuffer, appId) {
  const result = {
    packageName: null,
    versionName: null,
    permissions: [],
    activities: [],
    services: [],
    receivers: [],
    fileCount: 0,
    nativeLibCount: 0,
    dexStrings: [],
    suspiciousUrls: [],
    extractionError: null,
  };

  let tempKey = null;

  try {
    // STEP 1: Parse manifest from RAM buffer — zero disk, instant
    let APKParser;
    try {
      APKParser = require('apk-parser3');
    } catch (e) {
      result.extractionError = 'apk-parser3 not installed — run: npm install apk-parser3';
      console.error('[APK_ANALYZER]', result.extractionError);
      return result;
    }

    try {
      const apk = await APKParser(apkBuffer);
      result.packageName = apk.package || null;
      result.versionName = apk.versionName || apk['android:versionName'] || null;
      result.permissions = (apk.usesPermissions || [])
        .map(p => (typeof p === 'string' ? p : p?.name))
        .filter(Boolean);
      const appNode = apk.application || {};
      result.activities = (appNode.activity || [])
        .map(a => a['android:name'] || a.name).filter(Boolean).slice(0, 20);
      result.services = (appNode.service || [])
        .map(s => s['android:name'] || s.name).filter(Boolean);
      result.receivers = (appNode.receiver || [])
        .map(r => r['android:name'] || r.name).filter(Boolean);
    } catch (manifestErr) {
      result.extractionError = `Manifest parse failed: ${manifestErr.message}`;
      console.warn('[APK_ANALYZER] Manifest error:', manifestErr.message);
    }

    // STEP 2: Count files using adm-zip from same RAM buffer
    try {
      const zip = new AdmZip(apkBuffer);
      const entries = zip.getEntries();
      result.fileCount = entries.length;
      result.nativeLibCount = entries.filter(e => e.entryName.endsWith('.so')).length;
    } catch (zipErr) {
      console.warn('[APK_ANALYZER] ZIP count failed:', zipErr.message);
    }

    // STEP 3: Upload to B2 temp bucket for dex analysis
    if (!process.env.B2_TEMP_BUCKET) {
      console.warn('[APK_ANALYZER] B2_TEMP_BUCKET not set — skipping dex scan');
      return result;
    }
    if (!process.env.B2_PRIVATE_KEY_ID) {
      console.warn('[APK_ANALYZER] B2_PRIVATE_KEY_ID not set — skipping dex scan');
      return result;
    }

    const upload = await uploadTempApk(appId, apkBuffer);
    if (!upload.success) {
      console.warn('[APK_ANALYZER] Temp B2 upload failed:', upload.error, '— skipping dex scan');
      return result;
    }
    tempKey = upload.key;

    // STEP 4: Download back and extract dex strings
    const downloadedBuffer = await downloadTempApk(tempKey);
    const zip2 = new AdmZip(downloadedBuffer);

    // Handle multiple dex files (classes.dex, classes2.dex etc)
    const dexEntries = zip2.getEntries().filter(e =>
      /^classes\d*\.dex$/.test(e.entryName)
    );

    const allStrings = [];
    for (const dexEntry of dexEntries) {
      try {
        const dexText = dexEntry.getData().toString('latin1');
        const matches = dexText.match(/[\x20-\x7E]{6,}/g) || [];
        allStrings.push(...matches);
      } catch (dexErr) {
        console.warn('[APK_ANALYZER] dex parse error:', dexErr.message);
      }
    }

    // Filter suspicious keyword matches
    result.dexStrings = allStrings
      .filter(s => SUSPICIOUS_KEYWORDS.some(k => s.toLowerCase().includes(k)))
      .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
      .slice(0, 30);

    // Extract URLs found in code
    result.suspiciousUrls = allStrings
      .filter(s =>
        (s.startsWith('http://') || s.startsWith('https://')) &&
        s.length > 12 &&
        !s.includes('android.') &&
        !s.includes('google.com') &&
        !s.includes('schema.org') &&
        !s.includes('apache.org') &&
        !s.includes('w3.org') &&
        !s.includes('mozilla.org') &&
        !s.includes('example.com')
      )
      .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
      .slice(0, 20);

    console.log(`[APK_ANALYZER] ✅ Package: ${result.packageName} | Permissions: ${result.permissions.length} | Suspicious strings: ${result.dexStrings.length} | URLs: ${result.suspiciousUrls.length}`);

  } catch (err) {
    result.extractionError = err.message;
    console.error('[APK_ANALYZER] Fatal error:', err.message);
  } finally {
    // ALWAYS delete from B2 temp — whether success or fail
    if (tempKey) {
      await deleteTempApk(tempKey).catch(e =>
        console.error('[APK_ANALYZER] Cleanup failed:', e.message)
      );
    }
  }

  return result;
}

// Weekly cleanup — safety net for orphan files
async function cleanupTempBucket() {
  console.log('[APK_CLEANUP] Starting weekly cleanup...');
  const files = await listTempApks();
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  let deleted = 0;
  let totalSizeFreed = 0;
  for (const file of files) {
    if (new Date(file.lastModified).getTime() < sevenDaysAgo) {
      await deleteTempApk(file.key);
      deleted++;
      totalSizeFreed += file.sizeBytes || 0;
    }
  }
  const mbFreed = (totalSizeFreed / 1024 / 1024).toFixed(2);
  console.log(`[APK_CLEANUP] ✅ Done — deleted ${deleted} files, freed ${mbFreed}MB`);
}

module.exports = { extractApkMetadata, cleanupTempBucket };
