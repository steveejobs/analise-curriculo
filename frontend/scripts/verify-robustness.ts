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

async function testRobustness() {
    console.log('🧪 Starting Robustness Verification...');

    // 1. Check if columns exist
    console.log('\n1. Checking database columns...');
    const { data: sample, error: checkError } = await supabase
        .from('job_applications')
        .select('heartbeat, execution_stage, extraction_quality, resume_hash')
        .limit(1);

    if (checkError) {
        console.error('❌ Database columns missing or inaccessible. DID YOU RUN THE SQL SCRIPT?');
        console.error(checkError.message);
        console.log('\n🔧 Sugestão: Execute o seguinte SQL no console do Supabase:');
        console.log('ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS resume_hash TEXT;');
    } else {
        console.log('✅ Database columns verified.');
    }

    // 2. Simulate stuck process
    console.log('\n2. Simulating a stuck process...');
    const stuckTime = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 mins ago

    // Create or find a record to simulate
    const { data: app, error: createError } = await supabase
        .from('job_applications')
        .insert({
            candidate_name: 'TEST_STUCK_RECOVERY',
            ai_status: 'ANALYZING',
            heartbeat: stuckTime,
            execution_stage: 'CRASHED_STEP'
        })
        .select()
        .single();

    if (createError) {
        console.error('❌ Error creating test record:', createError.message);
    } else {
        console.log(`✅ Test record created: ${app.id}. Now run the ai-agent and check if it recovers it.`);
    }

    // 3. Heuristics check
    console.log('\n3. Heuristics check (Manual)...');
    console.log('Use a small string to test heuristics in ai-agent log.');
}

testRobustness();
