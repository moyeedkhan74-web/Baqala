const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { S3Client, ListBucketsCommand, CreateMultipartUploadCommand } = require('@aws-sdk/client-s3');

async function testB2() {
  console.log('--- BACKBLAZE B2 DIAGNOSTIC ---');
  
  const config = {
    region: process.env.B2_PRIVATE_REGION || 'us-east-005',
    endpoint: `https://${process.env.B2_PRIVATE_ENDPOINT}`,
    credentials: {
      accessKeyId: process.env.B2_PRIVATE_KEY_ID,
      secretAccessKey: process.env.B2_PRIVATE_APP_KEY,
    }
  };

  console.log(`Checking Endpoint: ${config.endpoint}`);
  console.log(`Checking Bucket:   ${process.env.B2_PRIVATE_BUCKET}`);

  const s3 = new S3Client(config);

  try {
    console.log('\nStep 1: Testing Credentials...');
    // We don't list buckets as it might require master key, just try a small operation
    const testKey = `debug_${Date.now()}.txt`;
    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.B2_PRIVATE_BUCKET,
      Key: testKey
    });

    const res = await s3.send(command);
    console.log('✅ SUCCESS! Connection established. UploadID:', res.UploadId);
    console.log('\nYour credentials and endpoint are CORRECT.');
  } catch (err) {
    console.error('\n❌ FAILED!');
    console.error('Error Name:', err.name);
    console.error('Message:', err.message);
    
    if (err.name === 'CredentialsProviderError') {
      console.log('HINT: Your Key ID or App Key are invalid.');
    } else if (err.message.includes('ENOTFOUND')) {
      console.log('HINT: Your Endpoint URL is wrong.');
    } else if (err.name === 'NoSuchBucket') {
      console.log('HINT: The bucket name "'+process.env.B2_PRIVATE_BUCKET+'" does not exist in this region.');
    }
  }
}

testB2();
