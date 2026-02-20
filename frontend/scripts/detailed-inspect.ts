import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspect() {
    const tables = ['jobs', 'job_applications', 'candidates', 'screening_matrix', 'public.jobs', 'public.job_applications', 'public.candidates', 'public.screening_matrix'];

    console.log('--- Detailed Schema Inspection ---');
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`Table '${table}': ERROR ${error.code} - ${error.message}`);
        } else {
            console.log(`Table '${table}': FOUND (${count} rows)`);
        }
    }
}

inspect();
