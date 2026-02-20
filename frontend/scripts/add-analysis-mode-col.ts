
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
    console.log('🚀 Adding analysis_mode column to job_applications...');

    const { error } = await supabase.rpc('execute_sql', {
        sql: "ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS analysis_mode TEXT DEFAULT 'normal';"
    });

    if (error) {
        console.error('   ❌ Error adding column:', error.message);
    } else {
        console.log('   ✅ analysis_mode column added successfully.');
    }
}

runMigration().catch(console.error);
