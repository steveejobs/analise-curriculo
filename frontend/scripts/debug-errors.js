const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugErrors() {
    console.log('🔍 Checking for applications with errors (JS version)...\n');

    const { data: apps, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name, candidate_email, resume_url, ai_status, execution_stage, ai_explanation, created_at')
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
        console.log(`URL: ${app.resume_url}`);
        console.log(`Explanation: ${app.ai_explanation}`);
        console.log(`Created At: ${app.created_at}`);
    });
    console.log(`--------------------------------------------------\n`);
}

debugErrors();
