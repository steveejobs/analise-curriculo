import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exhaustCheck() {
    // Try to get all table names from a common pattern or a known RPC if it exists
    // Since I can't do raw SQL without RPC, I'll try to check if there's an RPC for sql
    const { data: tables, error } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');

    if (error) {
        console.log('❌ Cannot query information_schema directly via PostgREST (expected).');
    }

    // Let's try to check the 'jobs' table more specifically, maybe with a limit and no filter
    const { data: jobs } = await supabase.from('jobs').select('*');
    console.log('Jobs:', jobs);

    const { data: apps } = await supabase.from('job_applications').select('*');
    console.log('Applications:', apps);
}

exhaustCheck();
