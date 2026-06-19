const { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand,
  ListObjectsV2Command
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// --- CLIENTS ---

// Performance and Security middleware
const s3Config = {
  region: process.env.B2_REGION || 'us-east-005',
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
  requestHandler: {
    connectionTimeout: 15000,
    requestTimeout: 60000
  },
  forcePathStyle: true,
};

/**
 * Global Path Scrubber: Ensures every path sent to B2 is URL-safe and consistent.
 */
const sanitizePath = (path) => {
  if (!path || typeof path !== 'string') return '';
  
  // 1. Remove leading/trailing slashes and trim
  let clean = path.trim().replace(/^\/+|\/+$/g, '');
  
  // 2. Process segments
  return clean
    .split('/')
    .filter(segment => segment.length > 0) // Remove empty segments
    .map(segment => 
      segment
        .replace(/\s+/g, '_') // Spaces to underscores
        .replace(/[^a-zA-Z0-9._-]/g, '') // Remove parentheses, etc.
    )
    .join('/');
};

const binaryS3 = new S3Client(s3Config);

// Image Client (New Account - NOW FOR IMAGES)
const imageS3 = new S3Client({
  ...s3Config,
  region: process.env.B2_PRIVATE_REGION || 'us-east-005',
  endpoint: `https://${process.env.B2_PRIVATE_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.B2_PRIVATE_KEY_ID,
    secretAccessKey: process.env.B2_PRIVATE_APP_KEY,
  },
});

// --- HELPERS ---

/**
 * Robustly extracts the B2 Key from any given URL (Direct or Proxy)
 */
exports.extractB2Key = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // 1. Remove query params and fragments
    let cleanUrl = url.split('?')[0].split('#')[0];
    let path = '';

    if (cleanUrl.includes('.backblazeb2.com/')) {
      // Direct B2 URL (either S3 or Friendly format)
      const parts = cleanUrl.split('.backblazeb2.com/');
      path = parts[1];
    } else if (cleanUrl.includes('/api/assets/')) {
      // Proxy URL
      const parts = cleanUrl.split('/api/assets/');
      path = parts[1];
    } else {
      return null;
    }

    // 2. Remove leading slash
    if (path.startsWith('/')) path = path.substring(1);

    // 3. Handle Friendly URLs: strip 'file/' prefix if present
    if (path.startsWith('file/')) {
      path = path.substring(5);
    }

    // 4. Strip bucket name if it's the first segment
    const bucketName = process.env.B2_BUCKET_NAME;
    const privateBucketName = process.env.B2_PRIVATE_BUCKET;
    const pathParts = path.split('/');
    
    // Check if the first part is a known bucket name or looks like one
    if (pathParts.length > 1 && (
        pathParts[0] === bucketName || 
        pathParts[0] === privateBucketName || 
        pathParts[0].startsWith('baqala')
    )) {
      path = pathParts.slice(1).join('/');
    }

    // 5. Final Sanitization & Decoding
    return decodeURIComponent(path).replace(/^\/+/, '');
  } catch (err) {
    console.error('[B2_KEY_EXTRACT] Error:', err);
    return null;
  }
};

// --- ACTIONS ---

const doUpload = async (s3, bucket, endpoint, scrubbedPath, fileBuffer, contentType, isBinary) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: scrubbedPath,
    Body: fileBuffer,
    ContentType: contentType,
    ContentDisposition: (isBinary || scrubbedPath.startsWith('avatars/')) ? 'attachment' : 'inline',
    CacheControl: (isBinary || scrubbedPath.startsWith('avatars/')) ? 'no-cache' : 'public, max-age=31536000'
  });
  await s3.send(command);
  
  const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 5000}`;
  let url;
  if (isBinary) {
    url = `https://${endpoint}/${bucket}/${scrubbedPath}`;
  } else {
    url = `${baseUrl}/api/assets/${scrubbedPath}`;
  }
  return { success: true, url, path: scrubbedPath };
};

exports.uploadImage = async (reqOrFilePath, fileBuffer, contentType) => {
  try {
    const scrubbedPath = sanitizePath(typeof reqOrFilePath === 'string' ? reqOrFilePath : '');
    let bucket = scrubbedPath.startsWith('avatars/') ? (process.env.B2_AVATAR_BUCKET || 'baqala.avatar') : process.env.B2_PRIVATE_BUCKET;
    return await doUpload(imageS3, bucket, process.env.B2_PRIVATE_ENDPOINT, scrubbedPath, fileBuffer, contentType, false);
  } catch (error) {
    console.error(`B2 Image Upload Error:`, error.message);
    return { success: false, error: error.message };
  }
};

exports.uploadBinary = async (reqOrFilePath, fileBuffer, contentType) => {
  try {
    const scrubbedPath = sanitizePath(typeof reqOrFilePath === 'string' ? reqOrFilePath : '');
    return await doUpload(binaryS3, process.env.B2_BUCKET_NAME, process.env.B2_ENDPOINT, scrubbedPath, fileBuffer, contentType, true);
  } catch (error) {
    console.error(`B2 Binary Upload Error:`, error.message);
    return { success: false, error: error.message };
  }
};

exports.deleteImage = async (filePath) => {
  try {
    let bucket = filePath && filePath.startsWith('avatars/') ? (process.env.B2_AVATAR_BUCKET || 'baqala.avatar') : process.env.B2_PRIVATE_BUCKET;
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: filePath });
    await imageS3.send(command);
    return { success: true };
  } catch (error) {
    console.error(`B2 Image Delete Error:`, error.message);
    return { success: false, error: error.message };
  }
};

