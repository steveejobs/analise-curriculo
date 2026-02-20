import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectSchema() {
    // Check job_applications columns
    const { data: appData, error: appError } = await supabase.from('job_applications').select('*').limit(1);
    if (appData && appData.length > 0) {
        console.log('--- Columns in job_applications ---');
        console.log(Object.keys(appData[0]));
    } else {
        console.log('job_applications table is empty, columns cannot be inspected this way.');
        // Try getting one even if it's there but empty
        const { data: columns } = await supabase.from('job_applications').select('*').limit(0);
        // PostgREST doesn't return keys for 0 rows usually
    }

    // Check candidates columns
    const { data: candData } = await supabase.from('candidates').select('*').limit(1);
    if (candData && candData.length > 0) {
        console.log('--- Columns in candidates ---');
        console.log(Object.keys(candData[0]));
    }

    // Since I can't use raw SQL easily, I'll rely on common patterns or previous SQL files
}

inspectSchema();
