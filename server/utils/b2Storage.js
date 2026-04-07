const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Backblaze B2 S3-Compatible Client
const s3 = new S3Client({
  endpoint: `https://${process.env.B2_ENDPOINT}`, // e.g. s3.us-east-005.backblazeb2.com
  region: process.env.B2_REGION || 'us-east-005',
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
  forcePathStyle: true, // Recommended for many S3-compatible providers
});

const bucketName = process.env.B2_BUCKET_NAME;

/**
 * Uploads a file buffer to Backblaze B2 via S3 API
 * @param {string} filePath - Target path in the bucket (e.g. 'apps/my-app.apk')
 * @param {Buffer} fileBuffer - The file content
 * @param {string} contentType - MIME type
 */
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
      // No ACL needed if the bucket is already set to Public in B2 Dashboard
    });

    await s3.send(command);

    // Return the public URL for the file
    // Format: https://<bucket>.<endpoint>/<path>
    const publicUrl = `https://${bucketName}.${process.env.B2_ENDPOINT}/${filePath}`;

    return { 
      success: true, 
      url: publicUrl,
      path: filePath 
    };
  } catch (error) {
    console.error('B2 Upload Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Deletes a file from Backblaze B2
 * @param {string} filePath - Path in the bucket
 */
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
