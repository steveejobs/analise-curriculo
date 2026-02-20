import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('KEY EXISTS:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('KEY START:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10));
}

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
    const { data, error } = await supabase.from('jobs').select('*').limit(1);
    console.log('ERROR:', error);
    console.log('DATA:', data);
}
test();
