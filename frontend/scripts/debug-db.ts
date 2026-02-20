import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    console.log('--- DB TEST ---');
    const res = await supabase.from('jobs').insert({
        company_id: '00000000-0000-0000-0000-000000000000',
        title: 'TEST ' + Date.now(),
        description: 'test'
    }).select();

    console.log('INSERT RESULT:', JSON.stringify(res, null, 2));

    const list = await supabase.from('jobs').select('id, title');
    console.log('LIST RESULT:', JSON.stringify(list, null, 2));
}
run();
