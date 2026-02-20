import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function inspect() {
    console.log('--- Column Inspection ---');
    // PostgREST doesn't allow direct query of information_schema usually
    // But we can try to get it via RPC or just check if we can get anything from a known table

    // Let's try to find ANY row in ANY table to see what's there
    const tables = ['job_applications', 'jobs', 'candidates', 'screening_matrix'];
    for (const t of tables) {
        const { data, error } = await supabase.from(t).select('*').limit(1);
        if (data && data.length > 0) {
            console.log(`Columns in ${t}:`, Object.keys(data[0]));
        } else if (error) {
            console.log(`Error in ${t}:`, error.message);
        } else {
            console.log(`${t} is empty.`);
        }
    }
}
inspect();
