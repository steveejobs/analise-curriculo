
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkStatus() {
    console.log('Checking application status...');
    const { data, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name, ai_status, execution_stage, heartbeat, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    console.table(data);

    const { data: counts, error: countError } = await supabase
        .from('job_applications')
        .select('ai_status')

    if (counts) {
        const stats = counts.reduce((acc: any, curr: any) => {
            acc[curr.ai_status] = (acc[curr.ai_status] || 0) + 1;
            return acc;
        }, {});
        console.log('Summary of ai_status:');
        console.table(stats);
    }
}

checkStatus();
