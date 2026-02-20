import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectTable(tableName: string) {
    console.log(`\n--- Inspecting table: ${tableName} ---`);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error) {
        console.error(`❌ Error fetching from ${tableName}:`, error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log(`Columns in ${tableName}:`, Object.keys(data[0]));
    } else {
        console.log(`${tableName} table is empty.`);
    }
}

async function main() {
    await inspectTable('jobs');
    await inspectTable('job_applications');
    await inspectTable('screening_matrix');
    await inspectTable('candidates');
}

main();
