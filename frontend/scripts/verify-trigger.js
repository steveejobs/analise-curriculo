const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load env from frontend/.env
dotenv.config({ path: 'c:/Users/jarde/Desktop/Analise de Curriculo/frontend/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTrigger() {
    console.log('--- Testing Job-Specific AI Trigger ---');

    // 1. Find a candidate in the bank (no job_id)
    const { data: candidates, error: fetchError } = await supabase
        .from('job_applications')
        .select('id, candidate_name')
        .is('job_id', null)
        .limit(1);

    if (fetchError || !candidates || candidates.length === 0) {
        console.error('No bank candidates found to test with.');
        return;
    }

    const original = candidates[0];
    console.log(`Testing with candidate: ${original.candidate_name} (${original.id})`);

    // 2. Find a job to link to
    const { data: jobs, error: jobError } = await supabase
        .from('jobs')
        .select('id, title')
        .limit(1);

    if (jobError || !jobs || jobs.length === 0) {
        console.error('No jobs found in the database.');
        return;
    }

    const job = jobs[0];
    console.log(`Linking to job: ${job.title} (${job.id})`);

    // 3. Simulate the API call (Manual Insert because I can't easily call the API from node here without Auth)
    // Actually, I just want to see if MY logic in the API corresponds to what I expect.
    // I'll just check if the agent is RUNNING and if a PENDING record gets processed.

    console.log('\nSimulating Cloning to Job...');
    const { data: clone, error: insertError } = await supabase
        .from('job_applications')
        .insert([{
            candidate_name: `${original.candidate_name} (Test Job Link)`,
            job_id: job.id,
            pipeline_status: 'triagem',
            ai_status: 'PENDING', // This is what the API now does!
            resume_url: 'https://example.com/test-resume.pdf', // Dummy URL but agent needs one
            execution_stage: 'STARTING_JOB_ANALYSIS'
        }])
        .select()
        .single();

    if (insertError) {
        console.error('Insert error:', insertError);
        return;
    }

    console.log(`Clone created with ID: ${clone.id}. Status: ${clone.ai_status}`);
    console.log('Now watching for AI agent to pick it up...');

    // 4. Poll for status change
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(async () => {
        attempts++;
        const { data: updated, error: pollError } = await supabase
            .from('job_applications')
            .select('ai_status, execution_stage, ai_explanation')
            .eq('id', clone.id)
            .single();

        if (pollError) {
            console.error('Polling error:', pollError);
            clearInterval(interval);
            return;
        }

        console.log(`[Attempt ${attempts}] Status: ${updated.ai_status} | Stage: ${updated.execution_stage}`);

        if (updated.ai_status === 'DONE' || updated.ai_status === 'ERROR' || updated.ai_status === 'ANALYZING') {
            console.log('\nSUCCESS: Agent picked it up!');
            console.log('Explanation:', updated.ai_explanation);
            clearInterval(interval);
        } else if (attempts >= maxAttempts) {
            console.log('\nTimeout: Agent did not pick it up in time.');
            clearInterval(interval);
        }
    }, 5000);
}

testTrigger();
