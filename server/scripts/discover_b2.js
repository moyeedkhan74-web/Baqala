const B2 = require('backblaze-b2');

const b2 = new B2({
  applicationKeyId: '0055395d1703bb60000000001',
  applicationKey: 'K005m9S30A7olGzK5EZwqZ/OkzFhl1o'
});

async function discover() {
  try {
    console.log('Authenticating with Backblaze B2 (using suspect-corrected keys)...');
    await b2.authorize();
    console.log('Successfully authorized.');

    const response = await b2.listBuckets();
    const buckets = response.data.buckets;

    console.log('\n--- DISCOVERED BUCKETS ---');
    buckets.forEach(bucket => {
      console.log(`Name: ${bucket.bucketName}`);
      console.log(`ID:   ${bucket.bucketId}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Discovery failed again:', error.message);
  }
}

discover();
