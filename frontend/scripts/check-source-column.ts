import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
    console.log('--- Checking Source Column ---');
    const { data, error } = await supabase.from('job_applications').select('source').limit(1);
    if (error) {
        console.log(`Error: ${error.message}`);
        if (error.message.includes('column "source" does not exist')) {
            console.log('❌ Coluna "source" NÃO existe.');
        }
    } else {
        console.log('✅ Coluna "source" encontrada.');
    }
}
check();
