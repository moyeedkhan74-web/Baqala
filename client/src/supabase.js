import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uuoczotaitlitzgijltx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1b2N6b3RhaXRsaXR6Z2lqbHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTk4NDAsImV4cCI6MjA5MDc5NTg0MH0.joQ9eKrUZI6pZrBc2tKq4hl7Xt8ywDjdZPrZZ6J51Lg";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadFileDirectly = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
};
