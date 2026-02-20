import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listAllTables() {
    // We can use a trick to list tables if we have service role key:
    // Some supabase instances have a 'rpc' or we can try to query a system table
    // But actually, let's just try to query standard names and see which ones FAIL with 42P01

    const candidates = [
        'jobs', 'job_applications', 'candidates', 'screening_matrix',
        'JOBS', 'JOB_APPLICATIONS', 'CANDIDATES', 'SCREENING_MATRIX',
        'job', 'application', 'candidate', 'matrix'
    ];

    console.log('--- Checking for tables ---');
    for (const table of candidates) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (error) {
            console.log(`${table}: ${error.code} - ${error.message}`);
        } else {
            console.log(`${table}: FOUND`);
        }
    }
}

listAllTables();
