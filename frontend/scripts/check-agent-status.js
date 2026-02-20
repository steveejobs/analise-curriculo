const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkStatus() {
    console.log('--- AI Agent Status Check ---');

    // 1. Pending analysis
    const { data: pending, error: pendingError } = await supabase
        .from('job_applications')
        .select('id, candidate_name, ai_status, execution_stage, created_at')
        .in('ai_status', ['PENDING', 'QUEUED_N8N', 'EXTRACTED', 'NEW', 'UPLOADING'])
        .order('created_at', { ascending: false });

    if (pendingError) {
        console.error('Error fetching pending:', pendingError);
    } else {
        console.log(`\nPending Candidates: ${pending.length}`);
        if (pending.length > 0) {
            console.table(pending.slice(0, 10).map(c => ({
                id: c.id,
                name: c.candidate_name,
                status: c.ai_status,
                stage: c.execution_stage,
                created: c.created_at
            })));
        }
    }

    // 2. Currently Analyzing (Checking for stuck ones)
    const { data: analyzing, error: analyzingError } = await supabase
        .from('job_applications')
        .select('id, candidate_name, ai_status, execution_stage, heartbeat, created_at')
        .eq('ai_status', 'ANALYZING');

    if (analyzingError) {
        console.error('Error fetching analyzing:', analyzingError);
    } else {
        console.log(`\nCurrently Analyzing: ${analyzing.length}`);
        if (analyzing.length > 0) {
            console.table(analyzing.map(c => ({
                id: c.id,
                name: c.candidate_name,
                stage: c.execution_stage,
                heartbeat: c.heartbeat,
                created: c.created_at
            })));
        }
    }

    // 3. Completed in last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: completedCount, error: completedError } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('ai_status', 'DONE')
        .gte('created_at', yesterday);

    if (completedError) {
        console.error('Error fetching completed:', completedError);
    } else {
        console.log(`\nCompleted in last 24h: ${completedCount}`);
    }

    process.exit(0);
}

checkStatus();
