import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
    console.log('--- 1. SELECT TEST ---');
    const sel = await supabase.from('jobs').select('*').limit(1);
    console.log('SELECT ERROR:', sel.error);
    console.log('SELECT DATA:', sel.data);

    console.log('\n--- 2. INSERT TEST ---');
    const ins = await supabase.from('jobs').insert({
        company_id: '00000000-0000-0000-0000-000000000000',
        title: 'TEST ' + Date.now(),
        description: 'test'
    });
    console.log('INSERT ERROR:', ins.error);
    console.log('INSERT STATUS:', ins.status);

    console.log('\n--- 3. SELECT AGAIN ---');
    const sel2 = await supabase.from('jobs').select('*');
    console.log('SELECT2 DATA:', sel2.data);
}
test();
