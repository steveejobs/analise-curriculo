
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceKey);
const supabasePublic = createClient(supabaseUrl, anonKey);

async function run() {
    console.log('--- ADMIN CHECK ---');
    const { data: statsAdmin, count: statsCount } = await supabaseAdmin.from('job_statistics').select('*', { count: 'exact' });
    console.log('job_statistics count (Admin):', statsCount);
    console.log('job_statistics sample:', statsAdmin?.slice(0, 5));

    const { count: appCountAdmin } = await supabaseAdmin.from('job_applications').select('*', { count: 'exact', head: true });
    console.log('job_applications total count (Admin):', appCountAdmin);

    console.log('\n--- PUBLIC CHECK (Anon Key) ---');
    const { data: statsPublic, error: statsError } = await supabasePublic.from('job_statistics').select('*');
    if (statsError) console.error('job_statistics error (Public):', statsError.message);
    else console.log('job_statistics count (Public):', statsPublic?.length);

    const { count: appCountPublic, error: appError } = await supabasePublic.from('job_applications').select('*', { count: 'exact', head: true });
    if (appError) console.error('job_applications error (Public):', appError.message);
    else console.log('job_applications total count (Public):', appCountPublic);
}

run();
