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
  // Catch-all route params are in req.params[0]
  const key = req.params[0];
  
  if (!key) return res.status(400).json({ message: 'Asset key missing' });

  try {
    const isAvatar = key.startsWith('avatars/');
    // Real app binaries are in apps/ but NOT in apps/screenshots/
    const isAppBinary = key.startsWith('apps/') && !key.startsWith('apps/screenshots/');
    
    // Binaries use publicS3, everything else (images) uses privateS3 by default
    const s3 = isAppBinary ? publicS3 : privateS3;

    let bucket;
    if (isAppBinary) {
        bucket = process.env.B2_BUCKET_NAME;
    } else if (isAvatar) {
        bucket = process.env.B2_AVATAR_BUCKET || 'baqala.avatar';
    } else {
        // Covers icons/, banners/, screenshots/, and legacy apps/screenshots/
        bucket = process.env.B2_PRIVATE_BUCKET;
    }

    log(`Generating signed URL for: ${key} | Bucket: ${bucket} | Type: ${isAppBinary ? 'Binary' : 'Image'}`);

    const filename = key.split('/').pop();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: isAppBinary ? `attachment; filename="${filename}"` : 'inline',
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

