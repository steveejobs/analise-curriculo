
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log('--- Detailed Database Diagnostic ---');

    const { data: apps, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name, ai_status, ai_score, execution_stage, ai_explanation, criteria_evaluation')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching job_applications:', error);
    } else {
        console.log('Recent Job Applications (JSON):');
        apps.forEach(app => {
            console.log(JSON.stringify({
                id: app.id,
                name: app.candidate_name,
                status: app.ai_status,
                status_length: app.ai_status?.length,
                score: app.ai_score,
                stage: app.execution_stage,
                has_evaluation: !!app.criteria_evaluation
            }, null, 2));
        });
    }
}

check();
