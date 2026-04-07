const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'Baqala';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a file buffer to Supabase Storage
 * @param {string} filePath - Path in the bucket (e.g. 'apps/my-app.apk')
 * @param {Buffer} fileBuffer - The file content
 * @param {string} contentType - MIME type
 */
exports.uploadToSupabase = async (filePath, fileBuffer, contentType) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) throw error;

    // Get Public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { 
      success: true, 
      url: urlData.publicUrl,
      path: data.path 
    };
  } catch (error) {
    console.error('Supabase Upload Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Deletes a file from Supabase Storage
 * @param {string} filePath - Path in the bucket
 */
exports.deleteFromSupabase = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Supabase Delete Error:', error.message);
    return { success: false, error: error.message };
  }
};
