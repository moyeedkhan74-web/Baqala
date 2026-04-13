const { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} = require('@aws-sdk/client-s3');

// Backblaze B2 S3-Compatible Client
const s3 = new S3Client({
  endpoint: `https://${process.env.B2_ENDPOINT}`, // e.g. s3.us-east-005.backblazeb2.com
  region: process.env.B2_REGION || 'us-east-005',
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
  forcePathStyle: true, 
});

const bucketName = process.env.B2_BUCKET_NAME;

exports.uploadToB2 = async (filePath, fileBuffer, contentType) => {
  try {
    if (!bucketName || !process.env.B2_ENDPOINT) {
      throw new Error('B2 configuration missing in environment variables');
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3.send(command);
    const publicUrl = `https://${bucketName}.${process.env.B2_ENDPOINT}/${filePath}`;

    return { success: true, url: publicUrl, path: filePath };
  } catch (error) {
    console.error('B2 Upload Error:', error.message);
    return { success: false, error: error.message };
  }
};

exports.deleteFromB2 = async (filePath) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    });

    await s3.send(command);
    return { success: true };
  } catch (error) {
    console.error('B2 Delete Error:', error.message);
    return { success: false, error: error.message };
  }
};

// --- Multipart Upload Support (Direct to Cloud, Zero Local Storage) ---

exports.startMultipartUpload = async (filePath, contentType) => {
  try {
    const command = new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: filePath,
      ContentType: contentType,
    });
    const { UploadId } = await s3.send(command);
    return { success: true, uploadId: UploadId };
  } catch (error) {
    console.error('B2 Multipart Start Error:', error.message);
    return { success: false, error: error.message };
  }
};

exports.uploadPart = async (filePath, uploadId, partNumber, body) => {
  try {
    const command = new UploadPartCommand({
      Bucket: bucketName,
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
    // parts should be [{ ETag: '...', PartNumber: 1 }, ...]
    const command = new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: filePath,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
      },
    });
    await s3.send(command);
    const publicUrl = `https://${bucketName}.${process.env.B2_ENDPOINT}/${filePath}`;
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('B2 Multipart Complete Error:', error.message);
    return { success: false, error: error.message };
  }
};

exports.abortMultipartUpload = async (filePath, uploadId) => {
  try {
    const command = new AbortMultipartUploadCommand({
      Bucket: bucketName,
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
