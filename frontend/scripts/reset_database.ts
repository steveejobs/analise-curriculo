
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
    console.log('🚀 Starting Database Reset...');

    const tables = ['job_applications', 'jobs', 'analysis_configs', 'recruitment_criteria'];

    for (const table of tables) {
        console.log(`🧹 Clearing table: ${table}...`);
        // We delete all records by matching all IDs that are not null (common hack for Supabase delete all)
        const { error, count } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('not found')) {
                console.log(`ℹ️ Table ${table} skipped (not found).`);
            } else {
                console.error(`❌ Error clearing ${table}:`, error.message);
            }
        } else {
            console.log(`✅ Table ${table} cleared.`);
        }
    }

    console.log('✨ Data reset complete.');
}

run();
