require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');

async function migrateBuckets() {
  const oldS3 = new S3Client({
    region: process.env.B2_REGION || 'us-east-005',
    endpoint: `https://${process.env.B2_ENDPOINT}`,
    credentials: {
      accessKeyId: process.env.B2_APPLICATION_KEY_ID,
      secretAccessKey: process.env.B2_APPLICATION_KEY,
    },
    forcePathStyle: true,
  });

  const newS3 = new S3Client({
    region: process.env.B2_PRIVATE_REGION || 'us-east-005',
    endpoint: `https://${process.env.B2_PRIVATE_ENDPOINT}`,
    credentials: {
      accessKeyId: process.env.B2_PRIVATE_KEY_ID,
      secretAccessKey: process.env.B2_PRIVATE_APP_KEY,
    },
    forcePathStyle: true,
  });

  const oldBucket = process.env.B2_BUCKET_NAME;
  const newBucket = process.env.B2_PRIVATE_BUCKET;

  console.log(`🚀 Starting migration from ${oldBucket} to ${newBucket}...`);

  try {
    const listCommand = new ListObjectsV2Command({ Bucket: oldBucket });
    const { Contents } = await oldS3.send(listCommand);

    if (!Contents || Contents.length === 0) {
      console.log('No files found in old bucket.');
      return;
    }

    for (const file of Contents) {
      if (file.Key.startsWith('icons/') || file.Key.startsWith('screenshots/')) {
        console.log(`Copying ${file.Key}...`);
        
        // Fetch from old
        const getCommand = new GetObjectCommand({ Bucket: oldBucket, Key: file.Key });
        const { Body, ContentType } = await oldS3.send(getCommand);
        
        const chunks = [];
        for await (const chunk of Body) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Upload to new
        const putCommand = new PutObjectCommand({
          Bucket: newBucket,
          Key: file.Key,
          Body: buffer,
          ContentType: ContentType,
          ContentDisposition: 'inline',
        });
        await newS3.send(putCommand);
        console.log(`✅ Success: ${file.Key}`);
      }
    }
    console.log('🎉 Migration finished!');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  }
}

migrateBuckets();
