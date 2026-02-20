
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data: app, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name, ai_status, criteria_evaluation')
        .eq('id', 'd280fa9d-8ca5-47a4-acf2-c02e5538d6b2')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Evaluation Data for Marketing Candidate:');
        console.log(JSON.stringify(app.criteria_evaluation, null, 2));
    }
}

check();
