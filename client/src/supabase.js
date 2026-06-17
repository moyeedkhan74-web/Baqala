import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uuoczotaitlitzgijltx.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1b2N6b3RhaXRsaXR6Z2lqbHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTk4NDAsImV4cCI6MjA5MDc5NTg0MH0.joQ9eKrUZI6pZrBc2tKq4hl7Xt8ywDjdZPrZZ6J51Lg';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key missing in client environmental variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
