
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    const { data: apps, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name, ai_status, ai_explanation, resume_url, criteria_evaluation')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`\nFound ${apps?.length || 0} applications total.`);
    apps?.forEach(app => {
        const hasAnalysis = app.criteria_evaluation ? '✅ YES' : '❌ NO';
        console.log(`[${app.ai_status}] Name: ${app.candidate_name || 'No Name'} (ID: ${app.id.substring(0, 8)})`);
        console.log(`   Explanation: ${app.ai_explanation}`);
        console.log(`   Has Analysis Data: ${hasAnalysis}`);
        console.log(`   Resume: ${app.resume_url}`);
        console.log('---');
    });
}

diagnose();
