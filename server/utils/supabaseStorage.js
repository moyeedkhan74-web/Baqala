const supabase = require('../config/supabase');

/**
 * Upload a file buffer to Supabase Storage
 * @param {string} path - The path in the bucket (e.g., 'pending/filename.apk')
 * @param {Buffer} buffer - File content
 * @param {string} contentType - MIME type
 * @returns {Promise<{success: boolean, url?: string, error?: any}>}
 */
exports.uploadToSupabase = async (path, buffer, contentType) => {
  try {
    const { data, error } = await supabase.storage
      .from('baqala') // Using 'baqala' bucket as seen in .env
      .upload(path, buffer, {
        contentType,
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('baqala')
      .getPublicUrl(path);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('[SUPABASE_STORAGE_ERROR]:', error);
    return { success: false, error };
  }
};

exports.deleteFromSupabase = async (path) => {
  try {
    const { error } = await supabase.storage
      .from('baqala')
      .remove([path]);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[SUPABASE_DELETE_ERROR]:', error);
    return { success: false, error };
  }
};
