const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');

const s3Config = {
  region: process.env.B2_PRIVATE_REGION || 'us-east-005',
  endpoint: `https://${process.env.B2_PRIVATE_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.B2_PRIVATE_KEY_ID,
    secretAccessKey: process.env.B2_PRIVATE_APP_KEY,
  },
  forcePathStyle: true,
};

const s3 = new S3Client(s3Config);

const log = (msg) => {
  console.log(`[ASSET PROXY] ${msg}`);
};

exports.proxyAsset = async (req, res) => {
  const { folder, filename } = req.params;
  const key = `${folder}/${filename}`;
  
  try {
    // Uses the bucket currently designated for public assets (the new account)
    const bucket = process.env.B2_PRIVATE_BUCKET;
    log(`Requesting asset: ${key} from bucket: ${bucket}`);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3.send(command);
    log(`Successfully fetched from B2: ${key} (Type: ${response.ContentType})`);

    // Set headers for browser rendering
    res.set('Content-Type', response.ContentType || 'image/webp');
    res.set('Content-Disposition', 'inline');
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
