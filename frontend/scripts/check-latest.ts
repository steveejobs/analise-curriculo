import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkLatest() {
    const { data: jobs } = await supabase.from('jobs').select('id, title, created_at').order('created_at', { ascending: false }).limit(1);
    const { data: apps } = await supabase.from('job_applications').select('id, candidate_name, ai_status, created_at').order('created_at', { ascending: false }).limit(1);

    console.log('Latest Job:', jobs?.[0]);
    console.log('Latest Application:', apps?.[0]);
}

checkLatest();
