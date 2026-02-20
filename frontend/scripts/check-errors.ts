
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkErrors() {
    const { data, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name, ai_status, ai_explanation, execution_stage, created_at')
        .eq('ai_status', 'ERROR')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    console.log('Recent Errors:');
    data?.forEach(app => {
        console.log(`ID: ${app.id} | Name: ${app.candidate_name} | Stage: ${app.execution_stage}`);
        console.log(`Error: ${app.ai_explanation}`);
        console.log('---');
    });
}

checkErrors();
