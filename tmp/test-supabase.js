const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_KEY (exists):', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('Querying feedbacks table...');
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Error fetching feedbacks:', error);
    } else {
      console.log('Success! Feedbacks data:', data);
    }
  } catch (err) {
    console.error('Catch block error:', err);
  }
}

test();
