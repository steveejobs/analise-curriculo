
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runFix() {
    console.log('🚀 Ensuring pipeline_status column exists in job_applications...');

    const { error: colError } = await supabase.rpc('execute_sql', {
        sql: "ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'triagem';"
    });

    if (colError) {
        console.error('   ❌ Error adding column:', colError.message);
    } else {
        console.log('   ✅ pipeline_status column ensured.');
    }

    console.log('🚀 Migrating existing ai_status to pipeline_status...');

    // We update only those that are NULL to avoid overwriting manual progress
    const { error: migError } = await supabase.rpc('execute_sql', {
        sql: `
            UPDATE job_applications 
            SET pipeline_status = LOWER(ai_status) 
            WHERE pipeline_status IS NULL OR pipeline_status = 'triagem' AND ai_status IS NOT NULL;
        `
    });

    if (migError) {
        console.error('   ❌ Error migrating data:', migError.message);
    } else {
        console.log('   ✅ Data migration completed.');
    }
}

runFix().catch(console.error);
