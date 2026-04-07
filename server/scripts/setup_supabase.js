const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://uuoczotaitlitzgijltx.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1b2N6b3RhaXRsaXR6Z2lqbHR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIxOTg0MCwiZXhwIjoyMDkwNzk1ODQwfQ.cvz2zJK3AyK6z4li19lOcYtVv9IITlkd_TGUWSTzuQw";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setup() {
  try {
    console.log('--- SUPABASE AUTO-CONFIG START ---');
    console.log('Authenticating with Service Role...');

    const bucketName = 'Baqala';

    // 1. Check if Bucket Exists
    console.log(`Checking if bucket "${bucketName}" exists...`);
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;

    const existingBucket = buckets.find(b => b.name === bucketName);

    if (!existingBucket) {
      console.log(`Bucket "${bucketName}" not found. Creating it...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/octet-stream', 'application/vnd.android.package-archive', 'application/x-msdownload', 'application/zip'],
        fileSizeLimit: 200 * 1024 * 1024 // 200MB
      });
      if (createError) throw createError;
      console.log(`Bucket "${bucketName}" created successfully and set to PUBLIC.`);
    } else {
      console.log(`Bucket "${bucketName}" already exists. Updating to PUBLIC...`);
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true
      });
      if (updateError) throw updateError;
      console.log(`Bucket "${bucketName}" is now verified as PUBLIC.`);
    }

    console.log('\n--- SUCCESS! ---');
    console.log('Your Supabase Cloud is now configured for direct uploads.');
    console.log('You can now use the "Upload" button on your website.');

  } catch (err) {
    console.error('\n--- CONFIGURATION FAILED ---');
    console.error('Error Message:', err.message);
    if (err.status) console.error('Status Code:', err.status);
    console.log('\nHELP: If this failed, ensure the "Storage" service is enabled in your Supabase dashboard.');
  }
}

setup();