exports.deleteBinary = async (filePath) => {
  try {
    const command = new DeleteObjectCommand({ Bucket: process.env.B2_BUCKET_NAME, Key: filePath });
    await binaryS3.send(command);
    return { success: true };
  } catch (error) {
    console.error(`B2 Binary Delete Error:`, error.message);
    return { success: false, error: error.message };
  }
};

// ============================================
// TEMP SCAN FUNCTIONS — baqala-temp-scans bucket
// Uses imageS3 (Account 2) — same as baqala-private
// 20% allocation = 2GB — weekly cleanup
// ============================================

exports.uploadTempApk = async (appId, buffer) => {
  if (!process.env.B2_TEMP_BUCKET) {
    return { success: false, error: 'B2_TEMP_BUCKET not set' };
  }
  try {
    const key = `temp/${appId}.apk`;
    await imageS3.send(new PutObjectCommand({
      Bucket: process.env.B2_TEMP_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'application/vnd.android.package-archive',
      ContentDisposition: 'attachment',
    }));
    console.log(`[B2_TEMP] Uploaded: ${key} (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);
    return { success: true, key };
  } catch (err) {
    console.error('[B2_TEMP] Upload failed:', err.message);
    return { success: false, error: err.message };
  }
};

exports.downloadTempApk = async (key) => {
  const response = await imageS3.send(new GetObjectCommand({
    Bucket: process.env.B2_TEMP_BUCKET,
    Key: key,
  }));
  const chunks = [];
  for await (const chunk of response.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
};

exports.deleteTempApk = async (key) => {
  try {
    await imageS3.send(new DeleteObjectCommand({
      Bucket: process.env.B2_TEMP_BUCKET,
      Key: key,
    }));
    console.log(`[B2_TEMP] Deleted: ${key}`);
  } catch (err) {
    console.error('[B2_TEMP] Delete failed:', err.message);
  }
};

exports.listTempApks = async () => {
  try {
    const response = await imageS3.send(new ListObjectsV2Command({
      Bucket: process.env.B2_TEMP_BUCKET,
      Prefix: 'temp/',
    }));
    return (response.Contents || []).map(f => ({
      key: f.Key,
      lastModified: f.LastModified,
      sizeBytes: f.Size,
    }));
  } catch (err) {
    console.error('[B2_TEMP] List failed:', err.message);
    return [];
  }
};

// --- Secure Download Support (For Private Bucket) ---

exports.getDownloadUrl = async (filePathOrUrl, fileName) => {
  try {
    // If a full URL is passed, extract the key first
    const key = filePathOrUrl.includes('/') && (filePathOrUrl.includes('http') || filePathOrUrl.includes('.com'))
      ? exports.extractB2Key(filePathOrUrl)
      : sanitizePath(filePathOrUrl);

    if (!key) throw new Error('Invalid file path or URL for download');

    // With the account swap, binaries now live in the OLD account (publicS3 / B2_BUCKET_NAME)
    const s3 = binaryS3;
    const bucket = process.env.B2_BUCKET_NAME;

    console.log(`[B2_SIGN] Signing Key: "${key}" in Bucket: "${bucket}" for file: "${fileName || 'auto'}"`);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      // Force download with the specified filename if provided
      ResponseContentDisposition: fileName 
        ? `attachment; filename="${fileName}"` 
        : 'attachment'
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return { success: true, url: signedUrl };
  } catch (error) {
    console.error('B2 Signed URL Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Downloads a file from B2 and returns it as a Buffer.
 * Used for automated virus scanning or administrative processing.
 */
exports.getFileBuffer = async (filePathOrUrl) => {
  try {
    const key = filePathOrUrl.includes('/') && (filePathOrUrl.includes('http') || filePathOrUrl.includes('.com'))
      ? exports.extractB2Key(filePathOrUrl)
      : sanitizePath(filePathOrUrl);

    if (!key) throw new Error('Invalid file path or URL for buffer retrieval');

    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
    });

    const response = await binaryS3.send(command);
    
    // Convert stream to Buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('B2 Get Buffer Error:', error.message);
    throw error;
  }
};

// --- Multipart Upload Support (Always Private for Apps) ---

exports.startMultipartUpload = async (filePath, contentType) => {
  try {
    const s3 = binaryS3;
    const bucket = process.env.B2_BUCKET_NAME;
    const scrubbedPath = sanitizePath(filePath);

    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: scrubbedPath,
      ContentType: contentType,
      ContentDisposition: 'attachment',
    });
    const { UploadId } = await s3.send(command);
    return { success: true, uploadId: UploadId, filePath: scrubbedPath };
  } catch (error) {
    console.error('B2 Multipart Start Error:', error.message);
    return { success: false, error: error.message };
  }
};

exports.uploadPart = async (filePath, uploadId, partNumber, body) => {
  try {
    const s3 = binaryS3;
    const bucket = process.env.B2_BUCKET_NAME;

    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: filePath,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: body,
    });
    const { ETag } = await s3.send(command);
    return { success: true, etag: ETag };
  } catch (error) {
    console.error(`B2 Part ${partNumber} Upload Error:`, error.message);
    return { success: false, error: error.message };
  }
};

exports.completeMultipartUpload = async (filePath, uploadId, parts) => {
  try {
    const s3 = binaryS3;
    const bucket = process.env.B2_BUCKET_NAME;
    const endpoint = process.env.B2_ENDPOINT;
    const scrubbedPath = sanitizePath(filePath);

    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: scrubbedPath,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
      },
    });
    await s3.send(command);
    
    // CDN/Proxy Configuration
    let url = `https://${endpoint}/${bucket}/${scrubbedPath}`;
    
    return { success: true, url };
  } catch (error) {
    console.error('B2 Multipart Complete Error:', error.message);
    return { success: false, error: error.message };
  }
};

exports.abortMultipartUpload = async (filePath, uploadId) => {
  try {
    const s3 = binaryS3;
    const bucket = process.env.B2_BUCKET_NAME;

    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: filePath,
      UploadId: uploadId,
    });
    await s3.send(command);
    return { success: true };
  } catch (error) {
    console.error('B2 Multipart Abort Error:', error.message);
    return { success: false, error: error.message };
  }
};
