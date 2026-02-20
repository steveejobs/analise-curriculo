import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
    console.log('--- Checking Tables ---');
    const tables = ['jobs', 'job_applications', 'candidates', 'screening_matrix'];
    for (const t of tables) {
        const { data, error, count } = await supabase.from(t).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`${t}: ERROR ${error.code} - ${error.message}`);
        } else {
            console.log(`${t}: FOUND, ${count} rows`);
        }
    }
}
check();
