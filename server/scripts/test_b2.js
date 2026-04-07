require('dotenv').config();
const { uploadToB2 } = require('../utils/b2Storage');
const fs = require('fs');
const path = require('path');

async function testB2() {
  console.log('--- Backblaze B2 Connectivity Test ---');
  console.log('Endpoint:', process.env.B2_ENDPOINT);
  console.log('Bucket:', process.env.B2_BUCKET_NAME);

  const testFilePath = path.join(__dirname, 'test_upload.txt');
  fs.writeFileSync(testFilePath, 'Hello from Baqala B2 Test!');

  try {
    const fileBuffer = fs.readFileSync(testFilePath);
    const result = await uploadToB2('tests/test_upload.txt', fileBuffer, 'text/plain');

    if (result.success) {
      console.log('✅ Success! File uploaded.');
      console.log('Public URL:', result.url);
    } else {
      console.log('❌ Failed!');
      console.log('Error:', result.error);
    }
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

testB2();
