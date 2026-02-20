
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

async function resetApps() {
    const { error } = await supabase
        .from('job_applications')
        .update({
            ai_status: 'PENDING',
            execution_stage: 'RESET_FOR_TEST',
            ai_explanation: null,
            criteria_evaluation: null
        })
        .match({ ai_status: 'ERROR' }); // Reset only errors to be safe

    if (error) {
        console.error('Error resetting apps:', error);
    } else {
        console.log('Successfully reset all applications to PENDING.');
    }
}

resetApps();
