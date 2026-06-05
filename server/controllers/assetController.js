const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3ConfigPrivate = {
  region: process.env.B2_PRIVATE_REGION || 'us-east-005',
  endpoint: `https://${process.env.B2_PRIVATE_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.B2_PRIVATE_KEY_ID,
    secretAccessKey: process.env.B2_PRIVATE_APP_KEY,
  },
  forcePathStyle: true,
};

const s3ConfigPublic = {
  region: process.env.B2_REGION || 'us-east-005',
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
  forcePathStyle: true,
};

const privateS3 = new S3Client(s3ConfigPrivate);
const publicS3 = new S3Client(s3ConfigPublic);

const log = (msg) => {
  console.log(`[ASSET PROXY] ${msg}`);
};

/**
 * Proxy asset via signed URL redirect.
 * Instead of streaming the file through Render (which can timeout on free tier),
 * we generate a short-lived signed URL and redirect the browser to it.
 * The browser then fetches the image directly from B2.
 */
exports.proxyAsset = async (req, res) => {
  const { folder, filename } = req.params;
  // Use the raw key directly — no scrubbing needed since the URL path IS the key
  const key = `${folder}/${filename}`;
  
  try {
    const isBinary = folder === 'apps';
    const isAvatar = folder === 'avatars';
    const s3 = isBinary ? publicS3 : privateS3;

    let bucket;
    if (isBinary) {
        bucket = process.env.B2_BUCKET_NAME;
    } else if (isAvatar) {
        bucket = process.env.B2_AVATAR_BUCKET || 'baqala.avatar';
    } else {
        bucket = process.env.B2_PRIVATE_BUCKET;
    }

    log(`Generating signed URL for: ${key} from bucket: ${bucket}`);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: isBinary ? `attachment; filename="${filename}"` : 'inline',
    });

    // Generate a signed URL valid for 1 hour
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // Set cache headers so the browser caches the redirect target
    res.set('Cache-Control', 'public, max-age=3500');
    
    // Redirect the browser to the signed URL — it fetches directly from B2
    res.redirect(302, signedUrl);
  } catch (error) {
    log(`ERROR generating signed URL for ${key}: ${error.message}`);
    res.status(404).json({ message: 'Asset not found', error: error.message });
  }
};

