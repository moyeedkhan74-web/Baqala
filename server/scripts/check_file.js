require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');

async function checkFile() {
  const s3 = new S3Client({
    region: 'us-east-005',
    endpoint: 'https://s3.us-east-005.backblazeb2.com',
    credentials: {
      accessKeyId: process.env.B2_APPLICATION_KEY_ID,
      secretAccessKey: process.env.B2_APPLICATION_KEY,
    },
    forcePathStyle: true,
  });

  try {
    const command = new HeadObjectCommand({
      Bucket: 'baqala',
      Key: 'icons/1777790820834_novaplay_icon.png.webp',
    });
    const response = await s3.send(command);
    console.log('✅ File Found!');
    console.log('Content-Type:', response.ContentType);
    console.log('Content-Disposition:', response.ContentDisposition);
    console.log('Metadata:', response.Metadata);
  } catch (err) {
    console.error('❌ Error checking file:', err.message);
  }
}

checkFile();
