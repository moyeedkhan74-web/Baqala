const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

const auditLog = (msg) => {
  const logMsg = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(path.join(__dirname, '..', 'b2-audit.log'), logMsg);
};

const { Readable } = require('stream');
const { extractB2Key } = require('../utils/b2Storage');

// ... rest of config ...

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

exports.proxyAsset = async (req, res) => {
  const { folder, filename } = req.params;
  const key = `${folder}/${filename}`;
  
  try {
    // Logic Swap Check: Binaries (apps) are in the PUBLIC bucket (Old Account)
    // Images (icons, screenshots) are in the PRIVATE bucket (New Account)
    const isBinary = folder === 'apps';
    const s3 = isBinary ? publicS3 : privateS3;
    const bucket = isBinary ? process.env.B2_BUCKET_NAME : process.env.B2_PRIVATE_BUCKET;

    // Use extractB2Key logic to ensure we are looking for the scrubbed version
    const scrubbedKey = extractB2Key(`/api/assets/${key}`);
    
    log(`Requesting asset: ${key} -> scrubbed as: ${scrubbedKey} from bucket: ${bucket}`);
    auditLog(`Fetching: ${scrubbedKey || key} from ${bucket}`);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: scrubbedKey || key,
    });

    const response = await s3.send(command);
    log(`Successfully fetched from B2: ${key} (Type: ${response.ContentType})`);

    // Set headers for browser rendering
    // For binaries, we might want to force attachment, but proxy is usually for viewing
    res.set('Content-Type', response.ContentType || (isBinary ? 'application/octet-stream' : 'image/webp'));
    res.set('Content-Disposition', isBinary ? `attachment; filename="${filename}"` : 'inline');
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year

    // Stream the body to response
    if (response.Body instanceof Readable) {
      response.Body.pipe(res);
    } else {
      const body = await response.Body.transformToByteArray();
      res.send(Buffer.from(body));
    }
  } catch (error) {
    log(`ERROR fetching asset ${key}: ${error.message}`);
    res.status(404).send('Asset not found');
  }
};
