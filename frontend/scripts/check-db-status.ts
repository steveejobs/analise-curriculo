import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkStatus() {
    const { data, error } = await supabase
        .from('job_applications')
        .select('ai_status', { count: 'exact' });

    if (error) {
        console.error('❌ Error fetching status:', error.message);
        return;
    }

    const counts = data.reduce((acc: any, app: any) => {
        acc[app.ai_status] = (acc[app.ai_status] || 0) + 1;
        return acc;
    }, {});

    console.log('--- Candidate Status Summary ---');
    console.log(counts);
}

checkStatus();
