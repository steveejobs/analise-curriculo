import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
    const { data, error } = await supabase.from('jobs').select('*').limit(1);
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Columns:', Object.keys(data[0] || {}));
    }
}
check();
