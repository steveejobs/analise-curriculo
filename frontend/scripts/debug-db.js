
const { createClient } = require('@supabase/supabase-js');

// Hardcoded keys for this debug script to avoid reading .env issues
// These are from the .env.local file I read earlier
const SUPABASE_URL = 'https://eifzdkdsbhwkajxvmgjb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZnpka2RzYmh3a2FqeHZtZ2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NTI0MjIsImV4cCI6MjA4NjQyODQyMn0.tqHZeVT-xeWcP1HRWKt-pTXi02f8iAmBSwCRtMSWzQE';

async function main() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('--- Checking DB State ---');

    // 1. Count total candidates
    const { count, error: countError } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error counting:', countError);
        return;
    }
    console.log('Total Candidates in DB:', count);

    // 2. Check candidates that SHOULD be in Pup Line (triagem)
    // We check for:
    // - status = 'triagem'
    // - distinct by job_id to see distribution
    const { data: candidates, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name, job_id, pipeline_status, execution_stage, created_at')
        .eq('pipeline_status', 'triagem')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching triagem:', error);
        return;
    }

    console.log('\n--- Recent Candidates in TRIAGEM ---');
    if (candidates.length === 0) {
        console.log('No candidates found with pipeline_status = "triagem"');
    } else {
        console.table(candidates.map(c => ({
            name: c.candidate_name?.substring(0, 20),
            job_id: c.job_id,
            status: c.pipeline_status,
            stage: c.execution_stage,
            created: new Date(c.created_at).toISOString().split('T')[0]
        })));
    }

    // 3. Check for ANY candidate linked to a job
    const { data: withJob, error: jobError } = await supabase
        .from('job_applications')
        .select('id, candidate_name, job_id, pipeline_status')
        .not('job_id', 'is', null)
        .limit(5);

    console.log('\n--- Any Candidates with Job ID? ---');
    if (withJob && withJob.length > 0) {
        console.table(withJob.map(c => ({
            name: c.candidate_name?.substring(0, 20),
            job_id: c.job_id,
            status: c.pipeline_status
        })));
    } else {
        console.log('No candidates found with a Job ID.');
    }

}

main();
