
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
    console.log('🚀 Starting Database Migration...');

    // 1. Add pipeline_status column
    console.log('   - Checking pipeline_status column...');
    const { error: colError } = await supabase.rpc('execute_sql', {
        sql: "ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'pending';"
    });

    if (colError) {
        console.warn('   ⚠️ Could not add column via RPC (maybe RPC is not enabled).');
        console.warn('   Details:', colError.message);
    } else {
        console.log('   ✅ pipeline_status column verified/added.');
    }

    // 2. Reset stuck candidates
    console.log('   - Resetting stuck candidates (ANALYZING for > 10m)...');
    const slowTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count, error: resetError } = await supabase
        .from('job_applications')
        .update({ ai_status: 'PENDING', execution_stage: 'RESET_STUCK' })
        .eq('ai_status', 'ANALYZING')
        .lt('heartbeat', slowTime);

    if (resetError) {
        console.error('   ❌ Error resetting candidates:', resetError.message);
    } else {
        console.log(`   ✅ Reset ${count || 0} stuck candidates.`);
    }

    console.log('🏁 Migration finished.');
}

runMigration().catch(console.error);
