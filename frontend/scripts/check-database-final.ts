import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log('--- JOBS ---');
    const { data: jobs } = await supabase.from('jobs').select('*');
    console.log(`Count: ${jobs?.length || 0}`);
    if (jobs && jobs.length > 0) console.log(JSON.stringify(jobs[0], null, 2));

    console.log('\n--- JOB APPLICATIONS ---');
    const { data: apps } = await supabase.from('job_applications').select('*');
    console.log(`Count: ${apps?.length || 0}`);
    if (apps && apps.length > 0) console.log(JSON.stringify(apps[0], null, 2));

    console.log('\n--- CANDIDATES ---');
    const { data: candidates } = await supabase.from('candidates').select('*');
    console.log(`Count: ${candidates?.length || 0}`);
}

check();
