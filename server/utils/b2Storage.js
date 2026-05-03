const { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand
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

const publicS3 = new S3Client(s3Config);

// Private Client (New Account - NOW FOR IMAGES)
const privateS3 = new S3Client({
  ...s3Config,
  region: process.env.B2_PRIVATE_REGION || 'us-east-005',
  endpoint: `https://${process.env.B2_PRIVATE_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.B2_PRIVATE_KEY_ID,
    secretAccessKey: process.env.B2_PRIVATE_APP_KEY,
  },
});

// --- HELPERS (INVERSED AS PER USER REQUEST) ---
// We swap the roles: 
// isPrivate=false (Images) -> now uses Private Account variables (privateS3 / B2_PRIVATE_BUCKET)
// isPrivate=true (Binaries/Apps) -> now uses Public Account variables (publicS3 / B2_BUCKET_NAME)

const getClient = (isPrivate) => isPrivate ? publicS3 : privateS3;
const getBucket = (isPrivate) => isPrivate ? process.env.B2_BUCKET_NAME : process.env.B2_PRIVATE_BUCKET;
const getEndpoint = (isPrivate) => isPrivate ? process.env.B2_ENDPOINT : process.env.B2_PRIVATE_ENDPOINT;

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

exports.uploadToB2 = async (filePath, fileBuffer, contentType, isPrivate = false) => {
  try {
    const s3 = getClient(isPrivate);
    const bucket = getBucket(isPrivate);
    const endpoint = getEndpoint(isPrivate);
    
    // Scrub the path globally before any operation
    const scrubbedPath = sanitizePath(filePath);

    if (!bucket || !endpoint) {
      throw new Error(`B2 ${isPrivate ? 'Private' : 'Public'} configuration missing`);
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: scrubbedPath,
      Body: fileBuffer,
      ContentType: contentType,
      ContentDisposition: (isPrivate || scrubbedPath.startsWith('apps/')) ? 'attachment' : 'inline',
      CacheControl: (isPrivate || scrubbedPath.startsWith('apps/')) ? 'no-cache' : 'public, max-age=31536000'
    });

    await s3.send(command);
    
    // GOD-MODE: Force direct URL for anything in apps/ folder, no exceptions
    let url;
    if (scrubbedPath.toLowerCase().includes('apps/')) {
      url = `https://${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${scrubbedPath}`;
    } else if (!isPrivate) {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://baqala-kwt6.onrender.com' 
        : `http://localhost:${process.env.PORT || 5000}`;
      url = `${baseUrl}/api/assets/${scrubbedPath}`;
    } else {
      url = `https://${endpoint}/${bucket}/${scrubbedPath}`;
    }

    return { success: true, url, path: scrubbedPath };
  } catch (error) {
    console.error(`B2 ${isPrivate ? 'Private' : 'Public'} Upload Error:`, error.message);
    return { success: false, error: error.message };
  }
};

exports.deleteFromB2 = async (filePath, isPrivate = false) => {
  try {
    const s3 = getClient(isPrivate);
    const bucket = getBucket(isPrivate);

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: filePath,
    });

    await s3.send(command);
    return { success: true };
  } catch (error) {
    console.error(`B2 ${isPrivate ? 'Private' : 'Public'} Delete Error:`, error.message);
    return { success: false, error: error.message };
  }
};

// --- Secure Download Support (For Private Bucket) ---

exports.getDownloadUrl = async (filePathOrUrl) => {
  try {
    // If a full URL is passed, extract the key first
    const key = filePathOrUrl.includes('/') && (filePathOrUrl.includes('http') || filePathOrUrl.includes('.com'))
      ? exports.extractB2Key(filePathOrUrl)
      : sanitizePath(filePathOrUrl);

    if (!key) throw new Error('Invalid file path or URL for download');

    // With the account swap, binaries now live in the OLD account (publicS3 / B2_BUCKET_NAME)
    const s3 = publicS3;
    const bucket = process.env.B2_BUCKET_NAME;

    console.log(`[B2_SIGN] Signing Key: "${key}" in Bucket: "${bucket}"`);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return { success: true, url: signedUrl };
  } catch (error) {
    console.error('B2 Signed URL Error:', error.message);
    return { success: false, error: error.message };
  }
};

// --- Multipart Upload Support (Always Private for Apps) ---

exports.startMultipartUpload = async (filePath, contentType, isPrivate = true) => {
  try {
    const s3 = getClient(isPrivate);
    const bucket = getBucket(isPrivate);
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

exports.uploadPart = async (filePath, uploadId, partNumber, body, isPrivate = true) => {
  try {
    const s3 = getClient(isPrivate);
    const bucket = getBucket(isPrivate);

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

exports.completeMultipartUpload = async (filePath, uploadId, parts, isPrivate = true) => {
  try {
    const s3 = getClient(isPrivate);
    const bucket = getBucket(isPrivate);
    const endpoint = getEndpoint(isPrivate);
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
    
    // GOD-MODE: Force direct URL for anything in apps/ folder, no exceptions
    let url;
    if (scrubbedPath.toLowerCase().includes('apps/')) {
      url = `https://${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${scrubbedPath}`;
    } else if (!isPrivate) {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://baqala-kwt6.onrender.com' 
        : `http://localhost:${process.env.PORT || 5000}`;
      url = `${baseUrl}/api/assets/${scrubbedPath}`;
    } else {
      url = `https://${endpoint}/${bucket}/${scrubbedPath}`;
    }
    
    return { success: true, url };
  } catch (error) {
    console.error('B2 Multipart Complete Error:', error.message);
    return { success: false, error: error.message };
  }
};

exports.abortMultipartUpload = async (filePath, uploadId, isPrivate = true) => {
  try {
    const s3 = getClient(isPrivate);
    const bucket = getBucket(isPrivate);

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
