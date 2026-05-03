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

const publicS3 = new S3Client(s3Config);

// Private Client (New Account - For Apps)
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
// isPrivate=false (Images) -> now uses Private Account variables
// isPrivate=true (Binaries) -> now uses Public Account variables

const getClient = (isPrivate) => isPrivate ? publicS3 : privateS3;
const getBucket = (isPrivate) => isPrivate ? process.env.B2_BUCKET_NAME : process.env.B2_PRIVATE_BUCKET;
const getEndpoint = (isPrivate) => isPrivate ? process.env.B2_ENDPOINT : process.env.B2_PRIVATE_ENDPOINT;

// --- ACTIONS ---

exports.uploadToB2 = async (filePath, fileBuffer, contentType, isPrivate = false) => {
  try {
    const s3 = getClient(isPrivate);
    const bucket = getBucket(isPrivate);
    const endpoint = getEndpoint(isPrivate);

    if (!bucket || !endpoint) {
      throw new Error(`B2 ${isPrivate ? 'Private' : 'Public'} configuration missing`);
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
      Body: fileBuffer,
      ContentType: contentType,
      ContentDisposition: isPrivate ? 'attachment' : 'inline',
      CacheControl: isPrivate ? 'no-cache' : 'public, max-age=31536000'
    });

    await s3.send(command);
    
    // Optimized URL Generation: Server-Side Proxy for maximum reliability
    let url;
    if (!isPrivate) {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://baqala-kwt6.onrender.com' 
        : `http://localhost:${process.env.PORT || 5000}`;
      url = `${baseUrl}/api/assets/${filePath}`;
    } else {
      url = `https://${endpoint}/${bucket}/${filePath}`;
    }

    return { success: true, url, path: filePath };
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

exports.getDownloadUrl = async (filePath) => {
  try {
    // With the account swap, binaries now live in the OLD account (publicS3 / B2_BUCKET_NAME)
    const s3 = publicS3;
    const bucket = process.env.B2_BUCKET_NAME;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: filePath,
    });

    // Generate a signed URL valid for 1 hour (3600 seconds)
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

    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: filePath,
      ContentType: contentType,
      ContentDisposition: 'attachment',
    });
    const { UploadId } = await s3.send(command);
    return { success: true, uploadId: UploadId };
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

    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: filePath,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
      },
    });
    await s3.send(command);
    
    let url;
    if (endpoint.includes('backblazeb2.com')) {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://baqala-kwt6.onrender.com' 
        : `http://localhost:${process.env.PORT || 5000}`;
      url = `${baseUrl}/api/assets/${filePath}`;
    } else {
      url = `https://${endpoint}/${bucket}/${filePath}`;
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
