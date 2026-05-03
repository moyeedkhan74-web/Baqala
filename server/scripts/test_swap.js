require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

async function testNewAccount() {
  const s3 = new S3Client({
    region: process.env.B2_PRIVATE_REGION || 'us-east-005',
    endpoint: `https://${process.env.B2_PRIVATE_ENDPOINT}`,
    credentials: {
      accessKeyId: process.env.B2_PRIVATE_KEY_ID,
      secretAccessKey: process.env.B2_PRIVATE_APP_KEY,
    },
    forcePathStyle: true,
  });

  const testFile = path.join(__dirname, 'test_new_img.txt');
  fs.writeFileSync(testFile, 'Testing images in the new account bucket.');

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.B2_PRIVATE_BUCKET,
      Key: 'tests/img_test.txt',
      Body: fs.readFileSync(testFile),
      ContentType: 'text/plain',
      ACL: 'public-read',
    });

    await s3.send(command);
    console.log('✅ Success! Uploaded to private bucket with public-read.');
    
    // Check if reachable
    const url = `https://${process.env.B2_PRIVATE_BUCKET}.s3.${process.env.B2_PRIVATE_REGION}.backblazeb2.com/tests/img_test.txt`;
    console.log('Test URL:', url);
  } catch (err) {
    console.error('❌ Failed:', err.message);
  } finally {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  }
}

testNewAccount();
