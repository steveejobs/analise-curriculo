import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugErrors() {
    console.log('🔍 Checking for applications with errors...\n');

    const { data: apps, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name, candidate_email, ai_status, execution_stage, ai_explanation, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ Error fetching data:', error.message);
        return;
    }

    if (!apps || apps.length === 0) {
        console.log('No applications found.');
        return;
    }

    apps.forEach(app => {
        console.log(`--------------------------------------------------`);
        console.log(`ID: ${app.id}`);
        console.log(`Candidate: ${app.candidate_name}`);
        console.log(`Status: ${app.ai_status}`);
        console.log(`Stage: ${app.execution_stage}`);
        console.log(`Explanation: ${app.ai_explanation}`);
        console.log(`Created At: ${app.created_at}`);
    });
    console.log(`--------------------------------------------------\n`);
}

debugErrors();
