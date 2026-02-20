import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listTables() {
    const { data, error } = await supabase.rpc('get_tables'); // This might not work if RPC is not defined

    // Alternative: query a common table or just try to select from information_schema via RPC if possible
    // Since I can't do raw SQL easily without RPC, I'll try to select from standard tables I found in sql files
    const tables = ['jobs', 'job_applications', 'candidates', 'screening_matrix', 'companies'];

    console.log('--- Table Check ---');
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`${table}: Error or Not found (${error.message})`);
        } else {
            console.log(`${table}: ${count} rows`);
        }
    }
}

listTables();
