require('dotenv').config();
const { uploadToB2 } = require('../utils/b2Storage');
const fs = require('fs');
const path = require('path');

async function testPrivateB2() {
  console.log('--- Backblaze B2 Private Connectivity Test ---');
  console.log('Endpoint:', process.env.B2_PRIVATE_ENDPOINT);
  console.log('Bucket:', process.env.B2_PRIVATE_BUCKET);

  const testFilePath = path.join(__dirname, 'test_private_upload.txt');
  fs.writeFileSync(testFilePath, 'Hello from Baqala Private B2 Test!');

  try {
    const fileBuffer = fs.readFileSync(testFilePath);
    const result = await uploadToB2('tests/test_private_upload.txt', fileBuffer, 'text/plain', true);

    if (result.success) {
      console.log('✅ Success! Private file uploaded.');
      console.log('Private URL (expected to be restricted):', result.url);
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

testPrivateB2();
